import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import '../css/TasksCol.css'

dayjs.extend(utc)
dayjs.extend(timezone)

const sampleTasks = [
  { id: 1, text: 'Write exposé section', when: 'today', type: 'task' },
  { id: 2, text: 'Meeting: thesis seminar', when: 'today', type: 'calendar' },
  { id: 3, text: 'Study: React hooks 20 min', when: 'tomorrow', type: 'task' },
]

export default function TasksCol({ apiBase }) {
  const [calendarEvents, setCalendarEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:5000/api/calendar`, { credentials: 'include' })
        const json = await res.json()
        if (!json.auth) setAuth(false)
        setCalendarEvents(json.events || [])
      } catch (e) {
        console.error('Calendar fetch failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiBase])

  const merged = [
    ...sampleTasks,
    ...calendarEvents.map(ev => {
      let start = ev.start
      let formatted = dayjs(start).tz(dayjs.tz.guess()).format('ddd, MMM D · HH:mm')
      return {
        id: ev.id,
        text: ev.summary,
        when: formatted,
        type: 'calendar',
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

  return (
    <div className="tasks-container">
      {merged.map(item => (
        <div key={item.id} className="task-card">
          <div className="row">
            <div>
              <strong>{item.text}</strong>
              <div className="muted">{item.when}</div>
            </div>
            <span className={`pill ${item.type === 'calendar' ? 'tag-blue' : 'tag-green'}`}>
              {item.type}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
