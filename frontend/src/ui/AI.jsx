import React, { useState } from 'react'
import '../css/AI.css'

export default function AiPage({ apiBase }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! 👋 What would you like to do today?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return
    const userMessage = { role: 'user', text: input }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:5000/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [...messages, userMessage] }),
      })
      const json = await res.json()
      const aiMessage = { role: 'ai', text: json.reply }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Failed to reach AI.' }])
    } finally {
      setLoading(false)
    }
  }

  async function addToCalendar(summary) {
    try {
      const now = new Date()
      const start = new Date(now.getTime() + 5 * 60000).toISOString() // 5 min from now
      const end = new Date(now.getTime() + 35 * 60000).toISOString() // 30 min duration

      const res = await fetch(`http://localhost:5000/api/calendar/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ summary, start, end }),
      })
      const json = await res.json()
      if (json.success) {
        alert(`✅ Added "${summary}" to your calendar`)
      } else {
        alert(`⚠️ Failed to add event: ${json.error || 'Unknown error'}`)
      }
    } catch (e) {
      alert('⚠️ Error adding event')
    }
  }

  // Format text into bullet points with Add buttons
  function formatReply(text) {
    const lines = text.split(/[-•]\s+/).filter(l => l.trim() !== '')
    if (lines.length > 1) {
      return (
        <ul className="ai-list">
          {lines.map((line, idx) => (
            <li key={idx}>
              {line}
              <button className="add-btn" onClick={() => addToCalendar(line)}>
                + Add
              </button>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div>
        {text}{' '}
        <button className="add-btn" onClick={() => addToCalendar(text)}>
          + Add
        </button>
      </div>
    )
  }

  return (
    <div className="ai-container">
      <div className="chat-box">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.role}`}>
            {m.role === 'ai' ? formatReply(m.text) : m.text}
          </div>
        ))}
        {loading && <div className="msg ai">...</div>}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}
