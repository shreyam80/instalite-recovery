// test-isolated-scenarios.js

import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import {
  initSocketServer
} from '../server/chat/websocket.js';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const httpServer = createServer();
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`WebSocket server listening on ${BASE_URL}`);
  runAllScenarios();
});

// ------------------------
// Test Setup Utilities
// ------------------------

const users = {
  user1: { id: 'user1', socket: null },
  user2: { id: 'user2', socket: null },
  user3: { id: 'user3', socket: null }
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function connectUser(userId) {
  return new Promise((resolve) => {
    const socket = Client(BASE_URL, {
      query: { token: 'valid-token', userId }
    });
    socket.on('connect', () => resolve(socket));
  });
}

async function connectUsers(...ids) {
  for (const id of ids) {
    users[id].socket = await connectUser(id);
    setupListeners(users[id]);
  }
}

async function disconnectUsers(...ids) {
  for (const id of ids) {
    const socket = users[id]?.socket;
    if (socket && socket.connected) {
      await new Promise(res => {
        socket.on('disconnect', res);
        socket.disconnect();
      });
    }
    users[id].socket = null;
  }
}

function setupListeners(user) {
  user.socket.on('chatMessage', (msg) =>
    console.log(`${user.id} got message:`, msg));
  user.socket.on('chatInvite', (data) =>
    console.log(`${user.id} got invite:`, data));
  user.socket.on('userStatus', ({ userId, isOnline }) =>
    console.log(`${user.id} sees ${userId} is ${isOnline ? 'online' : 'offline'}`));
  user.socket.on('userJoinedRoom', ({ userId, chatId }) =>
    console.log(`${user.id} sees ${userId} joined ${chatId}`));
  user.socket.on('userLeftRoom', ({ userId, chatId }) =>
    console.log(`${user.id} sees ${userId} left ${chatId}`));
}

async function resetEnvironment() {
  await disconnectUsers('user1', 'user2', 'user3');
  await wait(500);
}

// ------------------------
// Scenario Implementations
// ------------------------

async function runScenario1() {
  console.log('\n--- Scenario 1: Status Tracking ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2');
  await wait(500);
  await disconnectUsers('user2');
  await wait(500);
  await connectUsers('user2');
  await wait(500);
}

async function runScenario2() {
  console.log('\n--- Scenario 2: Invite Delivery ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2');
  users.user1.socket.emit('sendInvite', {
    inviteeId: 'user2',
    chatId: 'chat-room'
  }, (res) => console.log('user1 invited user2:', res));
  await wait(500);
}

async function runScenario3() {
  console.log('\n--- Scenario 3: Message Isolation ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2', 'user3');
  users.user1.socket.emit('joinChat', 'room1', () => {});
  users.user2.socket.emit('joinChat', 'room1', () => {});
  await wait(200);
  users.user1.socket.emit('sendMessage', {
    chatId: 'room1',
    userId: 'user1',
    message: 'hello room1'
  }, (res) => console.log('user1 sent message:', res));
  await wait(500);
}

async function runScenario4() {
  console.log('\n--- Scenario 4: Join Visibility ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2');
  users.user1.socket.emit('joinChat', 'room2', () => {});
  users.user2.socket.emit('joinChat', 'room2', () => {});
  await wait(200);
  await connectUsers('user3');
  users.user3.socket.emit('joinChat', 'room2', () => {});
  await wait(500);
}

async function runScenario5() {
  console.log('\n--- Scenario 5: Leave Visibility ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2', 'user3');
  users.user1.socket.emit('joinChat', 'room3', () => {});
  users.user2.socket.emit('joinChat', 'room3', () => {});
  users.user3.socket.emit('joinChat', 'room3', () => {});
  await wait(300);
  users.user3.socket.emit('leaveChat', 'room3', () => {});
  await wait(500);
}

async function runScenario6() {
  console.log('\n--- Scenario 6: Disconnect Cleanup ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2');
  users.user1.socket.emit('joinChat', 'room4', () => {});
  users.user2.socket.emit('joinChat', 'room4', () => {});
  await wait(200);
  await disconnectUsers('user2');
  await wait(500);
}

async function runScenario7() {
  console.log('\n--- Scenario 7: Full Mixed Interaction ---');
  await resetEnvironment();
  await connectUsers('user1', 'user2', 'user3');

  users.user1.socket.emit('sendInvite', {
    inviteeId: 'user2',
    chatId: 'chatA'
  }, (res) => console.log('user1 invited user2:', res));

  await wait(200);
  users.user2.socket.emit('joinChat', 'chatA', () => {});
  await wait(200);

  users.user1.socket.emit('sendInvite', {
    inviteeId: 'user3',
    chatId: 'chatB'
  }, (res) => console.log('user1 invited user3:', res));

  await wait(200);
  users.user1.socket.emit('sendMessage', {
    chatId: 'chatA',
    userId: 'user1',
    message: 'hello user2'
  }, () => {});
  await wait(200);
  users.user3.socket.emit('joinChat', 'chatB', () => {});
  await wait(200);
  users.user1.socket.emit('sendMessage', {
    chatId: 'chatB',
    userId: 'user1',
    message: 'hello user3'
  }, () => {});
  await wait(300);
  await disconnectUsers('user3');
  await wait(300);
  await connectUsers('user3');
  users.user3.socket.emit('joinChat', 'chatB', () => {});
  await wait(300);
  users.user3.socket.emit('leaveChat', 'chatB', () => {});
  await wait(500);
}

async function runAllScenarios() {
  await runScenario1();
  await wait(1000);
  await runScenario2();
  await wait(1000);
  await runScenario3();
  await wait(1000);
  await runScenario4();
  await wait(1000);
  await runScenario5();
  await wait(1000);
  await runScenario6();
  await wait(1000);
  await runScenario7();
  await wait(1000);
  console.log('\n--- All scenarios completed ---');
}
