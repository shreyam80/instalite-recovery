// utils/vector.js
import { ChromaClient } from 'chromadb'; // must be installed via npm
import dotenv from 'dotenv';
dotenv.config();

const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
const COLLECTION_NAME = 'actors';

let collection = null;

export async function ensureCollectionExists() {
  if (collection) return collection;

  try {
    // Try to get existing collection
    collection = await client.getCollection({ name: COLLECTION_NAME });
    console.log(`ℹ️ Reusing existing collection "${COLLECTION_NAME}"`);
  } catch (err) {
    // If not found, create it
    console.log(`⚠️ Collection "${COLLECTION_NAME}" not found, creating it...`);
    collection = await client.createCollection({ name: COLLECTION_NAME });
    console.log(`✅ Created collection "${COLLECTION_NAME}"`);
  }

  return collection;
}

export async function storeUserEmbedding(userId, embedding) {
  const coll = await ensureCollectionExists();
  try {
    await coll.add({
      ids: [userId],
      embeddings: [embedding],
    });
    console.log(`✅ Stored embedding for user ${userId}`);
  } catch (error) {
    console.error("❌ Error storing embedding:", error.message);
    throw error;
  }
}

export async function getTopActorMatches(embedding) {
    // grab the seeded 'actors' collection
    const coll = await ensureCollectionExists();
  
    // perform the similarity query
    const response = await coll.query({
      queryEmbeddings: [embedding],
      nResults: 5,
      include: ['distances', 'metadatas'],
    });
  
    // map into a nice array of matches
    return response.ids[0].map((id, i) => ({
      nconst:   id,
      name:     response.metadatas[0][i]?.name,
      imageUrl: response.metadatas[0][i]?.imageUrl,
      distance: response.distances[0][i],
    }));
  }