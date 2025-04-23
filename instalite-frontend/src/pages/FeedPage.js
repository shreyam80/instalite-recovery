import './FeedPage.css';

export default function FeedPage({ posts = [] }) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Welcome to your Feed</h2>
        <p>This will be your main content feed once logged in.</p>
        <hr />

        <h3>📡 Live Posts:</h3>
        {posts.length === 0 ? (
          <p>No live posts yet.</p>
        ) : (
          posts.map((post, idx) => (
            <div key={idx} className="postCard">
              <strong>@{post.username}</strong>
              <p>{post.post_text}</p>
              <small>{new Date(post.created_at).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    );
  }
  