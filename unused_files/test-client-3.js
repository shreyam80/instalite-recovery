// test-client-3.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    token: 'valid-token',
    userId: 'user3'
  }
});

socket.on('connect', () => {
  console.log('user3 connected as:', socket.id);

  // Delay join so others are already connected
  setTimeout(() => {
    console.log('user3: emitting joinChat...');
    socket.emit('joinChat', 'chat123', (res) => {
      console.log('user3: joinChat response:', res);

      setTimeout(() => {
        console.log('user3: sending message...');
        socket.emit('sendMessage', {
          chatId: 'chat123',
          userId: 'user3',
          message: 'Hello from user3'
        }, (res) => {
          console.log('user3: sendMessage response:', res);
        });
      }, 1000);

      // Leave after 5s to trigger disconnect/cleanup
      setTimeout(() => {
        console.log('user3: leaving chat...');
        socket.emit('leaveChat', 'chat123', (res) => {
          console.log('user3: leaveChat response:', res);
          socket.disconnect(); // simulate disconnect
        });
      }, 5000);
    });
  }, 2000);
});

socket.on('chatMessage', (msg) => {
  console.log('user3 got chat message:', msg);
});

socket.on('chatInvite', (data) => {
  console.log('user3 got chat invite:', data);
});

socket.on('userStatus', ({ userId, isOnline }) => {
  console.log(`user3 sees ${userId} is now ${isOnline ? 'online' : 'offline'}`);
});

socket.on('disconnect', () => {
  console.log('user3 disconnected');
});
