import { Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div>
      <nav style={{ padding: "1rem", background: "#f0f0f0" }}>
        <button onClick={() => navigate("/feed")}>Feed</button>
        <button onClick={() => navigate("/search")}>Search</button>
        <button onClick={() => navigate("/chats")}>Chats</button>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <Outlet />
    </div>
  );
}
