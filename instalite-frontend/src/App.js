import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './pages/Layout';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (window.location.pathname === '/') {
      navigate(token ? '/feed' : '/login');
    }
  }, [navigate]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
}

export default App;
