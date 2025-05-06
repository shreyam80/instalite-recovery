import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Proper placement

  // Trigger modal if coming from ?create=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true") {
      setShowModal(true);
      navigate("/feed", { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    async function checkSessionAndFetchFeed() {
      try {
        const sessionRes = await fetch("http://localhost:3030/session", {
          credentials: "include",
        });
        const sessionData = await sessionRes.json();
        if (!sessionData.sessionUser) {
          navigate("/login");
          return;
        }

        setCurrentUsername(sessionData.sessionUser.username);

        const feedRes = await fetch("http://localhost:3030/feed", {
          method: "POST",
          credentials: "include",
        });

        const feedData = await feedRes.json();
        if (!feedRes.ok) {
          throw new Error(feedData.error || "Failed to load feed");
        }

        setPosts(feedData);
      } catch (err) {
        console.error("Feed fetch error:", err);
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }

    checkSessionAndFetchFeed();
  }, [navigate]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('text_content', textContent);
    const tagsArray = hashtags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    formData.append('hashtag_text', JSON.stringify(tagsArray));

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await axios.post('http://localhost:3030/post/create', formData, {
        withCredentials: true,
      });

      setTextContent('');
      setHashtags('');
      setImageFile(null);
      setShowModal(false);

      const refreshedFeed = await fetch("http://localhost:3030/feed", {
        method: "POST",
        credentials: "include",
      });
      const feedData = await refreshedFeed.json();
      setPosts(feedData);
    } catch (err) {
      console.error(err);
      alert('Error creating post.');
    }
  };

  const handleSubmitComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      await fetch("http://localhost:3030/post/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId, content: text }),
      });

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

      const refreshedFeed = await fetch("http://localhost:3030/feed", {
        method: "POST",
        credentials: "include",
      });
      const feedData = await refreshedFeed.json();
      setPosts(feedData);
    } catch (err) {
      console.error("Comment submission error:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`http://localhost:3030/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete post.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Welcome to your Feed</h2>
      <hr />

      {loading && <p>Loading posts...</p>}
      {!loading && error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && posts.length === 0 && <p>No live posts yet.</p>}

      {!loading && !error && posts.length > 0 && (
        <>
          <h3>Live Posts:</h3>
          {posts.map((post, idx) => {
            const hashtags = Array.isArray(post.hashtags) ? post.hashtags : [];

            return (
              <div
                key={idx}
                className="postCard"
                style={{
                  border: "1px solid #ccc",
                  padding: "1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px"
                }}
              >
                <strong>@{post.author}</strong>
                <p>{post.text}</p>

                <p style={{ fontSize: '0.75rem', color: 'gray' }}>
                  DEBUG: post.author = {post.author}, currentUsername = {currentUsername}
                </p>

                {hashtags.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {hashtags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '12px',
                          padding: '0.2rem 0.6rem',
                          marginRight: '0.5rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
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

                <div style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>
                  ❤️ {post.likeCount || 0} likes
                </div>

                {Array.isArray(post.comments) && post.comments.length > 0 ? (
                  <div style={{ marginTop: "0.5rem" }}>
                    {post.comments.map((c, i) => (
                      <div key={i} style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        <strong>@{c.username}</strong>: {c.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', marginTop: "0.5rem" }}>
                    Be the first to comment...
                  </p>
                )}

                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInputs[post.postId] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({
                      ...prev,
                      [post.postId]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitComment(post.postId);
                  }}
                  style={{ marginTop: "0.5rem", width: "100%" }}
                />

                {post.author?.trim().toLowerCase() === currentUsername?.trim().toLowerCase() && (
                  <button
                    onClick={() => handleDeletePost(post.postId)}
                    style={{
                      marginTop: '0.5rem',
                      backgroundColor: '#ffdddd',
                      border: '1px solid #ffaaaa',
                      color: '#aa0000',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete Post
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}

      <button onClick={() => setShowModal(true)} style={{
        position: 'fixed', bottom: 30, right: 30, fontSize: '2rem', padding: '10px 20px',
      }}>➕</button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '300px' }}>
            <h2>Create a Post</h2>
            <form onSubmit={handlePostSubmit}>
              <textarea
                placeholder="What's on your mind?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                style={{ width: '100%' }}
              />
              <input
                type="text"
                placeholder="Enter hashtags separated by commas (e.g. travel,food)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                style={{ width: '100%', marginTop: '10px' }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ marginTop: '10px' }}
              />
              <div style={{ marginTop: 10 }}>
                <button type="submit">Post</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ marginLeft: 10 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
