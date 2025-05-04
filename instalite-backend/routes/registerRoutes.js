// instalite-backend/routes/registerRoutes.js
import {
    handleLogin,
    handleRegister,
    handleSearch,
    /* — chat — */
    handleCreateChat,
    handleSendMessage,
    handleLeaveChat,
    handleInviteToChat,
    handleAcceptInvite,
    handleRejectInvite,
    handleRescindInvite,
    handleGetChatHistory,
    handleGetInvites,
    handleGetUserChats,
    handleLogout,
    handleGetFeed,
    handleCreatePost
  } from "./routes.js";

  import { get_db_connection } from '../../server/models/rdbms.js';

  import multer from 'multer';
  const upload = multer({ storage: multer.memoryStorage() }); // add this at top
  import db from "./db.js"; // ✅ pull in the MySQL pool


  function requireSessionAuth(req, res, next) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not logged in" });
    }
    next();
  }  
  
  /** Mount every HTTP route on the express `app` that gets passed in. */
  export default function registerRoutes(app) {
    /* ---------- auth & bot ---------- */
    app.post("/auth/login", handleLogin);
    app.post("/auth/register", handleRegister);
    app.post("/search", requireSessionAuth, handleSearch);
    app.post("/logout", requireSessionAuth, handleLogout);
    app.post("/feed", requireSessionAuth, handleGetFeed);
  
    /* ---------- chat (REST) ---------- */
    app.post("/chat/create", handleCreateChat);
    app.post("/chat/send", handleSendMessage);
    app.post("/chat/leave", handleLeaveChat);
  
    app.post("/chat/invite", handleInviteToChat);
    app.post("/chat/invite/accept", handleAcceptInvite);
    app.post("/chat/invite/reject", handleRejectInvite);
    app.post("/chat/invite/rescind", handleRescindInvite);
  
    app.get("/chat/history", handleGetChatHistory);
    app.get("/chat/invites", handleGetInvites);
    app.get("/chat/sessions", handleGetUserChats);

      /* ---------- session check ---------- */
  app.get("/session", (req, res) => {
    res.json({ sessionUser: req.session?.user || null });
  });
  // app.post('/post/create', upload.single('image'), async (req, res) => {
  //   const textContent = req.body.text_content;
  //   const hashtags = req.body.hashtag_text
  //     ? JSON.stringify(req.body.hashtag_text.split(',').map(s => s.trim()))
  //     : JSON.stringify([]);
  //   const user = req.session.user;
  
  //   console.log('Incoming post:', { textContent, hashtags });
  
  //   if (!textContent || !user) {
  //     return res.status(400).json({ error: 'Missing text or user session' });
  //   }
  
  //   const imageUrl = req.file ? req.file.originalname : null;

  
  //   try {
  //     console.log("Session user object:", req.session.user);
  //     await db.query(`
  //       INSERT INTO posts (author, text_content, image_url, hashtag_text, timestamp)
  //       VALUES (?, ?, ?, ?, NOW())
  //     `, [user.userId, textContent, imageUrl, hashtags]);
  
  //     res.status(200).json({ message: 'Post created successfully' });
  //   } catch (err) {
  //     console.error('DB insert error:', err);
  //     res.status(500).json({ error: 'Failed to create post' });
  //   }
  // });

  app.post('/post/create', upload.single('image'), async (req, res) => {
    const textContent = req.body.text_content;
    let hashtags;
    try {
      hashtags = req.body.hashtag_text ? JSON.parse(req.body.hashtag_text) : [];
      if (!Array.isArray(hashtags)) throw new Error('Hashtags must be array');
    } catch (err) {
      console.error("Invalid hashtag_text:", req.body.hashtag_text);
      return res.status(400).json({ error: "Hashtags must be a JSON array of strings." });
    }
  
    const user = req.session.user;
    if (!textContent || !user) {
      return res.status(400).json({ error: 'Missing text or user session' });
    }
  
    const imageUrl = req.file ? req.file.originalname : null;
  
    try {
      const db = await get_db_connection().connect();
      const timestamp = new Date();
  
      await db.send_sql(
        `INSERT INTO posts (author, text_content, hashtag_text, image_url, timestamp, is_external) 
         VALUES (?, ?, ?, ?, ?, 0)`,
        [user.userId, textContent, JSON.stringify(hashtags), imageUrl, timestamp]
      );
  
      res.json({ success: true });
    } catch (err) {
      console.error('DB insert error:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });
   }
