import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function FriendPage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:3030/user/${username}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not fetch user.");
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load user.");
      }
    }

    fetchProfile();
  }, [username]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!profile) return <p>Loading {username}...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>@{profile.username}</h2>
      <p>Followers: {profile.followerCount}</p>
      <p>Following: {profile.followingCount}</p>

      <h3>Posts</h3>
      {Array.isArray(profile.posts) && profile.posts.length > 0 ? (
        profile.posts.map((post, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
          >
            <p>{post.text}</p>
            {post.imageUrl && <img src={post.imageUrl} alt="post" style={{ maxWidth: "100%" }} />}
            <div style={{ marginTop: "0.3rem", fontSize: "0.85rem" }}>
              ❤️ {post.likeCount || 0} likes
            </div>
          </div>
        ))
      ) : (
        <p>No posts yet.</p>
      )}
    </div>
  );
}
