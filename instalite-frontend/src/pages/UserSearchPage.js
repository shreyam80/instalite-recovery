// src/pages/UserSearchPage.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserSearchPage() {
  const uid = Number(localStorage.getItem("userId"));
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:3030/users/search?userId=${uid}&q=${encodeURIComponent(
            query
          )}`,
          { credentials: "include" }
        );
        const users = await res.json();
        setResults(users);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, uid]);

  // Toggle follow / unfollow
  const toggleFollow = async (otherId, currentlyFollowing) => {
    try {
      if (currentlyFollowing) {
        // unfollow
        await fetch(
          `http://localhost:3030/users/follow?userId=${uid}&followeeId=${otherId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
      } else {
        // follow
        await fetch("http://localhost:3030/users/follow", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, followeeId: otherId }),
        });
      }
      setResults((r) =>
        r.map((u) =>
          u.userId === otherId ? { ...u, following: !currentlyFollowing } : u
        )
      );
    } catch (err) {
      console.error("Toggle follow failed:", err);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2>Search Users</h2>
      <input
        type="search"
        placeholder="Search by name or username…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginBottom: 16,
          borderRadius: 4,
          border: "1px solid #ccc",
        }}
      />

      {results.map((u) => (
        <div
          key={u.userId}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <img
            src={`http://localhost:3030/users/${u.userId}/image`}
            alt={`${u.firstName}'s avatar`}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              marginRight: 12,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/user/${u.username}`)}
          />

          <div
            style={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate(`/user/${u.username}`)}
          >
            <div style={{ fontWeight: "bold" }}>
              {u.firstName} {u.lastName}
            </div>
            <div style={{ color: "#555" }}>@{u.username}</div>
          </div>

          <button
            onClick={() => toggleFollow(u.userId, u.following)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: u.following ? "1px solid #ccc" : "none",
              background: u.following ? "#fafafa" : "#3897f0",
              color: u.following ? "#555" : "#fff",
              cursor: "pointer",
            }}
          >
            {u.following ? "Unfollow" : "Follow"}
          </button>
        </div>
      ))}
    </div>
  );
}
