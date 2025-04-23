import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './pages/Layout';
import socket from './socket';
import ChatsPage from './pages/ChatsPage';
import SearchPage from './pages/SearchPage'; 

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (window.location.pathname === '/') {
      navigate(token ? '/feed' : '/login');
    }
  }, [navigate]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket:', socket.id);
    });

    socket.on('userStatus', ({ userId, isOnline }) => {
      console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
    });

    socket.on('chatInvite', (invite) => {
      console.log('Received chat invite:', invite);
    });

    socket.on('chatMessage', (message) => {
      console.log('New chat message:', message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
}

export default App;
