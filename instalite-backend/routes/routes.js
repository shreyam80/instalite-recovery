// instalite-backend/routes/routes.js
import { authenticateUser, createUser } from "../../users.js";
import { get_db_connection } from '../../server/models/rdbms.js';
import { getUserById } from "../../users.js";
import { getPostsByUser, getPostsForUser } from "../../posts.js";
// instalite‑backend/routes/routes.js
import {
  getUserImageByID
} from "../../users.js";

import { getIO } from "../../server/chat/websocket.js";
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
  renameChat,
} from "../../server/chat/chat.js";

import { getFriendsForUser }  from "../../friends.js";
/* ---- chatbot helpers ---- */
import { callChatbot } from "../../chatbot/chatbot.js";
import {
  ensureRetrieversReady,
  retrieveRelevantDocs
} from "../../installite-backend/utils/vector.js";

let retrieverInitialized = false;

/* ------------------------------------------------------------------ */
/*  AUTH                                                               */
/* ------------------------------------------------------------------ */
export async function handleLogin(req, res) {
  const result = await authenticateUser(req.body);
  if (result.error) return res.status(401).json({ error: result.error });

  req.session.user = { userId: result.userId, username: result.username };
  return res.status(200).json({ username: result.username });
}
export async function handleRegister(req, res) {
  try {
    const createResult = await createUser(req.body);
    if (createResult.error) {
      if (createResult.error.code === "ER_DUP_ENTRY") {
        if (createResult.error.sqlMessage.includes("users.email")) {
          return res.status(400).json({ error: "Email already registered." });
        } else if (createResult.error.sqlMessage.includes("users.username")) {
          return res.status(400).json({ error: "Username already taken." });
        }
      }
      return res.status(400).json({ error: "Registration failed." });
    }

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

/* ------------------------------------------------------------------ */
/*  LOGOUT                                                              */
/* ------------------------------------------------------------------ */
export function handleLogout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    return res.status(200).json({ success: true });
  });
}

/* ------------------------------------------------------------------ */
/*  CHATBOT SEARCH (stub)                                               */
/* ------------------------------------------------------------------ */
export async function handleSearch(req, res) {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });

  try {
    if (!retrieverInitialized) {
      console.log("Initializing chatbot retrievers…");
      await ensureRetrieversReady();
      retrieverInitialized = true;
    }
    const docs   = await retrieveRelevantDocs(question);
    const answer = await callChatbot(question, docs);
    return res.json({ answer });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ error: "Chatbot failed to process question" });
  }
}

/* ------------------------------------------------------------------ */
/*  FRIENDS                                                             */
/* ------------------------------------------------------------------ */
export async function handleGetFriends(req, res) {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const friends = await getFriendsForUser(userId);
  return res.json(friends);
}

/* ------------------------------------------------------------------ */
/*  FEED                                                                */
/* ------------------------------------------------------------------ */
export async function handleGetFeed(req, res) {
  const userId = req.session?.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const posts = await getPostsForUser(userId);
  if (posts.error) {
    return res.status(500).json({ error: posts.error });
  }
  return res.status(200).json(posts);
}

/* ------------------------------------------------------------------ */
/*  CHAT REST ENDPOINTS                                                 */
/* ------------------------------------------------------------------ */
export async function handleGetUserChats(req, res) {
  const userId = Number(req.query.userId);
  return res.json(await getUserChats(userId));
}

export async function handleRenameChat(req, res) {
  const chatId = Number(req.params.chatId);
  const { name } = req.body;
  await renameChat(chatId, name);
  getIO().to(String(chatId)).emit("chatRenamed", { chatId, name });
  return res.json({ success: true });
}

export async function handleCreateChat(req, res) {
  const { members, name = null } = req.body;
  return res.json(await createChat(members, name));
}

export async function handleSendMessage(req, res) {
  const { chatId, userId, message } = req.body;
  return res.json(await sendMessage(chatId, userId, message));
}

export async function handleLeaveChat(req, res) {
  const { chatId, userId } = req.body;
  return res.json(await leaveChat(chatId, userId));
}

export async function handleInviteToChat(req, res) {
  const { chatId, inviterId, inviteeId } = req.body;
  return res.json(await inviteToChat(chatId, inviterId, inviteeId));
}

export async function handleAcceptInvite(req, res) {
  const { chatId, userId } = req.body;
  return res.json(await acceptChatInvite(chatId, userId));
}

export async function handleRejectInvite(req, res) {
  const { chatId, userId } = req.body;
  return res.json(await rejectChatInvite(chatId, userId));
}

export async function handleRescindInvite(req, res) {
  const { chatId, inviterId, inviteeId } = req.body;
  return res.json(await rescindInvite(chatId, inviterId, inviteeId));
}

export async function handleGetChatHistory(req, res) {
  return res.json(await getChatHistory(req.query.chatId));
}

export async function handleGetInvites(req, res) {
  return res.json(await getInvites(req.query.userId));
}

/* ------------------------------------------------------------------ */
/*  USER IMAGE (placeholder redirect)                                  */
/* ------------------------------------------------------------------ */
export function handleGetUserImage(req, res) {
  const userId = Number(req.params.userId);
  const imageUrl = getUserImageByID(userId);     // returns /public/placeholder_profile_picture.png
  return res.redirect(imageUrl);
}

/* ------------------------------------------------------------------ */
/*  POSTS                                                               */
/* ------------------------------------------------------------------ */
export async function handleCreatePost(req, res) {
  const { text_content, hashtag_text, image_url } = req.body;
  const author = req.session?.user?.userId;
  if (!author) return res.status(401).json({ error: "Unauthorized" });

  try {
    const db = get_db_connection();
    const ts = new Date();

    const [result] = await db.send_sql(
      `INSERT INTO posts
         (author, text_content, hashtag_text, image_url, timestamp, is_external)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        author,
        text_content,
        JSON.stringify(hashtag_text || []),
        image_url || null,
        ts
      ]
    );
    return res.json({ success: true, post_id: result.insertId });
  } catch (err) {
    console.error("Post creation failed:", err);
    return res.status(500).json({ error: "Database error creating post" });
  }
}

export async function handleUserProfile(req, res) {
  const userId = req.session?.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user  = await getUserById(userId);
    const posts = await getPostsByUser(userId);

    const db = get_db_connection();
    const [[{ followerCount }]] = await db.send_sql(
      "SELECT COUNT(*) AS followerCount FROM friends WHERE following = ?",
      [userId]
    );
    const [[{ followingCount }]] = await db.send_sql(
      "SELECT COUNT(*) AS followingCount FROM friends WHERE follower = ?",
      [userId]
    );

    return res.status(200).json({ username: user.username, followerCount, followingCount, posts });
  } catch (err) {
    console.error("handleUserProfile error:", err);
    return res.status(500).json({ error: "Failed to load user profile" });
  }
}

export async function handleUserSearch(req, res) {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing search query" });

  try {
    const db = await get_db_connection().connect();
    const [results] = await db.send_sql(
      `SELECT user_id, username FROM users WHERE username LIKE ? LIMIT 10`,
      [`%${query}%`]
    );
    res.json({ users: results });
  } catch (err) {
    console.error("User search failed:", err);
    res.status(500).json({ error: "Database error searching users" });
  }
}

