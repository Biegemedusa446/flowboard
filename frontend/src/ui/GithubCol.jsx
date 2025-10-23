import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { FaGithub } from 'react-icons/fa'
import '../css/GithubCol.css'

dayjs.extend(relativeTime)

export default function GithubCol({ apiBase }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`http://localhost:5000/api/github`)
        if (!res.ok) throw new Error(`Backend error: ${res.status}`)

        const json = await res.json()
        if (!cancelled) setEvents(json.events || [])
      } catch (e) {
        console.error('GitHub fetch failed', e)
        if (!cancelled) setError('Could not load GitHub events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [apiBase])

  if (loading)
    return (
      <div className="github-card">
        <div className="muted">Loading GitHub…</div>
      </div>
    )
  if (error)
    return (
      <div className="github-card">
        <div className="muted">{error}</div>
      </div>
    )
  if (!events.length)
    return (
      <div className="github-card">
        <div className="muted">No GitHub activity</div>
      </div>
    )

  return (
    <div className="github-container">
      {events.map(ev => (
        <div key={ev.id} className="github-card">
          <div className="row">
            <div>
              <strong>{ev.repo}</strong>
              <div className="muted">{dayjs(ev.time).fromNow()}</div>
            </div>
            <span className="pill">
              <FaGithub style={{ marginRight: 4 }} /> GitHub
            </span>
          </div>
          <div style={{ marginTop: 8 }}>{ev.action}</div>
        </div>
      ))}
    </div>
  )
}
