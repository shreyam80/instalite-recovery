import express from 'express';
import cors from 'cors';
import registerRoutes from './routes/registerRoutes.js';
import { createRetrieverFromDatabase } from '../chatbot/vector.js';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  registerRoutes(app); // mount all routes here

  try {
    await createRetrieverFromDatabase();  // <-- ✅ Initialize retriever
    console.log('Retriever initialized successfully');
  } catch (err) {
    console.error('Failed to initialize retriever:', err);
    process.exit(1);  // Exit if retriever setup fails
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();  // ✅ Actually start the server
