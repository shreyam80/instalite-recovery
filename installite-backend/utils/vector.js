// utils/vector.js
const axios = require('axios');
require('dotenv').config();

const VECTOR_DB_ENDPOINT = process.env.CHROMADB_ENDPOINT || 'http://localhost:8000';

/**
 * Stores the user's embedding vector in the vector database.
 * @param {string} userId - The user's identifier.
 * @param {Array<number>} embedding - The image embedding vector.
 * @returns {Promise<object>} - The response from the vector DB.
 */
async function storeUserEmbedding(userId, embedding) {
  try {
    const response = await axios.post(`${VECTOR_DB_ENDPOINT}/embeddings`, {
      userId,
      embedding
    });
    console.log(`Stored embedding for user ${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error storing embedding in vector DB:", error.message);
    throw error;
  }
}

/**
 * Retrieves the top 5 actor matches by performing a similarity search.
 * @param {Array<number>} embedding - The embedding vector for comparison.
 * @returns {Promise<Array<object>>} - An array of top matching actor objects.
 */
async function getTopActorMatches(embedding) {
  try {
    const response = await axios.post(`${VECTOR_DB_ENDPOINT}/search`, {
      embedding,
      topK: 5,
      metric: 'cosine'
    });
    console.log("Retrieved top actor matches from the vector DB.");
    return response.data.matches;
  } catch (error) {
    console.error("Error retrieving actor matches from the vector DB:", error.message);
    throw error;
  }
}

module.exports = { storeUserEmbedding, getTopActorMatches };