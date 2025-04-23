// instalite-frontend/src/pages/ChatsPage.js
import { useEffect, useState } from "react";
import socket from "../socket";

const API = "http://localhost:3030";   // single source-of-truth

export default function ChatsPage() {
  const [chats, setChats] = useState([]);          // [{chatId, members}]
  const [messages, setMessages] = useState({});    // { chatId : [ {senderId,text}, … ] }
  const userId = Number(localStorage.getItem("userId") ?? 0);

  /* ---------- initial load ---------- */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const r = await fetch(`${API}/chat/sessions?userId=${userId}`);
        const sessions = await r.json();
        console.log("Fetched chat sessions:", sessions);
        setChats(sessions);

        /* join each room & pull history */
        await Promise.all(
          sessions.map(async ({ chatId }) => {
            socket.emit("joinChat", chatId);
            const hist = await fetch(`${API}/chat/history?chatId=${chatId}`).then((x) =>
              x.json()
            );
            setMessages((prev) => ({ ...prev, [chatId]: hist }));
          })
        );
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      }
    })();
  }, [userId]);

  /* ---------- live socket updates ---------- */
  useEffect(() => {
    const onMsg = (msg) =>
      setMessages((prev) => ({
        ...prev,
        [msg.chatId]: [...(prev[msg.chatId] || []), msg],
      }));

    socket.on("chatMessage", onMsg);
    return () => socket.off("chatMessage", onMsg);
  }, []);

  /* ---------- render ---------- */
  return (
    <div style={{ padding: 24 }}>
      <h2>Your Chats</h2>

      {chats.length === 0 && <p>No active chats found.</p>}

      {chats.map(({ chatId, members }) => (
        <section key={chatId} style={{ marginBottom: 24 }}>
          <h4>
            Chat&nbsp;#{chatId}&nbsp;
            <small style={{ fontWeight: 400 }}>
              (members: {members.join(", ")})
            </small>
          </h4>

          <ul>
            {(messages[chatId] || []).map((m) => (
              <li key={m.message_id ?? Math.random()}>
                <strong>{m.senderId}:</strong> {m.text}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
