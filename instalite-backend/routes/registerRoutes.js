/* ----------------------------------------------------------- */
/*  instalite‑backend/routes/registerRoutes.js                 */
/* ----------------------------------------------------------- */
import {
  /* ─ auth & search ─ */
  handleLogin,
  handleRegister,
  handleSearch,
  /* ─ chat, messages & invites ─ */
  handleCreateChat,
  handleRenameChat,       // ← NEW
  handleSendMessage,
  handleLeaveChat,
  handleInviteToChat,
  handleAcceptInvite,
  handleRejectInvite,
  handleRescindInvite,
  handleGetChatHistory,
  handleGetInvites,
  handleGetUserChats,
  handleGetFriends,
  handleGetUserImage
} from "./routes.js";

/**
 * Mount every HTTP route on the Express `app` passed in.
 */
export default function registerRoutes (app) {

  app.get("/users/:userId/image", handleGetUserImage);

  /* -------------------------------------------------------- */
  /*  AUTH & CHATBOT SEARCH                                   */
  /* -------------------------------------------------------- */
  app.post("/auth/login",    handleLogin);
  app.post("/auth/register", handleRegister);
  app.post("/search",        handleSearch);

  /* -------------------------------------------------------- */
  /*  CHAT (SESSIONS / MESSAGES / INVITES)                    */
  /* -------------------------------------------------------- */
  app.post("/chat/create",        handleCreateChat);
  app.put ("/chat/:chatId/name",  handleRenameChat);   // ← NEW
  app.post("/chat/send",          handleSendMessage);
  app.post("/chat/leave",         handleLeaveChat);

  /* invites */
  app.post("/chat/invite",            handleInviteToChat);
  app.post("/chat/invite/accept",     handleAcceptInvite);
  app.post("/chat/invite/reject",     handleRejectInvite);
  app.post("/chat/invite/rescind",    handleRescindInvite);

  /* queries */
  app.get("/chat/history",   handleGetChatHistory);
  app.get("/chat/invites",   handleGetInvites);
  app.get("/chat/sessions",  handleGetUserChats);

  /* -------------------------------------------------------- */
  /*  FRIENDS                                                 */
  /* -------------------------------------------------------- */
  app.get("/friends", handleGetFriends);
}
