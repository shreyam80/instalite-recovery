import { Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("http://localhost:3030/logout", {
      method: "POST",
      credentials: "include"
    });
    localStorage.clear();
    window.location.href = "/login"; // force full reload
  };

  return (
    <div>
      <nav style={{ padding: "1rem", background: "#f0f0f0" }}>
        <button onClick={() => navigate("/feed")}>Feed</button>
        <button onClick={() => navigate("/search")}>Search</button>
        <button onClick={() => navigate("/chats")}>Chats</button>
        <button onClick={() => navigate("/user")}>My Profile</button>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <Outlet />
    </div>
  );
}
