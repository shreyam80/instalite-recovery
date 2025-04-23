// routes.js
import { authenticateUser, createUser } from '../../users.js';
import {
  createChat,
  sendMessage,
  leaveChat,
  inviteToChat,
  acceptChatInvite,
  rejectChatInvite,
  rescindInvite,
  getChatHistory,
  getInvites,
  getUserChats
} from '../../server/chat/chat.js';

// ---------- AUTH ----------

export async function handleLogin(req, res) {
  const result = await authenticateUser(req.body);
  if (result.error) return res.status(401).json({ error: result.error });
  res.json(result);
}

export async function handleRegister(req, res) {
  console.log("Received register POST:", req.body);
  const createResult = await createUser(req.body);
  console.log("Create result:", createResult);
  if (createResult.error) return res.status(400).json({ error: createResult.error });

  const loginResult = await authenticateUser({
    login: req.body.login,
    password: req.body.password,
  });

  if (loginResult.error) return res.status(500).json({ error: loginResult.error });

  res.json(loginResult);
}

// ---------- CHATS ----------

export async function handleGetUserChats(req, res) {
  const { userId } = req.query;
  const result = await getUserChats(userId);
  res.json(result);
}

export async function handleCreateChat(req, res) {
  const { members } = req.body;
  const result = await createChat(members);
  res.json(result);
}

export async function handleSendMessage(req, res) {
  const { chatId, userId, message } = req.body;
  const result = await sendMessage(chatId, userId, message);
  res.json(result);
}

export async function handleLeaveChat(req, res) {
  const { chatId, userId } = req.body;
  const result = await leaveChat(chatId, userId);
  res.json(result);
}

export async function handleInviteToChat(req, res) {
  const { chatId, inviterId, inviteeId } = req.body;
  const result = await inviteToChat(chatId, inviterId, inviteeId);
  res.json(result);
}

export async function handleAcceptInvite(req, res) {
  const { chatId, userId } = req.body;
  const result = await acceptChatInvite(chatId, userId);
  res.json(result);
}

export async function handleRejectInvite(req, res) {
  const { chatId, userId } = req.body;
  const result = await rejectChatInvite(chatId, userId);
  res.json(result);
}

export async function handleRescindInvite(req, res) {
  const { chatId, inviterId, inviteeId } = req.body;
  const result = await rescindInvite(chatId, inviterId, inviteeId);
  res.json(result);
}

export async function handleGetChatHistory(req, res) {
  const { chatId } = req.query;
  const result = await getChatHistory(chatId);
  res.json(result);
}

export async function handleGetInvites(req, res) {
  const { userId } = req.query;
  const result = await getInvites(userId);
  res.json(result);
}

export async function handleSearch(req, res) {
  res.json({ message: "Search route working" });
}

