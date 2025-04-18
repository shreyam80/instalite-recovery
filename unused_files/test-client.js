// test-client.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    token: 'valid-token',
    userId: 'user1'
  }
});

socket.on('connect', () => {
  console.log('user1 connected as:', socket.id);

  console.log('user1: emitting joinChat...');
  socket.emit('joinChat', 'chat123', (res) => {
    console.log('user1: joinChat response:', res);

    setTimeout(() => {
      console.log('user1: sending message...');
      socket.emit('sendMessage', {
        chatId: 'chat123',
        userId: 'user1',
        message: 'Hello from user1'
      }, (res) => {
        console.log('user1: sendMessage response:', res);
      });
    }, 1000);

    setTimeout(() => {
      console.log('user1: sending invite to user2...');
      socket.emit('sendInvite', {
        inviteeId: 'user2',
        chatId: 'chat123'
      }, (res) => {
        console.log('user1: sendInvite response:', res);
      });
    }, 2000);

    setTimeout(() => {
      console.log('user1: leaving chat...');
      socket.emit('leaveChat', 'chat123', (res) => {
        console.log('user1: leaveChat response:', res);
      });
    }, 4000);
  });
});

socket.on('chatMessage', (msg) => {
  console.log('user1 got chat message:', msg);
});

socket.on('chatInvite', (data) => {
  console.log('user1 got chat invite:', data);
});

socket.on('userStatus', ({ userId, isOnline }) => {
  console.log(`user1 sees ${userId} is now ${isOnline ? 'online' : 'offline'}`);
});

socket.on('disconnect', () => {
  console.log('user1 disconnected');
});
