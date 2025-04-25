import { useState, useRef, useEffect } from "react";
import socket from "../socket";

export default function ChatWindow({ chatId, messages, userId }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  /* auto-scroll down */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit("sendMessage", { chatId, message: trimmed }, () => {});
    setText("");
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100%" }}>
      {/* message list */}
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {messages.map((m) => (
          <div key={m.message_id ?? Math.random()} style={{ margin:"4px 0" }}>
            <span style={{ fontWeight: m.senderId === userId ? "bold" : "normal" }}>
              {m.senderId}:
            </span>{" "}
            {m.text}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* input box */}
      <div style={{ display:"flex", padding:12, borderTop:"1px solid #ddd" }}>
        <input
          style={{ flex:1, padding:8 }}
          value={text}
          onKeyDown={e => e.key==="Enter" && send()}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button style={{ marginLeft:8 }} onClick={send}>Send</button>
      </div>
    </div>
  );
}
