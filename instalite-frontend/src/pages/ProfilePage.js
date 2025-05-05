// src/pages/ProfilePage.js
import { useState } from "react";

export default function ProfilePage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setError("");
    setUploading(true);
    setMatches([]);

    // build the multipart form
    const form = new FormData();
    form.append("userId", localStorage.getItem("userId"));
    form.append("profileImage", f);

    try {
      const res = await fetch("http://localhost:3000/uploadProfileImage", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setMatches(json.actorMatches || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = async (actorId) => {
    try {
      const res = await fetch("http://localhost:3000/linkActorToUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localStorage.getItem("userId"),
          actorId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Link failed");
      alert("Actor linked!");
    } catch (err) {
      console.error(err);
      alert("Failed to link actor: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Pick a Profile Photo</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading and matching…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {matches.length > 0 && (
        <div>
          <h3>Top {matches.length} Matches</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {matches.map((m) => (
              <li
                key={m.nconst}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <img
                  src={m.imageUrl}
                  alt={m.name}
                  width={50}
                  height={50}
                  style={{ marginRight: 12, borderRadius: "50%" }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{m.name}</strong>
                  <br />
                  <small>dist: {m.distance.toFixed(2)}</small>
                </div>
                <button onClick={() => handleSelect(m.nconst)}>
                  Link this actor
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}