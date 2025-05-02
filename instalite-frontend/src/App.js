import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './pages/Layout';
import socket from './socket';
import ChatsPage from './pages/ChatsPage';
import SearchPage from './pages/SearchPage';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Re-check session whenever location changes (after login or logout)
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("http://localhost:3030/session", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        setIsAuthenticated(!!data.sessionUser);
      } catch (err) {
        console.error("Session check failed:", err);
        setIsAuthenticated(false);
      }
    }
    checkSession();
  }, [location]); // will re-run after navigate()

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (isAuthenticated === null) return <p>Loading...</p>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/feed" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage />} />
        <Route path="/chats" element={isAuthenticated ? <ChatsPage /> : <Navigate to="/login" />} />
        <Route path="/search" element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/feed" : "/login"} />} />
      </Route>
    </Routes>
  );
}

export default App;
