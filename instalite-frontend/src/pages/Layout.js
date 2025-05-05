// src/pages/Layout.js
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId"));
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("http://localhost:3030/logout", {
      method: "POST",
      credentials: "include",
    });
    localStorage.clear();
    window.location.href = "/login";
  };

  // sidebar dimensions
  const SIDEBAR_WIDTH = 100;
  const ICON_SIZE = 32;
  const PROFILE_SIZE = 40;

  const iconStyle = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    cursor: "pointer",
    display: "block",
  };

  // direct‐redirect to profile image
  const profileImageUrl = `http://localhost:3030/users/${userId}/image`;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: SIDEBAR_WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 24,
          paddingBottom: 24,        // added bottom padding
          borderRight: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      >
        {/* Top logo (optional) */}
        <img
          src="/icons/logo.svg"
          alt="Logo"
          style={{ ...iconStyle, marginBottom: 24 }}
          onClick={() => navigate("/feed")}
        />

        {/* Home */}
        <img
          src="/icons/home.svg"
          alt="Home"
          style={{ ...iconStyle, marginBottom: 24 }}
          onClick={() => navigate("/feed")}
        />

        {/* Search */}
        <img
          src="/icons/search.svg"
          alt="Search"
          style={{ ...iconStyle, marginBottom: 24 }}
          onClick={() => navigate("/search")}
        />

        {/* Chats */}
        <img
          src="/icons/send.svg"
          alt="Chats"
          style={{ ...iconStyle, marginBottom: 24 }}
          onClick={() => navigate("/chats")}
        />

        {/* Spacer */}
        <div style={{ flexGrow: 1 }} />

        {/* Profile */}
        <img
          src={profileImageUrl}
          alt="Your profile"
          onClick={() => navigate("/user")}
          style={{
            width: PROFILE_SIZE,
            height: PROFILE_SIZE,
            borderRadius: "50%",
            cursor: "pointer",
            marginBottom: 16,       // slightly reduced bottom margin
            objectFit: "cover",
          }}
        />

        {/* Hamburger + dropdown */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <img
            src="/icons/menu.svg"
            alt="Menu"
            style={iconStyle}
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
              {/* Settings */}
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
                onMouseEnter={e =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={e =>
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

              {/* Divider */}
              <div style={{ height: 1, background: "#eee" }} />

              {/* Log out */}
              <div
                onClick={handleLogout}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={e =>
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
