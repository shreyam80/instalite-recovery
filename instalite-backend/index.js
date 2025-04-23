import express from 'express';
import cors from 'cors';
import registerRoutes from './routes/registerRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

registerRoutes(app); // mount all routes here

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
