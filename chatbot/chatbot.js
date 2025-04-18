import dotenv from "dotenv";
dotenv.config();
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { Chroma } from "langchain/vectorstores/chroma";
import { get_db_connection } from "../server/models/rdbms.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
  openAIApiKey: apiKey
});

const llm = new OpenAI({
  temperature: 0.7,
  openAIApiKey: apiKey
});

async function get_vector_store(collectionName) {
  const url = process.env.CHROMADB_ENDPOINT || "http://localhost:8000";
  try {
    return await Chroma.fromExistingCollection(embeddings, { collectionName, url });
  } catch (err) {
    return await Chroma.fromDocuments([], embeddings, { collectionName, url });
  }
}

export async function queryMovieData(dbConfig) {
  // dbConfig is accepted for signature compatibility; our rdbms.js uses its own config.
  const db = get_db_connection();
  await db.connect();
  const [rows] = await db.send_sql("SELECT id, title, description FROM movies");
  return rows;
}

export async function computeEmbeddings(text) {
  try {
    return await embeddings.embedQuery(text);
  } catch (error) {
    console.error("Embedding error:", error);
    return null;
  }
}

export async function storeEmbeddings(embedding, metadata, vectorDB) {
  await vectorDB.add({
    ids: [metadata.id.toString()],
    embeddings: [embedding],
    metadatas: [metadata]
  });
  return { success: true };
}

export async function updateEmbeddings(dbConfig, vectorDB) {
  const movies = await queryMovieData(dbConfig);
  for (const movie of movies) {
    const text = `${movie.title}: ${movie.description}`;
    const emb = await computeEmbeddings(text);
    if (emb) await storeEmbeddings(emb, movie, vectorDB);
  }
  return { success: true };
}

export async function topK(query, vectorDB) {
  const emb = await computeEmbeddings(query);
  if (!emb) return [];
  const results = await vectorDB.similaritySearchVectorWithScore(emb, 5);
  return results.map(([doc, score]) => ({
    id: doc.metadata.id || "unknown",
    metadata: doc.metadata,
    score
  }));
}

export async function getAnswer(question, dbConfig, vectorDB) {
  const results = await topK(question, vectorDB);
  const context = results
    .map(rec => `${rec.metadata.title}: ${rec.metadata.description}`)
    .join("\n");
  const prompt = `Answer the question based on the following context:\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
  return await llm.call(prompt);
}

export async function initVectorDB() {
  return await get_vector_store("movie-text");
}
