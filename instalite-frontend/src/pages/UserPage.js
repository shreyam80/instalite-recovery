import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const sessionRes = await fetch("http://localhost:3030/session", {
          credentials: "include",
        });
        const sessionData = await sessionRes.json();
        if (!sessionData.sessionUser) {
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:3030/user", {
          method: "POST",
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");

        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Could not load profile.");
      }
    }

    fetchUserProfile();
  }, [navigate]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!profile) return <p>Loading...</p>;

  const { username, followerCount, followingCount, posts } = profile;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>@{username}</h2>
      <p>Followers: {followerCount}</p>
      <p>Following: {followingCount}</p>

      <h3>Your Posts</h3>
      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map((post, idx) => {
          const hashtags = Array.isArray(post.hashtags) ? post.hashtags : [];

          return (
            <div
              key={idx}
              style={{
                border: "1px solid #ccc",
                padding: "1rem",
                marginBottom: "1rem",
                borderRadius: "8px"
              }}
            >
              <p>{post.text}</p>

              {hashtags.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {hashtags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      style={{
                        display: "inline-block",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "12px",
                        padding: "0.2rem 0.6rem",
                        marginRight: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}

              {post.imageUrl && (
                <>
                  <img
                    src={post.imageUrl}
                    alt="post"
                    style={{ maxWidth: "100%", marginTop: "0.5rem" }}
                  />
                  <br />
                </>
              )}

              <small>{new Date(post.timestamp).toLocaleString()}</small>

              <div style={{ marginTop: "0.3rem", fontSize: "0.85rem" }}>
                ❤️ {post.likeCount || 0} likes
              </div>
            </div>
          );
        })
      ) : (
        <p>You haven't posted anything yet.</p>
      )}
    </div>
  );
}
