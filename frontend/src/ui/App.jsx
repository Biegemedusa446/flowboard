import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import WeatherCol from './WeatherCol'
import TasksCol from './TasksCol'
import GithubCol from './GithubCol'
import { Link } from 'react-router-dom'
import '../css/App.css'

// Lucide icons
import { Sun } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function App() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCity, setSelectedCity] = useState('')

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'weather', label: 'Weather' },
    { id: 'tasks', label: 'Todos & Calendar' },
    { id: 'github', label: 'GitHub' },
    { id: 'ai', label: 'AI Assistant' },
  ]

  useEffect(() => {
    const savedCity = localStorage.getItem('selectedCity')
    if (savedCity) setSelectedCity(savedCity)
  }, [])

  useEffect(() => {
    localStorage.setItem('selectedCity', selectedCity)
  }, [selectedCity])

  return (
    <div className="app-shell">
      {/* --- Top Navigation Bar --- */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="brand">Flowboard</div>
          <div className="muted">Personal productivity board</div>
        </div>

        <div className="tabs">
          {tabs.map(t =>
            t.id === 'ai' ? (
              <Link key={t.id} to="/ai" className="tab">
                {t.label}
              </Link>
            ) : (
              <div
                key={t.id}
                className={'tab ' + (activeTab === t.id ? 'active' : '')}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </div>
            )
          )}
        </div>
      </div>

      {/* --- Main Dashboard --- */}
      <div className="board">
        {/* --- Weather Column --- */}
        {(activeTab === 'all' || activeTab === 'weather') && (
          <div className="column weather-col">
            <div className="header-bar">
              <div className="header-left">
                <Sun size={20} strokeWidth={2} />
                <h3>Weather</h3>
              </div>
              <span className="pill tag-cyan">{dayjs().format('MMM D')}</span>
            </div>

            <WeatherCol apiBase={API_BASE} city={selectedCity} onCityChange={setSelectedCity} />
          </div>
        )}

        {/* --- Tasks & Calendar Column --- */}
        {(activeTab === 'all' || activeTab === 'tasks') && <TasksCol apiBase={API_BASE} />}

        {/* --- GitHub Column --- */}
        {(activeTab === 'all' || activeTab === 'github') && <GithubCol apiBase={API_BASE} />}
      </div>
    </div>
  )
}
