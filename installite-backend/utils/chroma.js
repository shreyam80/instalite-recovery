// utils/chroma.js
const axios = require('axios');
require('dotenv').config();

const CHROMADB_ENDPOINT = process.env.CHROMADB_ENDPOINT || 'http://localhost:8000';

/**
 * Stores the embedding for a user in ChromaDB.
 * Replace the endpoint and data structure with your actual ChromaDB requirements.
 *
 * @param {string} userId - The user identifier.
 * @param {Array<number>} embedding - The embedding vector.
 * @returns {Promise<object>} - The response from ChromaDB.
 */
async function storeUserEmbedding(userId, embedding) {
  try {
    // Example: POST to /embeddings on your ChromaDB instance.
    const response = await axios.post(`${CHROMADB_ENDPOINT}/embeddings`, {
      userId,
      embedding
    });
    console.log(`Successfully stored embedding for user ${userId}.`);
    return response.data;
  } catch (error) {
    console.error("Error storing embedding in ChromaDB:", error.message);
    throw error;
  }
}

/**
 * Retrieves the top 5 actor matches given an embedding by performing a similarity search.
 * Replace the endpoint and parameters with your actual ChromaDB API.
 *
 * @param {Array<number>} embedding - The embedding vector.
 * @returns {Promise<Array<object>>} - Array of top matching actor objects.
 */
async function getTopActorMatches(embedding) {
  try {
    // Example: POST to /search with parameters; assume ChromaDB returns a field `matches`.
    const response = await axios.post(`${CHROMADB_ENDPOINT}/search`, {
      embedding,
      topK: 5,
      metric: 'cosine'
    });
    console.log("Retrieved top actor matches from ChromaDB.");
    return response.data.matches;
  } catch (error) {
    console.error("Error retrieving actor matches from ChromaDB:", error.message);
    throw error;
  }
}

module.exports = { storeUserEmbedding, getTopActorMatches };