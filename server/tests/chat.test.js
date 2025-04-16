//add user’s

//delete chat



// ===============================================
// EXPECTED FUNCTIONS - Chat Module
// ===============================================
//
// Function: createChat(members)
// - Params: [userId1, userId2, ...]
// - Returns: { chatId, success } or { error }
// - Description: Creates a new chat if an identical member set doesn’t already exist
//
// Function: sendMessage(chatId, userId, message)
// - Params: chatId, senderId, message content (string)
// - Returns: { success, messageId } or { error }
// - Description: Stores message in chat session and returns metadata
//
// Function: leaveChat(chatId, userId)
// - Params: chatId, userId
// - Returns: { success } or { error }
// - Description: Removes a user from the chat. Deletes the chat if they were the last member.
//
// Function: inviteToChat(chatId, inviterId, inviteeId)
// - Params: chatId, inviter userId, invitee userId
// - Returns: { success } or { error }
// - Description: Adds invitee to pending invites, notifies them via socket
//
// Function: acceptChatInvite(chatId, userId)
// - Params: chatId, userId
// - Returns: { success } or { error }
// - Description: Adds the user to the chat if they were invited
//
// Function: rejectChatInvite(chatId, userId)
// - Params: chatId, userId
// - Returns: { success } or { error }
// - Description: Declines an invite, removes pending invite state
//
// Function: getChatHistory(chatId)
// - Params: chatId
// - Returns: [{ messageId, senderId, text, timestamp }]
// - Description: Retrieves full chat message history, ordered by time
//
// ===============================================


// ----------------------------------
// Test: Create a new chat session
// ----------------------------------
// Should succeed and return a chatId for a new unique user group.
test('createChat should create a new chat session', async () => {
    const res = await createChat(['user1', 'user2']);
    expect(res.success).toBe(true);
    expect(res.chatId).toBeDefined();
});

// ----------------------------------
// Test: Prevent duplicate chat creation
// ----------------------------------
// Should fail if a chat already exists with the same members.
test('createChat should fail if identical chat already exists', async () => {
    await createChat(['user1', 'user2']);
    const res = await createChat(['user2', 'user1']); // order doesn’t matter
    expect(res.success).toBe(false);
});

// ----------------------------------
// Test: Send a message in a chat
// ----------------------------------
// Adds a message and returns its metadata.
test('sendMessage should add a message to the chat', async () => {
    const chat = await createChat(['user1', 'user2']);
    const res = await sendMessage(chat.chatId, 'user1', 'Hello!');
    expect(res.success).toBe(true);
    expect(res.messageId).toBeDefined();
});

// ----------------------------------
// Test: Leave a chat session
// ----------------------------------
// User should be removed from the chat and chat should be deleted if last member leaves.
test('leaveChat should remove user and delete if last', async () => {
    const chat = await createChat(['user3']);
    const res = await leaveChat(chat.chatId, 'user3');
    expect(res.success).toBe(true);
});

// ----------------------------------
// Test: Invite another user to chat
// ----------------------------------
// Adds user to pending invites and notifies via broadcast.
test('inviteToChat should succeed if user not already in chat', async () => {
    const chat = await createChat(['user1', 'user2']);
    const res = await inviteToChat(chat.chatId, 'user1', 'user3');
    expect(res.success).toBe(true);
});

// ----------------------------------
// Test: Accept chat invite
// ----------------------------------
// Moves invitee into active members list.
test('acceptChatInvite should allow invited user to join', async () => {
    const chat = await createChat(['user1', 'user2']);
    await inviteToChat(chat.chatId, 'user1', 'user4');
    const res = await acceptChatInvite(chat.chatId, 'user4');
    expect(res.success).toBe(true);
});

// ----------------------------------
// Test: Reject chat invite
// ----------------------------------
// Removes invite and prevents joining.
test('rejectChatInvite should decline the invite', async () => {
    const chat = await createChat(['user1', 'user2']);
    await inviteToChat(chat.chatId, 'user1', 'user5');
    const res = await rejectChatInvite(chat.chatId, 'user5');
    expect(res.success).toBe(true);
});



// ----------------------------------
// Test: Get chat history
// ----------------------------------
// Returns full list of ordered messages from the session.
test('getChatHistory should return message log for chat', async () => {
    const chat = await createChat(['user1', 'user2']);
    await sendMessage(chat.chatId, 'user1', 'First message');
    await sendMessage(chat.chatId, 'user2', 'Second message');
    const res = await getChatHistory(chat.chatId);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(2);
    expect(res[0].text).toBe('First message');
});
