import { useState, useRef, useEffect } from "react";

export default function ChatWindow({ chatId, messages, userId }) {
  const [text,    setText]    = useState("");
  const bottomRef = useRef(null);

  // auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // send through REST; server will broadcast via websocket
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await fetch("http://localhost:3030/chat/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chatId,
        userId,
        message: trimmed
      })
    });
    setText("");
  };

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100%"
    }}>
      {/* ─── Message list ─────────────────────────────────────── */}
      <div style={{
        flex:      1,
        overflowY: "auto",
        padding:   16
      }}>
        {messages.map((m,i) => (
          <div key={i} style={{ margin:"4px 0" }}>
            <span style={{
              fontWeight: m.senderId === userId ? "bold" : "normal"
            }}>
              {m.senderId}:
            </span>{" "}
            {m.text}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* ─── Input bar ────────────────────────────────────────── */}
      <div style={{
        display:   "flex",
        borderTop: "1px solid #ddd",
        padding:   12
      }}>
        <input
          style={{ flex:1, marginRight:8 }}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Type a message…"
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
