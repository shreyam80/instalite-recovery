import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSessionAndFetchFeed() {
      try {
        // Step 1: Verify session
        const sessionRes = await fetch("http://localhost:3030/session", {
          credentials: "include",
        });
        const sessionData = await sessionRes.json();

        if (!sessionData.sessionUser) {
          navigate("/login");
          return;
        }

        // Step 2: Fetch feed (POST)
        const feedRes = await fetch("http://localhost:3030/feed", {
          method: "POST",
          credentials: "include",
        });

        let feedData;
        try {
          feedData = await feedRes.json();
        } catch (e) {
          throw new Error("Invalid JSON in response. Possible 404 or HTML error page.");
        }

        if (!feedRes.ok) {
          setError(feedData.error || "Failed to load feed");
        } else {
          setPosts(feedData);
        }
      } catch (err) {
        console.error("Feed fetch error:", err);
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }

    checkSessionAndFetchFeed();
  }, [navigate]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Welcome to your Feed</h2>
      <hr />

      {loading && <p>Loading posts...</p>}

      {!loading && error && (
        <div style={{ color: "red" }}>{error}</div>
      )}

      {!loading && !error && posts.length === 0 && (
        <p>No live posts yet.</p>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <h3>Live Posts:</h3>
          {posts.map((post, idx) => (
            <div key={idx} className="postCard">
              <strong>@{post.author}</strong>
              <p>{post.text}</p>
              <small>{new Date(post.timestamp).toLocaleString()}</small>
            </div>
          ))}
        </>
      )}
    </div>
  );
}