/*  src/pages/ChatsPage.js
    --------------------------------------------------------------
    – left column  : list of chats
    – right column : messages + input box for the selected chat
    – Uses REST  /chat/send  to store ↩︎  and websocket “chatMessage”
      to receive live updates.
----------------------------------------------------------------*/
import { useEffect, useState, useCallback } from 'react';
import socket from '../socket';

export default function ChatsPage() {
  const uid = Number(localStorage.getItem('userId'));
  const [chats,    setChats]    = useState([]);   // [{chatId,members}]
  const [history,  setHistory]  = useState({});   // { chatId : [ {senderId,text} ] }
  const [activeId, setActiveId] = useState(null);

  /* helper – push one message into state */
  const addMsg = useCallback((chatId, msg) => {
    setHistory(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), msg] }));
  }, []);

  /* 1️⃣  load all sessions once ------------------------------------------------*/
  useEffect(() => {
    (async () => {
      const raw = await fetch(`http://localhost:3030/chat/sessions?userId=${uid}`)
                         .then(r => r.json());

      const sessions = raw.map(r => ({
        chatId : r.chatId ?? r.chat_session_id,
        members: r.members ?? JSON.parse(r.chat_members)
      }));
      setChats(sessions);
      if (sessions.length) setActiveId(sessions[0].chatId);

      /* join every room + pull history */
      for (const c of sessions) {
        socket.emit('joinChat', c.chatId);

        const h = await fetch(`http://localhost:3030/chat/history?chatId=${c.chatId}`)
                         .then(r => r.json());
        setHistory(prev => ({ ...prev, [c.chatId]: h }));
      }
    })();
  }, [uid]);

  /* 2️⃣  live websocket feed ---------------------------------------------------*/
  useEffect(() => {
    const handler = msg => addMsg(msg.chatId, msg);
    socket.on('chatMessage', handler);
    return () => socket.off('chatMessage', handler);
  }, [addMsg]);

  /* ---------------------------------------------------------------------------*/
  return (
    <div style={{display:'flex',height:'100%'}}>
      {/* ▸ left column – chat list */}
      <aside style={{width:260,borderRight:'1px solid #ddd'}}>
        {chats.map(c => (
          <div key={c.chatId}
               onClick={() => { setActiveId(c.chatId); socket.emit('joinChat', c.chatId); }}
               style={{
                 padding:12,cursor:'pointer',
                 background:c.chatId===activeId ? '#eef' : undefined
               }}>
            <strong>Chat {c.chatId}</strong><br/>
            <small>{c.members.join(', ')}</small>
          </div>
        ))}
      </aside>

      {/* ▸ right column – messages */}
      <main style={{flex:1,padding:24}}>
        {activeId == null
          ? <em>Select a chat</em>
          : <ChatWindow
              chatId={activeId}
              msgs={history[activeId] || []}
              onLocalEcho={msg => addMsg(activeId, msg)}
            />
        }
      </main>
    </div>
  );
}

/* ============================================================================
   ChatWindow  –  message list + input bar
============================================================================ */
function ChatWindow({ chatId, msgs, onLocalEcho }) {
  const uid  = Number(localStorage.getItem('userId'));
  const [txt, setTxt] = useState('');

  /* send via REST so it’s saved + backend broadcasts */
  const send = async e => {
    e.preventDefault();
    const body = txt.trim();
    if (!body) return;

    /* optimistic echo */
    onLocalEcho({ senderId: uid, text: body });

    await fetch('http://localhost:3030/chat/send', {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ chatId, userId: uid, message: body })
    });

    setTxt('');
  };

  return (
    <>
      <div style={{maxHeight:'60vh',overflowY:'auto',marginBottom:12}}>
        {msgs.map((m,i)=>(
          <p key={i} style={{margin:'4px 0'}}>
            <strong>{m.senderId}:</strong> {m.text}
          </p>
        ))}
      </div>

      <form onSubmit={send}>
        <input style={{width:'80%'}} value={txt}
               onChange={e=>setTxt(e.target.value)}
               placeholder="Type…"/>
        <button>Send</button>
      </form>
    </>
  );
}