// test-client-2.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    token: 'valid-token',
    userId: 'user2'
  }
});

socket.on('connect', () => {
  console.log('user2 connected as:', socket.id);

  console.log('user2: emitting joinChat...');
  socket.emit('joinChat', 'chat123', (res) => {
    console.log('user2: joinChat response:', res);

    setTimeout(() => {
      console.log('user2: sending message...');
      socket.emit('sendMessage', {
        chatId: 'chat123',
        userId: 'user2',
        message: 'Hello from user2'
      }, (res) => {
        console.log('user2: sendMessage response:', res);
      });
    }, 3000);
  });
});

socket.on('chatMessage', (msg) => {
  console.log('user2 got chat message:', msg);
});

socket.on('chatInvite', (data) => {
  console.log('user2 got chat invite:', data);
});

socket.on('userStatus', ({ userId, isOnline }) => {
  console.log(`user2 sees ${userId} is now ${isOnline ? 'online' : 'offline'}`);
});

socket.on('disconnect', () => {
  console.log('user2 disconnected');
});
