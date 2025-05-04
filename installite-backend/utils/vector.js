// utils/vector.js

import dotenv from 'dotenv';
dotenv.config();

import { ChromaClient } from 'chromadb';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as OpenAIModule from "@langchain/openai";
const OpenAIEmbeddings = OpenAIModule.OpenAIEmbeddings;
import { get_db_connection } from '../../server/models/rdbms.js';

// ─────────────────────────────────────────────────────────────────────────────
// FACE-MATCHING (profile selfies → actor profiles) via low-level ChromaClient
// ─────────────────────────────────────────────────────────────────────────────

const client = new ChromaClient({
  path: process.env.CHROMA_URL || 'http://localhost:8000'
});
const FACE_COLLECTION = 'actors';
let faceCollection = null;

async function ensureFaceCollectionExists() {
  if (faceCollection) return faceCollection;
  try {
    faceCollection = await client.getCollection({ name: FACE_COLLECTION });
    console.log(`ℹ️ Reusing existing collection "${FACE_COLLECTION}"`);
  } catch {
    console.log(`⚠️ Collection "${FACE_COLLECTION}" not found; creating it...`);
    faceCollection = await client.createCollection({ name: FACE_COLLECTION });
    console.log(`✅ Created collection "${FACE_COLLECTION}"`);
  }
  return faceCollection;
}

/**
 * Store a user’s selfie embedding in Chroma under their userId.
 */
export async function storeUserEmbedding(userId, embedding) {
  const coll = await ensureFaceCollectionExists();
  await coll.add({
    ids: [userId],
    embeddings: [embedding],
  });
  console.log(`✅ Stored embedding for user ${userId}`);
}

/**
 * Given a new selfie embedding, return the top-n most similar actors.
 */
export async function getTopFaceMatches(embedding, n = 5) {
  const coll = await ensureFaceCollectionExists();
  const { ids, distances, metadatas } = await coll.query({
    queryEmbeddings: [embedding],
    nResults:       n,
    include:        ['distances', 'metadatas'],
  });

  return ids[0].map((id, i) => ({
    nconst:   id,
    name:     metadatas[0][i]?.name,
    imageUrl: metadatas[0][i]?.imageUrl,
    distance: distances[0][i],
  }));
}


// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT RETRIEVAL (text embeddings → LangChain retriever → Q&A)
// ─────────────────────────────────────────────────────────────────────────────

let retriever = null;
let reviewRetriever = null;

export async function loadRetrievers() {
  const embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-ada-002" });
  const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

  const actorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: "actor_movie_roles",
    url: CHROMA_URL,
  });

  const reviewStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: "movie_reviews",
    url: CHROMA_URL,
  });

  retriever = actorStore.asRetriever();
  reviewRetriever = reviewStore.asRetriever();

  console.log("Loaded retrievers from existing Chroma collections.");
}

export async function retrieveRelevantDocs(query) {
  if (!retriever || !reviewRetriever) {
    throw new Error("Retrievers not initialized – call `loadRetrievers()` first.");
  }

  const [actorDocs, reviewDocs] = await Promise.all([
    retriever.getRelevantDocuments(query),
    reviewRetriever.getRelevantDocuments(query)
  ]);

  return [...actorDocs, ...reviewDocs];
}

let retrieversInitialized = false;

export async function ensureRetrieversReady() {
  if (!retrieversInitialized) {
    console.log("Loading Chroma retrievers...");
    await loadRetrievers(); // this is fast
    retrieversInitialized = true;
  }
}


// // utils/vector.js
// import { ChromaClient } from 'chromadb'; // must be installed via npm
// import dotenv from 'dotenv';
// dotenv.config();

// const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
// const COLLECTION_NAME = 'actors';

// let collection = null;

// export async function ensureCollectionExists() {
//   if (collection) return collection;

//   try {
//     // Try to get existing collection
//     collection = await client.getCollection({ name: COLLECTION_NAME });
//     console.log(`ℹ️ Reusing existing collection "${COLLECTION_NAME}"`);
//   } catch (err) {
//     // If not found, create it
//     console.log(`⚠️ Collection "${COLLECTION_NAME}" not found, creating it...`);
//     collection = await client.createCollection({ name: COLLECTION_NAME });
//     console.log(`✅ Created collection "${COLLECTION_NAME}"`);
//   }

//   return collection;
// }

// export async function storeUserEmbedding(userId, embedding) {
//   const coll = await ensureCollectionExists();
//   try {
//     await coll.add({
//       ids: [userId],
//       embeddings: [embedding],
//     });
//     console.log(`✅ Stored embedding for user ${userId}`);
//   } catch (error) {
//     console.error("❌ Error storing embedding:", error.message);
//     throw error;
//   }
// }

// export async function getTopActorMatches(embedding) {
//     // grab the seeded 'actors' collection
//     const coll = await ensureCollectionExists();
  
//     // perform the similarity query
//     const response = await coll.query({
//       queryEmbeddings: [embedding],
//       nResults: 5,
//       include: ['distances', 'metadatas'],
//     });
  
//     // map into a nice array of matches
//     return response.ids[0].map((id, i) => ({
//       nconst:   id,
//       name:     response.metadatas[0][i]?.name,
//       imageUrl: response.metadatas[0][i]?.imageUrl,
//       distance: response.distances[0][i],
//     }));
//   }

// utils/vector.js
// import { ChromaClient } from 'chromadb';
// import dotenv from 'dotenv';
// dotenv.config();

// const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
// const COLLECTION_NAME = 'faces';  // must match what you used in index_data.js

// let collection = null;

// export async function ensureCollectionExists() {
//   if (collection) return collection;

//   try {
//     collection = await client.getCollection({ name: COLLECTION_NAME });
//     console.log(`ℹ️ Reusing existing collection "${COLLECTION_NAME}"`);
//   } catch (err) {
//     console.log(`⚠️ Collection "${COLLECTION_NAME}" not found, creating it...`);
//     collection = await client.createCollection({ name: COLLECTION_NAME });
//     console.log(`✅ Created collection "${COLLECTION_NAME}"`);
//   }

//   return collection;
// }

// export async function storeUserEmbedding(userId, embedding) {
//   const coll = await ensureCollectionExists();
//   try {
//     await coll.add({
//       ids: [userId],
//       embeddings: [embedding],
//     });
//     console.log(`✅ Stored embedding for user ${userId}`);
//   } catch (error) {
//     console.error("❌ Error storing embedding:", error.message);
//     throw error;
//   }
// }

// export async function getTopFaceMatches(embedding, n = 5) {
//   const coll = await ensureCollectionExists();
//   const { ids, distances, metadatas } = await coll.query({
//     queryEmbeddings: [embedding],
//     nResults: n,
//     include: ['distances', 'metadatas'],
//   });

//   return ids[0].map((id, i) => ({
//     id,
//     name: metadatas[0][i]?.name,
//     imageUrl: metadatas[0][i]?.imageUrl,
//     distance: distances[0][i],
//   }));
// }