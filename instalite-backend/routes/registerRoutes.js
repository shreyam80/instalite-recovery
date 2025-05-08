/* ----------------------------------------------------------- */
/*  instalite‑backend/routes/registerRoutes.js                 */
/* ----------------------------------------------------------- */

import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

/* ---- handlers re‑exported from routes.js ---- */
import {
  /* auth & search */
  handleLogin,
  handleRegister,
  handleSearch,
  handleLogout,
  handleLikePost,
  handleUnlikePost,

  /* feed / profile / posts */
  handleGetFeed,
  handleUserProfile,
  handleCreatePost,

  /* chat core */
  handleCreateChat,
  handleRenameChat,  // NEW (rename a chat)
  handleSendMessage,
  handleLeaveChat,

  /* chat invites */
  handleInviteToChat,
  handleAcceptInvite,
  handleRejectInvite,
  handleRescindInvite,

  /* chat queries */
  handleGetChatHistory,
  handleGetInvites,
  handleGetUserChats,

  /* mutuals/users */
  handleGetMutuals,
  handleGetUserById,

  /* user image redirect */
  handleGetUserImage,

  /* settings */
  handleGetSettings,
  handleUpdateSettings,

  /* user search/follow */
  handleSearchUsers,
  handleFollowUser,
  handleUnfollowUser,
  handlePostComment,
  handleDeletePost,
  handleGetProfileByUsername
} from "./routes.js";

/* optional DB helper for raw queries in post upload */
import { get_db_connection } from "../../server/models/rdbms.js";

/* ---------- session‑auth helper ---------- */
function requireSessionAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

/**
 * Mount every HTTP route on the Express `app`.
 */
export default function registerRoutes(app) {
  /* ---------- USER IMAGE (placeholder / future CDN) ------- */
  app.get("/users/:userId/image", handleGetUserImage);

  /* ---------- AUTH & LOGOUT ------------------------------- */
  app.post("/auth/login",    handleLogin);
  app.post("/auth/register", handleRegister);
  app.post("/logout",        requireSessionAuth, handleLogout);

  /* ---------- CHATBOT SEARCH ------------------------------ */
  app.post("/search", requireSessionAuth, handleSearch);

  /* ---------- FEED & PROFILE ------------------------------ */
  app.post("/feed",  requireSessionAuth, handleGetFeed);
  app.post("/user",  requireSessionAuth, handleUserProfile);


  /* ---------- POST CREATION (with optional image) --------- */
  app.post(
    "/post/create",
    requireSessionAuth,
    upload.single("image"),
    async (req, res) => {
      const textContent = req.body.text_content;
      let   hashtags;
      try {
        hashtags = req.body.hashtag_text
          ? JSON.parse(req.body.hashtag_text)
          : [];
        if (!Array.isArray(hashtags)) throw new Error();
      } catch {
        return res
          .status(400)
          .json({ error: "hashtag_text must be a JSON array of strings" });
      }

      const user = req.session.user;
      if (!textContent || !user)
        return res.status(400).json({ error: "Missing text or session" });

      const imageUrl = req.file ? req.file.originalname : null;

      try {
        const db = get_db_connection();
        const ts = new Date();
        await db.send_sql(
          `INSERT INTO posts
             (author, text_content, hashtag_text, image_url, timestamp, is_external)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [user.userId, textContent, JSON.stringify(hashtags), imageUrl, ts]
        );
        return res.json({ success: true });
      } catch (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Failed to create post" });
      }
    }
  );

  app.post("/post/comment", requireSessionAuth, handlePostComment);

  /* ---------- CHAT (sessions, messages) ------------------- */
  app.post("/chat/create",       handleCreateChat);
  app.put ("/chat/:chatId/name", handleRenameChat);      // rename chat

  app.post("/chat/send",  handleSendMessage);
  app.post("/chat/leave", handleLeaveChat);

  /* invites */
  app.post("/chat/invite",            handleInviteToChat);
  app.post("/chat/invite/accept",     handleAcceptInvite);
  app.post("/chat/invite/reject",     handleRejectInvite);
  app.post("/chat/invite/rescind",    handleRescindInvite);

  /* queries */
  app.get("/chat/history",  handleGetChatHistory);
  app.get("/chat/invites",  handleGetInvites);
  app.get("/chat/sessions", handleGetUserChats);

  /* ---------- MUTUALS ------------------------------------- */
  app.get("/mutuals", requireSessionAuth, handleGetMutuals);
  app.get("/users/:userId", requireSessionAuth, handleGetUserById);
  
  /* ---------- SESSION DEBUG (optional) -------------------- */
  app.get("/session", (req, res) =>
    res.json({ sessionUser: req.session?.user || null })
  );

  /* ---------- settings -------------------- */
  app.post("/settings", requireSessionAuth, handleUpdateSettings);
  app.get(  "/settings", requireSessionAuth, handleGetSettings);


  /* ---------- search user/add follow -------------------- */
  // user‐search
  app.get("/search/users", requireSessionAuth, handleSearchUsers);
  app.get("/user/:username", requireSessionAuth, handleGetProfileByUsername);

  // follow action
  app.post  ("/users/:followeeId/follow",   requireSessionAuth, handleFollowUser);
  app.post  ("/users/:followeeId/unfollow", requireSessionAuth, handleUnfollowUser);
  app.delete("/post/:postId", requireSessionAuth, handleDeletePost);
  app.get("/mutuals", handleGetMutuals);
  app.post("/post/:postId/like", requireSessionAuth, handleLikePost);
  app.delete("/post/:postId/like", requireSessionAuth, handleUnlikePost);


}
