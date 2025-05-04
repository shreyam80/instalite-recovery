/* ----------------------------------------------------------- */
/*  instalite‑backend/routes/registerRoutes.js                 */
/* ----------------------------------------------------------- */

import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import uploadProfilePicRouter from "./uploadProfilePic.js";

/* ---- handlers re‑exported from routes.js ---- */
import {
  /* auth & search */
  handleLogin,
  handleRegister,
  handleSearch,
  handleLogout,

  /* feed / profile / posts */
  handleGetFeed,
  handleUserProfile,
  handleCreatePost,
  handlePostComment,

  /* chat core */
  handleCreateChat,
  handleRenameChat,
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

  /* friends */
  handleGetFriends,

  /* user image redirect */
  handleGetUserImage
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
  app.get("/users/:userId/image", handleGetUserImage);

  app.post("/auth/login",    handleLogin);
  app.post("/auth/register", handleRegister);
  app.post("/logout",        requireSessionAuth, handleLogout);

  app.post("/search", requireSessionAuth, handleSearch);

  app.post("/feed",  requireSessionAuth, handleGetFeed);
  app.post("/user",  requireSessionAuth, handleUserProfile);

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

  app.post("/chat/create",       handleCreateChat);
  app.put ("/chat/:chatId/name", handleRenameChat);
  app.post("/chat/send",  handleSendMessage);
  app.post("/chat/leave", handleLeaveChat);

  app.post("/chat/invite",            handleInviteToChat);
  app.post("/chat/invite/accept",     handleAcceptInvite);
  app.post("/chat/invite/reject",     handleRejectInvite);
  app.post("/chat/invite/rescind",    handleRescindInvite);

  app.get("/chat/history",  handleGetChatHistory);
  app.get("/chat/invites",  handleGetInvites);
  app.get("/chat/sessions", handleGetUserChats);

  app.get("/friends", handleGetFriends);

  app.get("/session", (req, res) =>
    res.json({ sessionUser: req.session?.user || null })
  );

  app.use(uploadProfilePicRouter);
}
