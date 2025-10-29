import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import '../css/TasksCol.css'

dayjs.extend(utc)
dayjs.extend(timezone)

export default function TasksCol({ apiBase }) {
  const [calendarEvents, setCalendarEvents] = useState([])
  const [localTasks, setLocalTasks] = useState(() => {
    const saved = localStorage.getItem('flowboard_local_tasks')
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, text: 'Write exposé section', when: 'today', type: 'task', done: false },
          { id: 2, text: 'Study: React hooks 20 min', when: 'tomorrow', type: 'task', done: false },
        ]
  })
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState(true)
  const [modal, setModal] = useState(false)
  const [eventData, setEventData] = useState({
    summary: '',
    date: '',
    start: '',
    end: '',
  })

  useEffect(() => {
    localStorage.setItem('flowboard_local_tasks', JSON.stringify(localTasks))
  }, [localTasks])

  async function loadCalendar() {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/calendar`, { credentials: 'include' })
      const json = await res.json()
      if (!json.auth) setAuth(false)
      setCalendarEvents(json.events || [])
    } catch (e) {
      console.error('Calendar fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendar()
  }, [apiBase])

  function addLocalTask() {
    const { summary, date, start } = eventData
    if (!summary.trim() || !date || !start) {
      alert('Please fill all fields.')
      return
    }

    const when = dayjs(`${date}T${start}`).format('ddd, MMM D · HH:mm')
    const newTask = {
      id: Date.now(),
      text: summary.trim(),
      when,
      type: 'task',
      done: false,
    }

    setLocalTasks(prev => [...prev, newTask])
    setModal(false)
    setEventData({ summary: '', date: '', start: '', end: '' })
  }

  function toggleTaskDone(id) {
    setLocalTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  function deleteTask(id) {
    if (confirm('Delete this task?')) {
      setLocalTasks(prev => prev.filter(t => t.id !== id))
    }
  }

  function editTask(id, newText) {
    setLocalTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, text: newText.trim() } : t))
    )
  }

  // Combine local tasks and calendar events
  const merged = [
    ...localTasks,
    ...calendarEvents.map(ev => {
      let start = ev.start
      let formatted = dayjs(start).tz(dayjs.tz.guess()).format('ddd, MMM D · HH:mm')
      return {
        id: ev.id,
        text: ev.summary,
        when: formatted,
        type: 'calendar',
        done: false,
      }
    }),
  ]

  if (loading)
    return (
      <div className="card">
        <div className="muted">Loading calendar…</div>
      </div>
    )

  if (!auth)
    return (
      <div className="card">
        <a href={`${apiBase}/login/google`} className="btn accent">
          Connect Google Calendar
        </a>
      </div>
    )

  // Prefill modal with current date and time
  function openModal() {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const start = now.toTimeString().slice(0, 5)
    const end = new Date(now.getTime() + 30 * 60000).toTimeString().slice(0, 5)
    setEventData({ summary: '', date, start, end })
    setModal(true)
  }

  return (
    <div className="tasks-container">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>My Tasks & Events</h4>
        <button className="btn small accent" onClick={openModal}>
          + Add Task
        </button>
      </div>

      {merged.map(item => (
        <div
          key={item.id}
          className={`task-card ${item.done ? 'done' : ''}`}
          style={{ opacity: item.done ? 0.7 : 1 }}
        >
          <div className="row" style={{ alignItems: 'center' }}>
            {item.type === 'task' && (
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleTaskDone(item.id)}
              />
            )}
            <div style={{ flex: 1, marginLeft: 8 }}>
              <EditableText
                text={item.text}
                onSave={newText => editTask(item.id, newText)}
                disabled={item.type === 'calendar'}
              />
              <div className="muted">{item.when}</div>
            </div>
            <span className={`pill ${item.type === 'calendar' ? 'tag-blue' : 'tag-green'}`}>
              {item.type}
            </span>
            {item.type === 'task' && (
              <button
                className="btn small danger"
                onClick={() => deleteTask(item.id)}
                style={{ marginLeft: 8 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Task</h3>
            <label>
              Title:
              <input
                type="text"
                value={eventData.summary}
                onChange={e => setEventData({ ...eventData, summary: e.target.value })}
              />
            </label>
            <label>
              Date:
              <input
                type="date"
                value={eventData.date}
                onChange={e => setEventData({ ...eventData, date: e.target.value })}
              />
            </label>
            <label>
              Start Time:
              <input
                type="time"
                value={eventData.start}
                onChange={e => setEventData({ ...eventData, start: e.target.value })}
              />
            </label>

            <div className="modal-buttons">
              <button className="btn accent" onClick={addLocalTask}>
                Save
              </button>
              <button className="btn" onClick={() => setModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline editable text component
function EditableText({ text, onSave, disabled }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(text)

  useEffect(() => setValue(text), [text])

  function handleSave() {
    if (value.trim() !== text) onSave(value)
    setEditing(false)
  }

  if (disabled) return <strong>{text}</strong>

  return editing ? (
    <input
      className="edit-input"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => e.key === 'Enter' && handleSave()}
      autoFocus
    />
  ) : (
    <strong onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
      {text}
    </strong>
  )
}
