// src/socket.js
import { io } from "socket.io-client";

/**
 * Wrap the actual socket inside a function so we can always
 * read the freshest userId / token from localStorage.
 */
function createSocket() {
  const userId = localStorage.getItem("userId");
  const token  = "valid-token"; 

  return io("http://localhost:3030", {
    query: { userId, token },
    // optional: fine–tune reconnection behaviour
    autoConnect: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
  });
}

const socket = createSocket();
export default socket;