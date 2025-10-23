import React, { useState } from 'react'
import '../css/SuggestBar.css'

export default function SuggestBar({ apiBase }) {
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setReply('')

    try {
      const res = await fetch(`http://localhost:5000/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const json = await res.json()
      setReply(json.reply || 'No reply')
    } catch (err) {
      console.error('Chat error:', err)
      setReply('Error: could not connect to AI')
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  return (
    <div className="suggest-bar">
      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          placeholder="Ask Flowboard AI something..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? '...' : 'Send'}
        </button>
      </form>

      {reply && (
        <div className="chat-reply">
          <strong>AI:</strong> {reply}
        </div>
      )}
    </div>
  )
}
