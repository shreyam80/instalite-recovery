import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
//import { useEffect, useState } from 'react';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './pages/Layout';
import { createSocket } from './socket';  // ✅ <-- use createSocket, not import socket directly!
import ChatsPage from './pages/ChatsPage';
import { useEffect, useState } from 'react'; // ← add useState here


function App() {
  const navigate = useNavigate();
  const [livePosts, setLivePosts] = useState([]); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (window.location.pathname === '/') {
      navigate(token ? '/feed' : '/login');
    }

    // ✅ Only create socket if user is logged in
    if (userId && token) {
      const newSocket = createSocket(userId, token);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Connected to socket:', newSocket.id);
      });

      newSocket.on('userStatus', ({ userId, isOnline }) => {
        console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
      });

      newSocket.on('chatInvite', (invite) => {
        console.log('Received chat invite:', invite);
      });

      newSocket.on('chatMessage', (message) => {
        console.log('New chat message:', message);
      });

      return () => {
        newSocket.disconnect();
      };
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

    socket.on('newPost', (post) => {
      console.log('New Kafka Post recieved:', post);
      setLivePosts(prev => [post, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/feed" element={<FeedPage posts={livePosts} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Route>
    </Routes>
  );
}

export default App;
