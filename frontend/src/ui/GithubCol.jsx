import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github } from 'lucide-react'
import '../css/GithubCol.css'

export default function GithubCol({ apiBase }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

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

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function renderEvent(ev) {
    const action = ev.action
    if (!action) return <div>Unknown event</div>

    switch (action.type) {
      case 'PushEvent': {
        const commits = action.commit_messages || []
        const commitCount = action.commit_count || commits.length
        const isExpanded = expanded[ev.id]
        const visibleCommits = isExpanded ? commits : commits.slice(0, 3)

        return (
          <div>
            <div>
              Pushed {commitCount} commit{commitCount !== 1 ? 's' : ''} to{' '}
              <strong>{action.branch}</strong>
            </div>

            {commits.length > 0 && (
              <ul className="commit-list">
                <AnimatePresence initial={false}>
                  {visibleCommits.map((msg, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      – {msg}
                    </motion.li>
                  ))}
                </AnimatePresence>

                {commits.length > 3 && (
                  <motion.li
                    className="muted show-more"
                    onClick={() => toggleExpand(ev.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      cursor: 'pointer',
                      color: '#8ab4f8',
                      marginTop: '4px',
                      listStyle: 'none',
                    }}
                  >
                    {isExpanded ? 'Show less ▲' : 'Show more ▼'}
                  </motion.li>
                )}
              </ul>
            )}
          </div>
        )
      }

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
      <div className="github-wrapper">
        <div className="muted">Loading GitHub activity…</div>
      </div>
    )

  if (!events.length)
    return (
      <div className="github-wrapper">
        <div className="muted">No recent activity</div>
      </div>
    )

  return (
    <div className="github-wrapper">
      <div className="github-header-glass">
        <div className="github-header-left">
          <Github size={18} strokeWidth={2.2} />
          <h3>GitHub Activity</h3>
        </div>
      </div>

      <div className="github-container">
        {events.map(ev => (
          <motion.div
            key={ev.id}
            className="github-card"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="row">
              <div>
                <strong>{ev.action.repo}</strong>
                <div className="muted">{formatTime(ev.created_at)}</div>
              </div>
              <a
                href={`https://github.com/${ev.action.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pill tag-blue"
              >
                <Github size={14} style={{ marginRight: 6 }} /> View
              </a>
            </div>
            <div style={{ marginTop: '8px' }}>{renderEvent(ev)}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
