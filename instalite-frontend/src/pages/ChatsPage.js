// src/pages/ChatsPage.js
import { useEffect, useState, useCallback } from 'react'
import socket from '../socket'

export default function ChatsPage() {
  const uid = Number(localStorage.getItem('userId'))
  const [chats, setChats]     = useState([])  // [ { chatId, members } ]
  const [history, setHistory] = useState({})  // { chatId: [ { senderId, text } ] }
  const [active, setActive]   = useState(null)

  // helper to push one message into state
  const addMsg = useCallback((chatId, msg) => {
    setHistory(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), msg]
    }))
  }, [])

  // Load all chat sessions once on mount, join rooms, pull history
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`http://localhost:3030/chat/sessions?userId=${uid}`)
        const raw = await r.json()
        // normalize shape
        const sessions = raw.map(r => ({
          chatId: r.chatId ?? r.chat_session_id,
          members: r.members ?? JSON.parse(r.chat_members)
        }))
        setChats(sessions)
        if (sessions.length) setActive(sessions[0].chatId)

        for (const c of sessions) {
          // join with an ack callback so the server’s callback doesn’t blow up
          socket.emit('joinChat', c.chatId, (ack) => {
            console.log('joined room', c.chatId, '→', ack)
          })

          // fetch history
          const h = await fetch(`http://localhost:3030/chat/history?chatId=${c.chatId}`)
                        .then(r => r.json())
          setHistory(prev => ({ ...prev, [c.chatId]: h }))
        }
      } catch (err) {
        console.error('Failed to load chats:', err)
      }
    })()
  }, [uid])

  // Subscribe to live socket events
  useEffect(() => {
    const handler = m => addMsg(m.chatId, m)
    socket.on('chatMessage', handler)
    return () => socket.off('chatMessage', handler)
  }, [addMsg])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* LEFT: chat list */}
      <aside style={{ width: 260, borderRight: '1px solid #ddd' }}>
        {chats.map(c => (
          <div
            key={c.chatId}
            onClick={() => {
              setActive(c.chatId)
              socket.emit('joinChat', c.chatId, () => {})
            }}
            style={{
              padding: 12,
              cursor: 'pointer',
              background: c.chatId === active ? '#eef' : undefined
            }}
          >
            <strong>Chat {c.chatId}</strong><br/>
            <small>{c.members.join(', ')}</small>
          </div>
        ))}
      </aside>

      {/* RIGHT: message window */}
      <main style={{ flex: 1, padding: 24 }}>
        {active == null
          ? <em>Select a chat</em>
          : <ChatWindow
              chatId={active}
              msgs={history[active] || []}
              onLocalEcho={msg => addMsg(active, msg)}
            />
        }
      </main>
    </div>
  )
}

// ChatWindow – shows messages + input box
function ChatWindow({ chatId, msgs, onLocalEcho }) {
  const uid = Number(localStorage.getItem('userId'))
  const [text, setText] = useState('')

  const send = async e => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return

    // optimistic echo locally
    // onLocalEcho({ senderId: uid, text: body })

    // store in DB and trigger server broadcast
    await fetch('http://localhost:3030/chat/send', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ chatId, userId: uid, message: body })
    })

    setText('')
  }

  return (
    <>
      <div style={{ maxHeight:'60vh', overflowY:'auto', marginBottom:12 }}>
        {msgs.map((m,i) => (
          <p key={i} style={{ margin:'4px 0' }}>
            <strong>{m.senderId}:</strong> {m.text}
          </p>
        ))}
      </div>

      <form onSubmit={send}>
        <input
          style={{ width:'80%' }}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button type="submit">Send</button>
      </form>
    </>
  )
}
