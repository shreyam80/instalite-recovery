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
    handleCreatePost,
    handleUserProfile
  } from "./routes.js";

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
    app.post("/user", requireSessionAuth, handleUserProfile);
  
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
  app.post("/post/create", requireSessionAuth, handleCreatePost);

  }
