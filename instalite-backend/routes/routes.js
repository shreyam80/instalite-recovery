// instalite-backend/routes/routes.js
import { authenticateUser, createUser } from "../../users.js";
import { get_db_connection } from '../../server/models/rdbms.js';
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
  getUserChats,
} from "../../server/chat/chat.js";
import { callChatbot } from '../../chatbot/chatbot.js';
import { getPostsForUser } from "../../posts.js"; 
import { ensureRetrieversReady, retrieveRelevantDocs } from '../../installite-backend/utils/vector.js';
let retrieverInitialized = false;

/* ---------- AUTH ---------- */
export async function handleLogin(req, res) {
  const result = await authenticateUser(req.body);
  if (result.error) return res.status(401).json({ error: result.error });
  req.session.user = {
    userId: result.userId,
    username: result.username,
  };

  res.status(200).json({ username: result.username });
}

export async function handleRegister(req, res) {
  try {
    const createResult = await createUser(req.body);
    
    if (createResult.error) {
      // Handle specific MySQL duplicate errors
      if (createResult.error.code === 'ER_DUP_ENTRY') {
        if (createResult.error.sqlMessage.includes('users.email')) {
          return res.status(400).json({ error: 'Email already registered.' });
        } else if (createResult.error.sqlMessage.includes('users.username')) {
          return res.status(400).json({ error: 'Username already taken.' });
        }
      }
      return res.status(400).json({ error: 'Registration failed.' });
    }

    // Auto-login
    const loginResult = await authenticateUser({
      login: req.body.login,
      password: req.body.password,
    });

    if (loginResult.error) {
      return res.status(500).json({ error: loginResult.error });
    }

    req.session.user = {
      userId: loginResult.userId,
      username: loginResult.username,
    };

    return res.status(200).json({ username: loginResult.username });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* ---------- CHATBOT SEARCH (stub) ---------- */
export async function handleSearch(req, res) {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "No question provided" });
  }

  try {
    // Lazy init, just once
    if (!retrieverInitialized) {
      console.log("Initializing chatbot retrievers...");
      await ensureRetrieversReady();
      retrieverInitialized = true;
    }

    const docs = await retrieveRelevantDocs(question);  // retrieve documents from Chroma
    const answer = await callChatbot(question, docs);   // generate answer using OpenAI + context
    res.json({ answer });
  } catch (err) {
    console.error("Chatbot error in handleSearch:", err);
    res.status(500).json({ error: "Chatbot failed to process your question" });
  }
}

/* ---------- LOGOUT ---------- */
export function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ success: true });
  });
}

/* ---------- FEED ---------- */
export async function handleGetFeed(req, res) {
  const userId = req.session?.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const posts = await getPostsForUser(userId);
  if (posts.error) {
    return res.status(500).json({ error: posts.error });
  }

  res.status(200).json(posts);
}

/* ---------- CHAT REST ---------- */
export async function handleGetUserChats(req, res) {
  const userId = Number(req.query.userId);
  res.json(await getUserChats(userId));
}

export async function handleCreateChat(req, res) {
  const { members } = req.body;
  res.json(await createChat(members));
}

export async function handleSendMessage(req, res) {
  const { chatId, userId, message } = req.body;
  res.json(await sendMessage(chatId, userId, message));
}

export async function handleLeaveChat(req, res) {
  const { chatId, userId } = req.body;
  res.json(await leaveChat(chatId, userId));
}

export async function handleInviteToChat(req, res) {
  const { chatId, inviterId, inviteeId } = req.body;
  res.json(await inviteToChat(chatId, inviterId, inviteeId));
}

export async function handleAcceptInvite(req, res) {
  const { chatId, userId } = req.body;
  res.json(await acceptChatInvite(chatId, userId));
}

export async function handleRejectInvite(req, res) {
  const { chatId, userId } = req.body;
  res.json(await rejectChatInvite(chatId, userId));
}

export async function handleRescindInvite(req, res) {
  const { chatId, inviterId, inviteeId } = req.body;
  res.json(await rescindInvite(chatId, inviterId, inviteeId));
}

export async function handleGetChatHistory(req, res) {
  res.json(await getChatHistory(req.query.chatId));
}

export async function handleGetInvites(req, res) {
  res.json(await getInvites(req.query.userId));
}

export async function handleCreatePost(req, res) {
  const { text_content, hashtag_text, image_url } = req.body;
  const author = req.session?.user?.userId;
  if (!author) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await get_db_connection().connect(); //Make sure connection is established
    const timestamp = new Date();

    const [result] = await db.send_sql(
      `INSERT INTO posts (author, text_content, hashtag_text, image_url, timestamp, is_external) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [author, text_content, JSON.stringify(hashtag_text || []), image_url || null, timestamp]
    );

    res.json({ success: true, post_id: result.insertId });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ error: 'Database error creating post' });
  }
}

