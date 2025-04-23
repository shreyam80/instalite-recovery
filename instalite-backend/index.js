import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import registerRoutes from './routes/registerRoutes.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });


const app = express();
const server = http.createServer(app);  // Combined server for both Express and Socket.IO

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
registerRoutes(app);

io.on('connection', (socket) => {
  const { userId } = socket.handshake.query;
  console.log(`✅ Socket connected! userId=${userId}, socket.id=${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ User ${userId} disconnected.`);
  });
});

const PORT = 3030;
server.listen(PORT, () => {
  console.log(`🚀 Backend + Socket.IO running on port ${PORT}`);
});
