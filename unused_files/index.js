// index.js
import http from 'http';
import { initSocketServer } from '../server/chat/websocket.js';

const server = http.createServer();

initSocketServer(server);

server.listen(3000, () => {
  console.log('WebSocket server running on http://localhost:3000');
});
