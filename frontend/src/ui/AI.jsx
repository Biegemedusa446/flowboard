import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../css/AI.css'
import '../css/App.css'

export default function AiPage({ apiBase }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! 👋 What would you like to do today?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, summary: '' })
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    if (!input.trim()) return
    const userMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [...messages, userMessage] }),
      })
      const json = await res.json()
      const aiMessage = { role: 'ai', text: json.reply }
      setMessages(prev => [...prev, aiMessage])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ Could not reach AI. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function openAddModal(summary) {
    setModal({ open: true, summary })
  }

  function addLocalTask() {
    const newTask = {
      id: Date.now(),
      text: modal.summary,
      createdAt: new Date().toISOString(),
      done: false,
      type: 'task',
    }

    const current = JSON.parse(localStorage.getItem('flowboard_tasks') || '[]')
    const updated = [...current, newTask]
    localStorage.setItem('flowboard_tasks', JSON.stringify(updated))
    window.dispatchEvent(new Event('tasks-updated'))

    setModal({ open: false, summary: '' })
  }

  function formatReply(text) {
    const ADD = '§add'
    const tasks = []
    text.replace(/([^§]+?)\s*§add/gi, (_, raw) => {
      const cleaned = String(raw)
        .replace(/^[\s*\-•]+/, '')
        .replace(/[.\s,;:]+$/g, '')
        .trim()
      if (cleaned) tasks.push(cleaned)
      return ''
    })

    if (tasks.length) {
      return (
        <ul className="ai-list">
          {tasks.map((t, idx) => (
            <li key={idx}>
              {t}
              <button className="add-btn" onClick={() => openAddModal(t)}>
                + Add
              </button>
            </li>
          ))}
        </ul>
      )
    }
    const lines = text
      .split(/\n+/)
      .flatMap(line =>
        line
          .split(/(?:^|\s)[\-*•]\s+/g)
          .map(s => s.trim())
      )
      .filter(Boolean)

    if (lines.length > 1) {
      return (
        <ul className="ai-list">
          {lines.map((line, idx) => {
            const isAddable = /§add\s*$/i.test(line)
            const clean = line
              .replace(/§add\s*$/i, '')
              .replace(/^[\-\*•]\s*/, '')
              .replace(/[.\s,;:]+$/g, '')
              .trim()
            return (
              <li key={idx}>
                {clean}
                {isAddable && (
                  <button className="add-btn" onClick={() => openAddModal(clean)}>
                    + Add
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )
    }

    // 3) Plain text (no tasks detected)
    const isAddable = /§add\s*$/i.test(text)
    const cleanText = text.replace(/§add\s*$/i, '').trim()
    return (
      <div>
        {cleanText}
        {isAddable && (
          <button className="add-btn" onClick={() => openAddModal(cleanText)}>
            + Add
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="ai-page">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="brand">Flowboard AI</div>
          <div className="muted">Your personal productivity assistant</div>
        </div>
        <div className="tabs">
          <Link to="/" className="tab">← Back to Dashboard</Link>
        </div>
      </div>

      <div className="ai-container">
        <div className="chat-box">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`msg ${m.role}${loading && idx === messages.length - 1 ? ' loading' : ''}`}
              style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {m.role === 'ai' ? formatReply(m.text) : <div>{m.text}</div>}
            </div>
          ))}

          {loading && (
            <div className="msg ai typing" style={{ alignSelf: 'flex-start' }}>
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything, or tell me what to plan..."
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? '...' : 'Send'}
          </button>
        </div>

        {/* Add Task Modal */}
        {modal.open && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add Task</h3>
              <p>{modal.summary}</p>
              <div className="modal-buttons">
                <button onClick={addLocalTask}>Save</button>
                <button onClick={() => setModal({ open: false, summary: '' })}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
