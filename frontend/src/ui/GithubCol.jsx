import React, { useEffect, useState } from 'react'
import '../css/GithubCol.css'

export default function GithubCol({ apiBase }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiBase}/api/github`)
        const json = await res.json()
        setEvents(json || [])
      } catch (e) {
        console.error('GitHub fetch failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiBase])

  function formatTime(iso) {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  function renderEvent(ev) {
    const action = ev.action
    if (!action) return <div>Unknown event</div>

    switch (action.type) {
      case 'PushEvent':
        return (
          <div>
            <div>
              Pushed {action.commit_count} commit
              {action.commit_count !== 1 && 's'} to <strong>{action.branch}</strong>
            </div>
            {action.commit_messages?.length > 0 && (
              <ul className="commit-list">
                {action.commit_messages.slice(0, 3).map((msg, i) => (
                  <li key={i}>– {msg}</li>
                ))}
                {action.commit_messages.length > 3 && (
                  <li className="muted">…and more</li>
                )}
              </ul>
            )}
          </div>
        )

      case 'IssuesEvent':
      case 'PullRequestEvent':
      case 'PublicEvent':
        return <div>{action.detail}</div>

      default:
        return <div>{action.type}</div>
    }
  }

  if (loading)
    return (
      <div className="card">
        <div className="muted">Loading GitHub activity…</div>
      </div>
    )

  if (!events.length)
    return (
      <div className="card">
        <div className="muted">No recent activity</div>
      </div>
    )

  return (
    <div className="github-container">
      {events.map(ev => (
        <div key={ev.id} className="github-card">
          <div className="row">
            <div>
              <strong>{ev.action.repo}</strong>
              <div className="muted">{formatTime(ev.created_at)}</div>
            </div>
            <a
              href={`https://github.com/${ev.action.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pill"
            >
              <i className="fab fa-github"></i> GitHub
            </a>
          </div>
          <div style={{ marginTop: '8px' }}>{renderEvent(ev)}</div>
        </div>
      ))}
    </div>
  )
}
