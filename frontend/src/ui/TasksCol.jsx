import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { Check, Edit3, Trash2, Plus, Calendar } from 'lucide-react'
import '../css/TasksCol.css'

dayjs.extend(utc)
dayjs.extend(timezone)

export default function TasksCol({ apiBase }) {
  const [calendarEvents, setCalendarEvents] = useState([])
  const [localTasks, setLocalTasks] = useState(() => {
    const saved = localStorage.getItem('flowboard_tasks')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState(true)
  const [modal, setModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskData, setTaskData] = useState({ summary: '', date: '', start: '' })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiBase}/api/calendar`, { credentials: 'include' })
        const json = await res.json()
        if (!json.auth) setAuth(false)
        setCalendarEvents(json.events || [])
      } catch (e) {
        console.error('Calendar fetch failed', e)
        setAuth(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiBase])

  function saveTasks(updated) {
    setLocalTasks(updated)
    localStorage.setItem('flowboard_tasks', JSON.stringify(updated))
    window.dispatchEvent(new Event('tasks-updated'))
  }

  function openAddModal(task = null) {
    if (task) {
      setEditingTask(task)
      setTaskData({
        summary: task.text,
        date: dayjs(task.whenDate || new Date()).format('YYYY-MM-DD'),
        start: dayjs(task.whenTime || new Date()).format('HH:mm'),
      })
    } else {
      setEditingTask(null)
      setTaskData({ summary: '', date: '', start: '' })
    }
    setModal(true)
  }

  function saveTask() {
    const { summary, date, start } = taskData
    if (!summary.trim()) return alert('Please enter a title.')
    if (!date || !start) return alert('Please select a date and time.')

    const when = dayjs(`${date}T${start}`).format('ddd, MMM D · HH:mm')
    const updated = editingTask
      ? localTasks.map(t =>
          t.id === editingTask.id
            ? { ...t, text: summary.trim(), when, whenDate: date, whenTime: start }
            : t
        )
      : [
          ...localTasks,
          {
            id: Date.now(),
            text: summary.trim(),
            when,
            whenDate: date,
            whenTime: start,
            done: false,
            type: 'task',
          },
        ]

    saveTasks(updated)
    setModal(false)
    setEditingTask(null)
    setTaskData({ summary: '', date: '', start: '' })
  }

  function deleteTask(id) {
    saveTasks(localTasks.filter(t => t.id !== id))
  }

  function toggleDone(id) {
    saveTasks(localTasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const merged = [
    ...localTasks,
    ...calendarEvents.map(ev => ({
      id: ev.id,
      text: ev.summary,
      when: dayjs(ev.start).tz(dayjs.tz.guess()).format('ddd, MMM D · HH:mm'),
      type: 'calendar',
    })),
  ]

  if (loading) return <div className="muted">Loading calendar…</div>

  return (
    <div className="tasks-wrapper">
      <div className="tasks-header-glass">
        <div className="tasks-header-left">
          <Calendar size={18} strokeWidth={2.2} />
          <h3>Todos & Calendar</h3>
        </div>

        {auth && (
          <button className="icon-btn" onClick={() => openAddModal()} title="Add Task">
            <Plus size={18} strokeWidth={2.3} />
          </button>
        )}
      </div>

      <div className="tasks-container">
        {merged.length === 0 && <div className="muted empty">No tasks or events yet.</div>}

        {merged.map(item => (
          <div key={item.id} className={`task-card ${item.done ? 'done' : ''}`}>
            <div className="task-content">
              <div>
                <strong>{item.text}</strong>
                {item.when && <div className="muted">{item.when}</div>}
              </div>

              {item.type === 'task' && (
                <div className="task-actions">
                  <button
                    className="icon-btn"
                    onClick={() => toggleDone(item.id)}
                    title="Mark done"
                  >
                    <Check size={18} strokeWidth={2.3} />
                  </button>
                  <button className="icon-btn" onClick={() => openAddModal(item)} title="Edit task">
                    <Edit3 size={18} strokeWidth={2.3} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => deleteTask(item.id)}
                    title="Delete task"
                  >
                    <Trash2 size={18} strokeWidth={2.3} />
                  </button>
                </div>
              )}

              <span className={`pill ${item.type === 'calendar' ? 'tag-blue' : 'tag-green'}`}>
                {item.type}
              </span>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="modal-overlay">
          <div className="modal pop-in">
            <h3>{editingTask ? 'Edit Task' : 'Add Task'}</h3>
            <label>
              Title:
              <input
                type="text"
                required
                value={taskData.summary}
                onChange={e => setTaskData({ ...taskData, summary: e.target.value })}
              />
            </label>
            <label>
              Date:
              <input
                type="date"
                required
                value={taskData.date}
                onChange={e => setTaskData({ ...taskData, date: e.target.value })}
              />
            </label>
            <label>
              Time:
              <input
                type="time"
                required
                value={taskData.start}
                onChange={e => setTaskData({ ...taskData, start: e.target.value })}
              />
            </label>
            <div className="modal-buttons">
              <button className="btn accent" onClick={saveTask}>
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
