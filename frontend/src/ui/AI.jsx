import React, { useState, useEffect, useRef } from 'react'
import '../css/AI.css'

export default function AiPage({ apiBase }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! 👋 What would you like to do today?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, summary: '' })
  const [eventDetails, setEventDetails] = useState({
    date: '',
    start: '',
    end: '',
  })
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
    const now = new Date()
    const defaultDate = now.toISOString().split('T')[0]
    const startTime = now.toTimeString().slice(0, 5)
    const endTime = new Date(now.getTime() + 30 * 60000)
      .toTimeString()
      .slice(0, 5)

    setEventDetails({
      date: defaultDate,
      start: startTime,
      end: endTime,
    })
    setModal({ open: true, summary })
  }

  async function createCalendarEvent() {
    const { summary } = modal
    const { date, start, end } = eventDetails

    if (!date || !start || !end) {
      alert('Please select a date and time.')
      return
    }

    const startISO = new Date(`${date}T${start}`).toISOString()
    const endISO = new Date(`${date}T${end}`).toISOString()

    try {
      const res = await fetch(`${apiBase}/api/calendar/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ summary, start: startISO, end: endISO }),
      })
      const json = await res.json()
      if (json.success) {
        alert(`✅ Added "${summary}" to your calendar`)
      } else {
        alert(`⚠️ Failed to add event: ${json.error || 'Unknown error'}`)
      }
    } catch {
      alert('⚠️ Error adding event')
    } finally {
      setModal({ open: false, summary: '' })
    }
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
                  <button
                    className="add-btn"
                    onClick={() => openAddModal(cleanText)}
                  >
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

      {modal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add to Calendar</h3>
            <p>{modal.summary}</p>
            <label>
              Date:
              <input
                type="date"
                value={eventDetails.date}
                onChange={e =>
                  setEventDetails({ ...eventDetails, date: e.target.value })
                }
              />
            </label>
            <label>
              Start time:
              <input
                type="time"
                value={eventDetails.start}
                onChange={e =>
                  setEventDetails({ ...eventDetails, start: e.target.value })
                }
              />
            </label>
            <label>
              End time:
              <input
                type="time"
                value={eventDetails.end}
                onChange={e =>
                  setEventDetails({ ...eventDetails, end: e.target.value })
                }
              />
            </label>

            <div className="modal-buttons">
              <button onClick={createCalendarEvent}>Save</button>
              <button onClick={() => setModal({ open: false, summary: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
