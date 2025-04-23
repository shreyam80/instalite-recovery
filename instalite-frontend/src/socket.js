
// src/socket.js
import { io } from 'socket.io-client';

export function createSocket(userId, token) {
  return io("http://localhost:3030", {
    query: { userId, token },
    reconnection: true,
    reconnectionAttempts: 2,            // ✅ Only retry twice
    reconnectionDelay: 500,             // ✅ Wait only 0.5s between retries
    timeout: 1000                       // ✅ Only wait 1 second for server response
  });
}
