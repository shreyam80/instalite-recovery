import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  // Fetch session and feed on mount
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

        const feedRes = await fetch("http://localhost:3030/feed", {
          method: "POST",
          credentials: "include",
        });

        const feedData = await feedRes.json();
        if (!feedRes.ok) {
          throw new Error(feedData.error || "Failed to load feed");
        }

        setPosts(feedData);
        console.log("Feed data:", feedData);
      } catch (err) {
        console.error("Feed fetch error:", err);
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }

    checkSessionAndFetchFeed();
  }, [navigate]);

  useEffect(() => {
    if (posts.length > 0) {
      console.log("✅ Updated posts state:", posts);
    }
  }, [posts]);

  // Handle post submission
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
      alert('Post created!');
      setTextContent('');
      setHashtags('');
      setImageFile(null);
      setShowModal(false);

      // Refetch feed after new post
      setLoading(true);
      const refreshedFeed = await fetch("http://localhost:3030/feed", {
        method: "POST",
        credentials: "include",
      });
      const feedData = await refreshedFeed.json();
      setPosts(feedData);
    } catch (err) {
      console.error(err);
      alert('Error creating post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Welcome to your Feed</h2>
      <hr />

      {loading && <p>Loading posts...</p>}
      {!loading && error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && posts.length === 0 && (
        <p>No live posts yet.</p>
      )}
      {!loading && !error && posts.length > 0 && (
        <>
          <h3>Live Posts:</h3>
          {posts.map((post, idx) => (
            <div key={idx} className="postCard" style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
              <strong>@{post.author}</strong>
              <p>{post.text}</p>

              {post.hashtags && post.hashtags.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {post.hashtags.map((tag, tagIdx) => (
                    <span key={tagIdx} style={{
                      display: 'inline-block',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '12px',
                      padding: '0.2rem 0.6rem',
                      marginRight: '0.5rem',
                      fontSize: '0.8rem'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {post.imageUrl && (
                <img src={post.imageUrl} alt="post" style={{ maxWidth: "100%", marginTop: "0.5rem" }} />
              )}
              <small>{new Date(post.timestamp).toLocaleString()}</small>
            </div>
          ))}

        </>
      )}

      {/* Floating button */}
      <button onClick={() => setShowModal(true)} style={{
        position: 'fixed', bottom: 30, right: 30, fontSize: '2rem', padding: '10px 20px',
      }}>➕</button>

      {/* Modal */}
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
