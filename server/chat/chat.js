// server/chat/chat.js
import { get_db_connection } from '../models/rdbms.js';
import { emitInvite, emitChatMessage, emitChatRenamed, getIO } from './websocket.js';
import * as dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const db = get_db_connection();
await db.connect();

// Create a new chat session
export async function createChat(members) {
  const sortedMembers = [...members].sort();
  const memberString  = JSON.stringify(sortedMembers);

  const [existing] = await db.send_sql(
    'SELECT chat_session_id FROM chat_sessions WHERE chat_members = ?',
    [memberString]
  );
  if (existing.length > 0) {
    return { chatId: existing[0].chat_session_id, success: true };
  }

  const [result] = await db.send_sql(
    'INSERT INTO chat_sessions (chat_members) VALUES (?)',
    [memberString]
  );
  return { chatId: result.insertId, success: true };
}

// Send a message
export async function sendMessage(chatId, userId, message) {
  const [result] = await db.send_sql(
    'INSERT INTO chat_messages (chat_session_id, user_id, text_content) VALUES (?, ?, ?)',
    [chatId, userId, message]
  );
  emitChatMessage(chatId, { senderId: userId, text: message });
  return { success: true, messageId: result.insertId };
}

// Leave a chat
export async function leaveChat(chatId, userId) {
  const [rows] = await db.send_sql(
    'SELECT chat_members FROM chat_sessions WHERE chat_session_id = ?',
    [chatId]
  );
  if (rows.length === 0) {
    return { error: 'Chat not found' };
  }

  let members = JSON.parse(rows[0].chat_members).filter(id => id !== userId);

  if (members.length === 0) {
    // 1) Remove all invites for this session
    await db.send_sql(
      'DELETE FROM chat_invites WHERE chat_session_id = ?',
      [chatId]
    );
    // 2) Remove all messages for this session
    await db.send_sql(
      'DELETE FROM chat_messages WHERE chat_session_id = ?',
      [chatId]
    );
    // 3) Delete the session itself
    await db.send_sql(
      'DELETE FROM chat_sessions WHERE chat_session_id = ?',
      [chatId]
    );

    // 4) Broadcast to everyone that invites have changed
    const io = getIO();
    io.emit('chatInvite');
  } else {
    // Just update the member list
    await db.send_sql(
      'UPDATE chat_sessions SET chat_members = ? WHERE chat_session_id = ?',
      [JSON.stringify(members), chatId]
    );
  }

  return { success: true };
}

// Invite someone to chat
export async function inviteToChat(chatId, inviterId, inviteeId) {
  await db.send_sql(
    'INSERT INTO chat_invites (sender_user_id, recipient_user_id, chat_session_id) VALUES (?, ?, ?)',
    [inviterId, inviteeId, chatId]
  );
  emitInvite(inviteeId, chatId, inviterId);
  return { success: true };
}

// Accept an invite
export async function acceptChatInvite(chatId, userId) {
  const [check] = await db.send_sql(
    'SELECT * FROM chat_invites WHERE recipient_user_id = ? AND chat_session_id = ?',
    [userId, chatId]
  );
  if (check.length === 0) {
    return { error: 'No pending invite' };
  }

  const [rows] = await db.send_sql(
    'SELECT chat_members FROM chat_sessions WHERE chat_session_id = ?',
    [chatId]
  );
  if (rows.length === 0) {
    return { error: 'Chat not found' };
  }

  let members = JSON.parse(rows[0].chat_members);
  if (!members.includes(userId)) {
    members.push(userId);
  }

  await db.send_sql(
    'UPDATE chat_sessions SET chat_members = ? WHERE chat_session_id = ?',
    [JSON.stringify(members), chatId]
  );
  await db.send_sql(
    'DELETE FROM chat_invites WHERE recipient_user_id = ? AND chat_session_id = ?',
    [userId, chatId]
  );

  return { success: true };
}

// Decline an invite
export async function rejectChatInvite(chatId, userId) {
  await db.send_sql(
    'DELETE FROM chat_invites WHERE recipient_user_id = ? AND chat_session_id = ?',
    [userId, chatId]
  );
  return { success: true };
}

// Rescind invite
export async function rescindInvite(chatId, inviterId, inviteeId) {
  await db.send_sql(
    'DELETE FROM chat_invites WHERE sender_user_id = ? AND recipient_user_id = ? AND chat_session_id = ?',
    [inviterId, inviteeId, chatId]
  );
  return { success: true };
}

// Get full chat history
export async function getChatHistory(chatId) {
  const [rows] = await db.send_sql(
    `
      SELECT 
        message_id, 
        user_id   AS senderId, 
        text_content AS text, 
        timestamp 
      FROM chat_messages 
      WHERE chat_session_id = ? 
      ORDER BY timestamp ASC
    `,
    [chatId]
  );
  return rows;
}

// Get all pending invites for a user
export async function getInvites(userId) {
  const [rows] = await db.send_sql(
    `
      SELECT 
        sender_user_id    AS senderId, 
        recipient_user_id AS recipientId, 
        chat_session_id   AS chatId, 
        timestamp 
      FROM chat_invites 
      WHERE recipient_user_id = ?
    `,
    [userId]
  );
  return rows;
}

// Rename a chat
export async function renameChat(chatId, newName) {
  const clean = newName.trim().slice(0, 255);
  await db.send_sql(
    'UPDATE chat_sessions SET chat_name = ? WHERE chat_session_id = ?',
    [clean, chatId]
  );
  emitChatRenamed(chatId, clean);
  return { success: true };
}

// Get all chats a user is in
export async function getUserChats(userId) {
  const [rows] = await db.send_sql(
    `
      SELECT 
        chat_session_id AS chatId, 
        chat_members, 
        chat_name 
      FROM chat_sessions 
      WHERE 
        (
          JSON_VALID(chat_members) 
          AND JSON_CONTAINS(chat_members, JSON_ARRAY(?))
        ) 
        OR 
        (
          NOT JSON_VALID(chat_members) 
          AND CONCAT(',', chat_members, ',') LIKE CONCAT('%,', ?, ',%')
        )
    `,
    [userId, userId]
  );
  return rows.map(r => ({
    chatId:  r.chatId,
    members: JSON.parse(r.chat_members),
    name:    r.chat_name
  }));
}
