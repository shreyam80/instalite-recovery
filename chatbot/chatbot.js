import dotenv from "dotenv";
dotenv.config();

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { get_db_connection } from "./rdbms.js";
import { get_vector_store } from "./installite_backend/vector.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY in environment.");
}

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
  openAIApiKey: apiKey
});

const llm = new OpenAI({
  temperature: 0.7,
  openAIApiKey: apiKey
});

export async function queryMovieData() {
  const db = get_db_connection();
  await db.connect();
  const [rows] = await db.send_sql("SELECT id, title, description FROM movies");
  return rows;
}

export async function computeEmbeddings(text) {
  try {
    return await embeddings.embedQuery(text);
  } catch (err) {
    console.error("Embedding error:", err);
    return null;
  }
}

export async function storeEmbeddings(embedding, metadata, vectorDB) {
  await vectorDB.add({
    ids: [metadata.id.toString()],
    embeddings: [embedding],
    metadatas: [metadata]
  });
}

export async function updateEmbeddings(vectorDB) {
  const movies = await queryMovieData();
  for (const movie of movies) {
    const text = `${movie.title}: ${movie.description}`;
    const embedding = await computeEmbeddings(text);
    if (embedding) {
      await storeEmbeddings(embedding, movie, vectorDB);
    }
  }
}

export async function topFive(query, vectorDB) {
  const embedding = await computeEmbeddings(query);
  if (!embedding) return [];
  return await vectorDB.similaritySearchVectorWithScore(embedding, 5);
}

export async function getAnswer(question, vectorDB) {
  const results = await topFive(question, vectorDB);

  const context = results
    .map(r => `${r.metadata.title}: ${r.metadata.description}`)
    .join("\n");

  const prompt = `Answer the question based on the following context:

Context:
${context}

Question: ${question}

Answer:`;

  const response = await llm.call(prompt);
  return response;
}

export async function initVectorDB() {
  return await get_vector_store("movie-text");
}
