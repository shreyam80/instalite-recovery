import {
  handleLogin,
  handleRegister, handleSearch,
  handleCreateChat,
  handleSendMessage,
  handleLeaveChat,
  handleInviteToChat,
  handleAcceptInvite,
  handleRejectInvite,
  handleRescindInvite,
  handleGetChatHistory,
  handleGetInvites,
  handleGetUserChats
} from './routes.js';

export default function registerRoutes(app) {
  app.post('/auth/login', handleLogin);
  app.post('/auth/register', handleRegister);
  app.post('/auth/search', handleSearch);

  app.post('/chat/create', handleCreateChat);
  app.post('/chat/send', handleSendMessage);
  app.post('/chat/leave', handleLeaveChat);
  app.post('/chat/invite', handleInviteToChat);
  app.post('/chat/invite/accept', handleAcceptInvite);
  app.post('/chat/invite/reject', handleRejectInvite);
  app.post('/chat/invite/rescind', handleRescindInvite);
  app.get('/chat/history', handleGetChatHistory);
  app.get('/chat/invites', handleGetInvites);
  app.get('/chat/sessions', handleGetUserChats);
}
