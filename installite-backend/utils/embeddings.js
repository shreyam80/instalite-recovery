// utils/embeddings.js
async function generateEmbedding(filePath) {
  // Simulate generating an embedding vector (128-dimensional)
  const embedding = Array.from({ length: 128 }, () => Math.random());
  console.log('Generated embedding for file:', filePath);
  return embedding;
}

module.exports = { generateEmbedding };