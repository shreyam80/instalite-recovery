// ===============================================
// EXPECTED FUNCTIONS - WebSocket Module
// ===============================================
//
// Function: initSocketServer(httpServer)
// - Params: Node.js HTTP server instance
// - Returns: none
// - Description: Initializes socket.io on the backend and sets up connection handlers
//
// Function: authenticateSocket(socket, next)
// - Params: socket, next
// - Returns: calls next() if auth passes; error otherwise
// - Description: Validates session/auth for each socket connection
//
// Function: broadcastUserStatus(userId, isOnline)
// - Params: userId, boolean
// - Returns: none
// - Description: Emits online/offline status to all of user’s friends
//
// Function: emitInvite(inviteeId, chatId, inviterName)
// - Params: inviteeId, chatId, inviter’s name
// - Returns: none
// - Description: Sends a real-time chat invite notification to invitee
//
// Function: emitChatMessage(chatId, message)
// - Params: chatId, message object
// - Returns: none
// - Description: Broadcasts a message to all members in a chat session
//
// Function: joinChat(socket, chatId)
// - Params: socket, chatId
// - Returns: success/failure
// - Description: Adds a user’s socket to the corresponding chat room
//
// Function: leaveChat(socket, chatId)
// - Params: socket, chatId
// - Returns: success/failure
// - Description: Removes a user’s socket from a chat room
//
// Function: cleanupOnDisconnect(userId)
// - Params: userId
// - Returns: none
// - Description: Marks user offline, and removes socket mappings
//
// ===============================================
