// src/pages/Layout.js
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId   = Number(localStorage.getItem("userId") || 0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Paths on which we do NOT render the sidebar
  const HIDE_SIDEBAR = ["/login", "/register", "/profile"];

  // Early return if we're on login/register/or profile-pick page
  if (HIDE_SIDEBAR.includes(location.pathname)) {
    return <Outlet />;
  }

  // Otherwise render your sidebar + outlet
  const SIDEBAR_WIDTH = 100;
  const ICON_SIZE     = 32;
  const PROFILE_SIZE  = 40;

  const iconStyle = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    cursor: "pointer",
    display: "block",
    marginBottom: 24,
  };

  const handleLogout = async () => {
    await fetch("http://localhost:3000/logout", {
      method: "POST",
      credentials: "include",
    });
    localStorage.clear();
    window.location.href = "/login";
  };

  // profile image: prefer localStorage (what you picked), otherwise backend
  const storedImage = localStorage.getItem("profileImageUrl");
  const profileImageUrl = storedImage
    ? storedImage
    : `http://localhost:3000/users/${userId}/image`;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: SIDEBAR_WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 24,
          paddingBottom: 24,
          borderRight: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <img
          src="/icons/logo.svg"
          alt="Logo"
          style={iconStyle}
          onClick={() => navigate("/feed")}
        />

        {/* Home */}
        <img
          src="/icons/home.svg"
          alt="Home"
          style={iconStyle}
          onClick={() => navigate("/feed")}
        />

        {/* Search */}
        <img
          src="/icons/search.svg"
          alt="Search"
          style={iconStyle}
          onClick={() => navigate("/search")}
        />

        {/* Create Post */}
        <img
          src="/icons/create_post.svg"
          alt="New Post"
          style={iconStyle}
          onClick={() => navigate("/post/create")}
        />

        {/* Find Users */}
        <img
          src="/icons/search_users.svg"
          alt="Search Users"
          style={iconStyle}
          onClick={() => navigate("/users/search")}
        />

        {/* Chats */}
        <img
          src="/icons/send.svg"
          alt="Chats"
          style={iconStyle}
          onClick={() => navigate("/chats")}
        />

        <div style={{ flexGrow: 1 }} />

        {/* Profile */}
        <img
          src={profileImageUrl}
          alt="Your profile"
          style={{
            width: PROFILE_SIZE,
            height: PROFILE_SIZE,
            borderRadius: "50%",
            cursor: "pointer",
            objectFit: "cover",
            marginBottom: 16,
          }}
          onClick={() => navigate("/user")}
        />

        {/* Menu */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <img
            src="/icons/menu.svg"
            alt="Menu"
            style={{ width: ICON_SIZE, height: ICON_SIZE, cursor: "pointer" }}
            onClick={() => setMenuOpen((o) => !o)}
          />

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "100%",
                transform: "translate(8px, -50%)",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                overflow: "hidden",
                minWidth: 200,
                zIndex: 100,
              }}
            >
              <div
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <img
                  src="/icons/settings.svg"
                  alt=""
                  style={{ width: 20, height: 20, marginRight: 12 }}
                />
                Settings
              </div>

              <div style={{ height: 1, background: "#eee" }} />

              <div
                onClick={handleLogout}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Log out
              </div>
            </div>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}