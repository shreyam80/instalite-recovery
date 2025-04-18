// test-all-integrated.js

import { createServer } from 'http';
import { io as Client } from 'socket.io-client';

import {
  initSocketServer
} from '../server/chat/websocket.js';

// -------------------
// Start HTTP + Socket.IO Server
// -------------------

const httpServer = createServer();
initSocketServer(httpServer);
const PORT = 3000;

httpServer.listen(PORT)
  .on('listening', () => {
    console.log(`WebSocket server running on http://localhost:${PORT}`);
    main(); // Start test after server is ready
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      console.log(`To fix it, run this in PowerShell or CMD:`);
      console.log(`\n    netstat -ano | findstr :${PORT}`);
      console.log(`    taskkill /PID <PID> /F\n`);
      console.log(`Replace <PID> with the process ID from the first command.`);
      process.exit(1);
    } else {
      console.error('Unexpected server error:', err);
      process.exit(1);
    }
  });

// -------------------
// Test Logic: All Clients
// -------------------

const users = {
  user1: { id: 'user1', socket: null },
  user2: { id: 'user2', socket: null },
  user3: { id: 'user3', socket: null }
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function createClient(userId) {
  return new Promise((resolve) => {
    const socket = Client(`http://localhost:${PORT}`, {
      query: { token: 'valid-token', userId }
    });
    socket.on('connect', () => resolve(socket));
  });
}

function setupListeners(user) {
  user.socket.on('chatMessage', (msg) =>
    console.log(`${user.id} got message:`, msg));
  user.socket.on('chatInvite', (data) =>
    console.log(`${user.id} got invite:`, data));
  user.socket.on('userStatus', ({ userId, isOnline }) =>
    console.log(`${user.id} sees ${userId} is ${isOnline ? 'online' : 'offline'}`));
  user.socket.on('disconnect', () =>
    console.log(`${user.id} disconnected`));
}

async function main() {
  // Connect all users
  for (const user of Object.values(users)) {
    user.socket = await createClient(user.id);
    setupListeners(user);
    console.log(`${user.id} connected`);
  }

  const { user1, user2, user3 } = users;

  // Join chat
  for (const user of [user1, user2, user3]) {
    await new Promise(res =>
      user.socket.emit('joinChat', 'chat123', (resp) => {
        console.log(`${user.id} joined chat123:`, resp);
        res();
      })
    );
  }

  // Send messages
  user1.socket.emit('sendMessage', {
    chatId: 'chat123',
    userId: 'user1',
    message: 'Hello from user1'
  }, (res) => console.log('user1 message:', res));

  await wait(500);

  user2.socket.emit('sendMessage', {
    chatId: 'chat123',
    userId: 'user2',
    message: 'Hi user1!'
  }, (res) => console.log('user2 message:', res));

  await wait(500);

  // Invite
  user1.socket.emit('sendInvite', {
    inviteeId: 'user2',
    chatId: 'chat123'
  }, (res) => console.log('user1 invited user2:', res));

  await wait(500);

  // user3 sends message and leaves
  user3.socket.emit('sendMessage', {
    chatId: 'chat123',
    userId: 'user3',
    message: 'Hey all!'
  }, (res) => console.log('user3 message:', res));

  await wait(500);

  user3.socket.emit('leaveChat', 'chat123', (res) => {
    console.log('user3 left:', res);
    user3.socket.disconnect();
  });

  // Shutdown others after 5s
  setTimeout(() => {
    user1.socket.disconnect();
    user2.socket.disconnect();
    httpServer.close(() => console.log('Server shut down'));
  }, 5000);
}
