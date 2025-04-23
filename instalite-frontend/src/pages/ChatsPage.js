import { useEffect, useState } from "react";
import socket from "../socket";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const userId = localStorage.getItem("userId");

  // Fetch all chat sessions on mount
  useEffect(() => {
    async function fetchChats() {
      const res = await fetch(`http://localhost:3030/chat/sessions?userId=${userId}`);
      const sessions = await res.json();
      setChats(sessions);

      for (const chat of sessions) {
        socket.emit("joinChat", chat.chatId, () => {});
        const res = await fetch(`http://localhost:3030/chat/history?chatId=${chat.chatId}`);
        const history = await res.json();
        setMessages(prev => ({ ...prev, [chat.chatId]: history }));
      }
    }

    fetchChats();
  }, [userId]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("chatMessage", (msg) => {
      setMessages(prev => {
        const newMessages = [...(prev[msg.chatId] || []), msg];
        return { ...prev, [msg.chatId]: newMessages };
      });
    });

    return () => socket.off("chatMessage");
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Chats</h2>
      {chats.map(chat => (
        <div key={chat.chatId} style={{ marginBottom: 20 }}>
          <h4>Chat ID: {chat.chatId}</h4>
          <ul>
            {(messages[chat.chatId] || []).map((msg, i) => (
              <li key={i}>
                <strong>{msg.senderId}:</strong> {msg.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
