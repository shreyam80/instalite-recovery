import { useEffect, useState } from "react";
import { createSocket } from "../socket";  // ✅ Correct import!

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [socket, setSocket] = useState(null);  // ✅ Hold socket instance in state

  // ✅ Create socket connection when component mounts
  useEffect(() => {
    if (userId && token) {
      const newSocket = createSocket(userId, token);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to socket:", newSocket.id);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [userId, token]);

  // ✅ Fetch all chat sessions on mount AFTER socket is ready
  useEffect(() => {
    if (!socket) return;  // 🛑 Wait for socket to be initialized!

    async function fetchChats() {
      const res = await fetch(`http://localhost:3030/chat/sessions?userId=${userId}`);
      const sessions = await res.json();
      setChats(sessions);

      for (const chat of sessions) {
        socket.emit("joinChat", chat.chatId);
        const res = await fetch(`http://localhost:3030/chat/history?chatId=${chat.chatId}`);
        const history = await res.json();
        setMessages(prev => ({ ...prev, [chat.chatId]: history }));
      }
    }

    fetchChats();
  }, [userId, socket]);  // ✅ Depends on socket being ready

  // ✅ Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages(prev => {
        const newMessages = [...(prev[msg.chatId] || []), msg];
        return { ...prev, [msg.chatId]: newMessages };
      });
    };

    socket.on("chatMessage", handleMessage);

    return () => {
      socket.off("chatMessage", handleMessage);
    };
  }, [socket]);

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