// src/components/ChatWindow.jsx
import { useState, useRef, useEffect } from "react";

export default function ChatWindow({ title, messages, userId, onSend }) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  // auto-scroll new messages into view
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // handler to send message
  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    await onSend(msg);
    setText("");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "80vh",
      minHeight: 0   // allow inner flex to shrink
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid #ddd",
        fontWeight: "bold",
        background: "#f5f5f5"
      }}>
        {title}
      </div>

      {/* Scrollable messages window */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 16,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: 0
      }}>
        {messages.map((m, i) => {
          const mine = m.senderId === userId;
          // build the avatar URL pointing at your redirect route
          const avatarUrl = `http://localhost:3030/users/${m.senderId}/image`;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                margin: "8px 0",
                alignSelf: mine ? "flex-end" : "flex-start"
              }}
            >
              {/* avatar on left for other users */}
              {!mine && (
                <img
                  src={avatarUrl}
                  alt={`${m.senderName}’s avatar`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    marginRight: 8
                  }}
                />
              )}

              {/* message bubble */}
              <div style={{
                maxWidth: "75%",
                padding: "8px",
                borderRadius: 4,
                background: mine ? "#dcf8c6" : "#eee",
                textAlign: mine ? "right" : "left"
              }}>
                <div style={{
                  fontSize: "0.9em",
                  marginBottom: 4,
                  fontWeight: mine ? "bold" : "normal"
                }}>
                  {m.senderName}
                </div>
                <div>{m.text}</div>
              </div>

              {/* avatar on right for your own messages */}
              {mine && (
                <img
                  src={avatarUrl}
                  alt="Your avatar"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    marginLeft: 8
                  }}
                />
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: 12,
        borderTop: "1px solid #ddd",
        background: "#f5f5f5"
      }}>
        <div style={{ display: "flex" }}>
          <input
            style={{
              flex: 1,
              marginRight: 8,
              padding: "8px",
              borderRadius: 4,
              border: "1px solid #ccc"
            }}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message…"
          />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
