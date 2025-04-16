// server/chat/websocket.js

import { Server } from 'socket.io';

// Module-level variable to hold the Socket.io instance.
let io;

/**
 * initSocketServer(httpServer)
 * - Params: httpServer (Node.js HTTP server instance)
 * - Returns: none
 * - Description: Initializes Socket.io on the provided HTTP server and sets up connection handlers.
 */
function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    // You can add options here if needed
  });
  io.on('connection', (socket) => {
    console.log('Socket connected: ', socket.id);
    // Optionally, attach further event handlers, e.g., for authentication, disconnect, etc.
  });
}

/**
 * authenticateSocket(socket, next)
 * - Params: socket, next (a callback)
 * - Returns: calls next() if authentication passes; otherwise calls next with an error.
 * - Description: Checks if socket.handshake.query.token is "valid-token".
 */
function authenticateSocket(socket, next) {
  if (socket.handshake && socket.handshake.query && socket.handshake.query.token === 'valid-token') {
    return next();
  }
  const error = new Error('Authentication error');
  return next(error);
}

/**
 * broadcastUserStatus(userId, isOnline)
 * - Params: userId (string), isOnline (boolean)
 * - Returns: none
 * - Description: Emits online/offline status to all of the user’s friends.
 *              For testing, we call a global emitter.
 */
function broadcastUserStatus(userId, isOnline) {
  if (global.emitUserStatus) {
    global.emitUserStatus(userId, isOnline);
  }
}

/**
 * emitInvite(inviteeId, chatId, inviterName)
 * - Params: inviteeId (string), chatId (string), inviterName (string)
 * - Returns: none
 * - Description: Sends a chat invite via a global emitter.
 */
function emitInvite(inviteeId, chatId, inviterName) {
  if (global.emitInviteNotification) {
    global.emitInviteNotification(inviteeId, chatId, inviterName);
  }
}

/**
 * emitChatMessage(chatId, message)
 * - Params: chatId (string), message (object)
 * - Returns: none
 * - Description: Broadcasts a chat message to all members of the chat session via a global emitter.
 */
function emitChatMessage(chatId, message) {
  if (global.emitChatMessageEvent) {
    global.emitChatMessageEvent(chatId, message);
  }
}

/**
 * joinChat(socket, chatId)
 * - Params: socket, chatId (string)
 * - Returns: { success: true } or { success: false, error: <Error> }
 * - Description: Uses socket.join to add the socket to a chat room.
 */
function joinChat(socket, chatId) {
  try {
    socket.join(chatId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * leaveChat(socket, chatId)
 * - Params: socket, chatId (string)
 * - Returns: { success: true } or { success: false, error: <Error> }
 * - Description: Uses socket.leave to remove the socket from a chat room.
 */
function leaveChat(socket, chatId) {
  try {
    socket.leave(chatId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * cleanupOnDisconnect(userId)
 * - Params: userId (string)
 * - Returns: none
 * - Description: Marks the user as offline (through broadcast) and removes the user's socket mapping.
 */
function cleanupOnDisconnect(userId) {
  if (global.socketMappings && global.socketMappings[userId]) {
    delete global.socketMappings[userId];
  }
  // Broadcast that the user is now offline.
  broadcastUserStatus(userId, false);
}

export {
  initSocketServer,
  authenticateSocket,
  broadcastUserStatus,
  emitInvite,
  emitChatMessage,
  joinChat,
  leaveChat,
  cleanupOnDisconnect
};
