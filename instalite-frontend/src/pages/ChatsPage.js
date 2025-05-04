// src/pages/ChatsPage.js
import { useEffect, useState, useCallback, useRef } from "react";
import socket from "../socket";
import ChatWindow from "../components/ChatWindow";

// Helpers
const uid = Number(localStorage.getItem("userId"));
// Make normalizeMembers safe on undefined
const normalizeMembers = (arr = []) =>
  [...new Set(arr.map(Number))].sort((a, b) => a - b);
const idToName = (friends, id) =>
  id === uid
    ? "You"
    : friends.find(f => f.userId === id)?.firstName || `User ${id}`;

// Pretty members for default labels
const prettyMembers = (members, friends) =>
  normalizeMembers(members)
    .filter(id => id !== uid)
    .map(id => idToName(friends, id))
    .join(", ") || "You";

// Chat label: use custom name or default to member list
const chatLabel = (chat, friends) =>
  chat.name?.trim() || prettyMembers(chat.members, friends);

export default function ChatsPage() {
  const [chats, setChats] = useState([]);   // [{ chatId, name, members }]
  const [history, setHistory] = useState({});// { chatId: [ {senderId,text,senderName} ] }
  const [active, setActive] = useState(null);// current chatId
  const [invites, setInvites] = useState([]);// [{ chatId, senderId }]
  const [friends, setFriends] = useState([]);// [{ userId, firstName, lastName }]
  const joinedRooms = useRef(new Set());

  // Fetch chats & histories
  const loadChats = useCallback(async () => {
    const sessions = await fetch(
      `http://localhost:3030/chat/sessions?userId=${uid}`
    ).then(r => r.json());
    const normalized = sessions.map(s => ({
      chatId:  s.chatId ?? s.chat_session_id,
      members: normalizeMembers(
        Array.isArray(s.members) ? s.members : JSON.parse(s.chat_members)
      ),
      name:    s.chat_name || s.name || null
    }));
    setChats(normalized);
    if (normalized.length && active === null) {
      setActive(normalized[0].chatId);
    }
    // Load history if not already
    for (const c of normalized) {
      if (!history[c.chatId]) {
        const h = await fetch(
          `http://localhost:3030/chat/history?chatId=${c.chatId}`
        ).then(r => r.json());
        setHistory(prev => ({
          ...prev,
          [c.chatId]: h.map(m => ({
            ...m,
            senderName: idToName(friends, m.senderId)
          }))
        }));
      }
    }
  }, [active, friends, history]);

  // Fetch invites
  const loadInvites = useCallback(async () => {
    const inv = await fetch(
      `http://localhost:3030/chat/invites?userId=${uid}`
    ).then(r => r.json());
    setInvites(inv);
  }, []);

  // Fetch friends
  const loadFriends = useCallback(() => {
    fetch(`http://localhost:3030/friends?userId=${uid}`)
      .then(r => r.json())
      .then(setFriends)
      .catch(console.error);
  }, []);

  // Initial load
  useEffect(() => {
    loadFriends();
    loadChats();
    loadInvites();
  }, [loadChats, loadInvites, loadFriends]);

  // Join socket rooms
  useEffect(() => {
    chats.forEach(c => {
      if (!joinedRooms.current.has(c.chatId)) {
        socket.emit("joinChat", c.chatId, () => {});  // callback provided
        joinedRooms.current.add(c.chatId);
      }
    });
  }, [chats]);

  // Real-time handlers
  useEffect(() => {
    const onMsg = msg => {
      setHistory(prev => ({
        ...prev,
        [msg.chatId]: [
          ...(prev[msg.chatId] || []),
          {
            senderId:   msg.senderId,
            senderName: idToName(friends, msg.senderId),
            text:       msg.text
          }
        ]
      }));
    };
    const onInvite = () => {
      loadInvites();
      loadChats();
    };
    const onUserJoined = ({ chatId, userId }) => {
      setChats(prev =>
        prev.map(c =>
          c.chatId === chatId
            ? { ...c, members: normalizeMembers([...c.members, userId]) }
            : c
        )
      );
    };
    const onUserLeft = ({ chatId, userId }) => {
      setChats(prev =>
        prev
          .map(c =>
            c.chatId === chatId
              ? { ...c, members: c.members.filter(id => id !== userId) }
              : c
          )
          .filter(c => !(chatId === c.chatId && userId === uid))
      );
      if (userId === uid && active === chatId) {
        setActive(null);
      }
    };
    const onRenamed = ({ chatId, name }) => {
      setChats(prev =>
        prev.map(c => (c.chatId === chatId ? { ...c, name } : c))
      );
      setInvites(prev =>
        prev.map(inv =>
          inv.chatId === chatId ? { ...inv, chatName: name } : inv
        )
      );
    };

    socket.on("chatMessage",    onMsg);
    socket.on("chatInvite",     onInvite);
    socket.on("userJoinedRoom", onUserJoined);
    socket.on("userLeftRoom",   onUserLeft);
    socket.on("chatRenamed",    onRenamed);

    return () => {
      socket.off("chatMessage",    onMsg);
      socket.off("chatInvite",     onInvite);
      socket.off("userJoinedRoom", onUserJoined);
      socket.off("userLeftRoom",   onUserLeft);
      socket.off("chatRenamed",    onRenamed);
    };
  }, [active, friends, loadChats, loadInvites]);

  // REST actions
  async function acceptInvite(chatId) {
    await fetch("http://localhost:3030/chat/invite/accept", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chatId, userId: uid })
    });
    socket.emit("joinChat", chatId, () => {});  // callback provided
    joinedRooms.current.add(chatId);
    loadChats();
    loadInvites();
  }

  async function rejectInvite(chatId) {
    await fetch("http://localhost:3030/chat/invite/reject", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chatId, userId: uid })
    });
    loadInvites();
  }

  async function sendInvite(chatId) {
    const chat     = chats.find(c => c.chatId === chatId);
    const existing = new Set(chat.members);
    const options  = friends.filter(f => !existing.has(f.userId));
    if (!options.length) return alert("No friends left to invite.");
    const choice = prompt(
      "Invite which friend?\n" +
      options.map(f => `${f.userId}: ${f.firstName} ${f.lastName}`).join("\n")
    );
    if (!choice) return;
    const inviteeId = Number(choice.split(":")[0].trim());
    await fetch("http://localhost:3030/chat/invite", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chatId, inviterId: uid, inviteeId })
    });
  }

  async function leaveChat(chatId) {
    await fetch("http://localhost:3030/chat/leave", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chatId, userId: uid })
    });
    setChats(prev => prev.filter(c => c.chatId !== chatId));
    if (active === chatId) setActive(null);
    socket.emit("leaveChat", chatId, () => {}); // callback provided
  }

  // Rename chat
  async function renameChat(chatId) {
    const current = chats.find(c => c.chatId === chatId)?.name || "";
    const newName = prompt("New chat name:", current);
    if (!newName || newName.trim() === current) return;
    await fetch(`http://localhost:3030/chat/${chatId}/name`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: newName.trim() })
    });
    setChats(prev =>
      prev.map(c =>
        c.chatId === chatId ? { ...c, name: newName.trim() } : c
      )
    );
  }

  // Create new chat
  async function createChat() {
    if (!friends.length) return alert("No friends to chat with.");
    const choice = prompt(
      "Start chat with which friend?\n" +
      friends.map(f => `${f.userId}: ${f.firstName} ${f.lastName}`).join("\n")
    );
    if (!choice) return;
    const otherId = Number(choice.split(":")[0].trim());

    // 1) create or fetch session
    const { chatId } = await fetch("http://localhost:3030/chat/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ members: [uid, otherId] })
    }).then(r => r.json());

    // 2) update UI & join socket with callback
    setChats(prev => [...prev, { chatId, members: [uid, otherId], name: null }]);
    setActive(chatId);
    socket.emit("joinChat", chatId, () => {}); // callback provided
    joinedRooms.current.add(chatId);
    setHistory(prev => ({ ...prev, [chatId]: [] }));

    // 3) send the invite
    await fetch("http://localhost:3030/chat/invite", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chatId, inviterId: uid, inviteeId: otherId })
    });
  }

  // Render
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <aside style={{ width: 280, borderRight: "1px solid #ddd", padding: 12 }}>
        <section style={{ marginBottom: 24 }}>
          <h3>Invites</h3>
          {invites.length === 0 ? (
            <p><em>No pending invites</em></p>
          ) : (
            invites.map(inv => {
              const chat = chats.find(c => c.chatId === inv.chatId);
              const label = chat ? chatLabel(chat, friends) : `Chat ${inv.chatId}`;
              return (
                <div key={inv.chatId} style={{ marginBottom: 8 }}>
                  <strong>{idToName(friends, inv.senderId)}</strong> invited you to{" "}
                  <strong>{label}</strong><br/>
                  <button onClick={() => acceptInvite(inv.chatId)}>Accept</button>{" "}
                  <button onClick={() => rejectInvite(inv.chatId)}>Reject</button>
                </div>
              );
            })
          )}
        </section>

        <section>
          <h3>Your Chats</h3>
          <button
            style={{ marginBottom: 8, fontSize: "0.9em" }}
            onClick={createChat}
          >
            + New Chat
          </button>
          {chats.map(c => (
            <div
              key={c.chatId}
              onClick={() => setActive(c.chatId)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: c.chatId === active ? "#eef" : undefined
              }}
            >
              <strong>{chatLabel(c, friends)}</strong><br/>
              <small>({prettyMembers(c.members, friends)})</small><br/>
              <button
                style={{ fontSize: "0.8em", marginRight: 4 }}
                onClick={e => { e.stopPropagation(); renameChat(c.chatId); }}
              >
                Rename
              </button>
              <button
                style={{ fontSize: "0.8em", marginRight: 4 }}
                onClick={e => { e.stopPropagation(); sendInvite(c.chatId); }}
              >
                Invite
              </button>
              <button
                style={{ fontSize: "0.8em" }}
                onClick={e => { e.stopPropagation(); leaveChat(c.chatId); }}
              >
                Leave
              </button>
            </div>
          ))}
        </section>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        {active == null ? (
          <em>Select a chat or accept an invite</em>
        ) : (
          <ChatWindow chatId={active} messages={history[active] || []} userId={uid} />
        )}
      </main>
    </div>
  );
}
