// src/socket.js
import { io } from 'socket.io-client';

const userId = localStorage.getItem("userId");
const token = localStorage.getItem("token");

const socket = io("http://localhost:3030", {
  query: { userId, token }
});

export default socket;