import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
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

  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const submitComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const res = await fetch("http://localhost:3030/post/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId, content })
      });
      if (res.ok) {
        const updatedProfile = { ...profile };
        const post = updatedProfile.posts.find((p) => p.postId === postId);
        if (post) {
          post.comments = [...(post.comments || []), {
            username: profile.username,
            text: content,
            timestamp: new Date().toISOString(),
          }];
        }
        setProfile(updatedProfile);
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

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
          const comments = Array.isArray(post.comments) ? post.comments : [];

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

              {comments.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {comments.map((comment, i) => (
                    <div key={i} style={{ fontSize: "0.9rem" }}>
                      <strong>@{comment.username}</strong>: {comment.text}
                    </div>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInputs[post.postId] || ""}
                onChange={(e) => handleCommentChange(post.postId, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment(post.postId)}
                style={{ marginTop: "0.5rem", width: "100%" }}
              />
            </div>
          );
        })
      ) : (
        <p>You haven't posted anything yet.</p>
      )}
    </div>
  );
}
