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

        console.log("User profile response:", data); // 🔍 Debug
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
        posts.map((post) => (
          <div key={post.postId} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <p>{post.text}</p>
            {post.imageUrl && <img src={post.imageUrl} alt="post" style={{ maxWidth: "100%" }} />}
            <small>{new Date(post.timestamp).toLocaleString()}</small>
            <p>Likes: {post.likeCount}</p>
          </div>
        ))
      ) : (
        <p>You haven't posted anything yet.</p>
      )}
    </div>
  );
}
