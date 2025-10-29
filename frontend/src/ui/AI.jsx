import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../css/AI.css'
import '../css/App.css' // ensures consistent header styles

export default function AiPage({ apiBase }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! 👋 What would you like to do today?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, summary: '' })
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('flowboard_tasks')
    return saved ? JSON.parse(saved) : []
  })
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    localStorage.setItem('flowboard_tasks', JSON.stringify(tasks))
  }, [tasks])

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

  // Instead of Calendar modal — local task adder
  function openAddModal(summary) {
    setModal({ open: true, summary })
  }

  function addLocalTask() {
    const newTask = {
      id: Date.now(),
      text: modal.summary,
      createdAt: new Date().toISOString(),
      done: false,
    }
    setTasks(prev => [...prev, newTask])
    setModal({ open: false, summary: '' })
  }

  function formatReply(text) {
    const lines = text.split(/[-•]\s+/).filter(l => l.trim() !== '')
    const ADD_MARKER = '§add'

    if (lines.length > 1) {
      return (
        <ul className="ai-list">
          {lines.map((line, idx) => {
            const isAddable = line.trim().endsWith(ADD_MARKER)
            const cleanText = line.replace(ADD_MARKER, '').trim()
            return (
              <li key={idx}>
                {cleanText}
                {isAddable && (
                  <button className="add-btn" onClick={() => openAddModal(cleanText)}>
                    + Add
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )
    }

    const isAddable = text.trim().endsWith(ADD_MARKER)
    const cleanText = text.replace(ADD_MARKER, '').trim()

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
      {/* --- Header/Nav --- */}
      <div className="topbar">
        <div className="brand">Flowboard AI</div>
        <div className="muted">Your personal productivity assistant</div>
        <div className="tabs">
          <Link to="/" className="tab">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* --- Main AI Chat Section --- */}
      <div className="ai-container">
        <div className="chat-box">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`msg ${m.role} fade-in`}
              style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {m.role === 'ai' ? formatReply(m.text) : <div>{m.text}</div>}
            </div>
          ))}

          {loading && (
            <div className="msg ai typing">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* --- Chat Input --- */}
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? '...' : 'Send'}
          </button>
        </div>

        {/* --- Modal for adding task --- */}
        {modal.open && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add Task</h3>
              <p>{modal.summary}</p>

              <div className="modal-buttons">
                <button onClick={addLocalTask}>Save</button>
                <button onClick={() => setModal({ open: false, summary: '' })}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Local task list preview --- */}
        {tasks.length > 0 && (
          <div className="task-preview">
            <h4>Your Tasks</h4>
            {tasks.map(t => (
              <div key={t.id} className="task-item">
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
