// src/App.js
import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import socket from "./socket";

import FeedPage     from "./pages/FeedPage";
import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatsPage    from "./pages/ChatsPage";
import SearchPage   from "./pages/SearchPage";
import Layout       from "./pages/Layout";

function App() {
  const navigate = useNavigate();

  /* -------------------------------------------------------------
   * 1.  Redirect on first load
   * ----------------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    navigate(
      window.location.pathname === "/"
        ? (token ? "/feed" : "/login")
        : window.location.pathname
    );
  }, [navigate]);

  /* -------------------------------------------------------------
   * 2.  Boot the websocket once we know token + userId
   * ----------------------------------------------------------- */
  useEffect(() => {
    const token  = "valid-token";                     // whatever backend checks
    const userId = localStorage.getItem("userId");

    if (userId) {
      /*  send credentials via QUERY  */
      socket.io.opts.query = { token, userId };
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("WebSocket connected as", socket.id);
    });

    return () => {
      socket.off("connect");
      socket.disconnect();
    };
  }, []);

  /* -------------------------------------------------------------
   * 3.  Global listeners (online status, invites, …)
   * ----------------------------------------------------------- */
  useEffect(() => {
    socket.on("userStatus", data => console.log("userStatus:", data));
    socket.on("chatInvite", invite => console.log("chatInvite:", invite));

    return () => {
      socket.off("userStatus");
      socket.off("chatInvite");
    };
  }, []);

  /* ------------------------------------------------------------- */
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/feed"     element={<FeedPage    />} />
        <Route path="/login"    element={<LoginPage   />} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/chats"    element={<ChatsPage   />} />
        <Route path="/search"   element={<SearchPage  />} />
      </Route>
    </Routes>
  );
}

export default App;
