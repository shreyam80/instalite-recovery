import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      const res = await fetch("http://localhost:3030/session", {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.sessionUser) {
        navigate("/login");
      }
    }
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAnswer("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3030/search", {
        method: "POST",
        credentials: "include", // ✅ ensure session cookie is sent
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Chatbot failed to answer.");
      } else {
        setAnswer(data.answer);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Could not connect to chatbot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page" style={{ padding: 20 }}>
      <h2>Ask the Chatbot</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          required
          style={{ width: "60%", padding: 8 }}
        />
        <button type="submit" style={{ marginLeft: 10, padding: 8 }}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {answer && (
        <div style={{ marginTop: 20 }}>
          <h4>Answer:</h4>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}