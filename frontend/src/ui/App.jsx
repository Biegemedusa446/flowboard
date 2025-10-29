import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import WeatherCol from './WeatherCol'
import TasksCol from './TasksCol'
import GithubCol from './GithubCol'
import { Link } from 'react-router-dom'
import '../css/App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function App() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCity, setSelectedCity] = useState('Berlin')

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
      <div className="topbar">
        <div className="brand">Flowboard</div>
        <div className="muted">Personal productivity board</div>
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

      <div className="board">
        {(activeTab === 'all' || activeTab === 'weather') && (
          <div className="column weather-col">
            <div className="row">
              <h3>Weather</h3>
              <span className="pill tag-cyan">{dayjs().format('MMM D')}</span>
            </div>
            <WeatherCol apiBase={API_BASE} city={selectedCity} onCityChange={setSelectedCity} />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'tasks') && (
          <div className="column tasks-col">
            <div className="row">
              <h3>Todos & Calendar</h3>
            </div>
            <TasksCol apiBase={API_BASE} />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'github') && (
          <div className="column github-col">
            <div className="row">
              <h3>GitHub</h3>
            </div>
            <GithubCol apiBase={API_BASE} />
          </div>
        )}
      </div>
    </div>
  )
}
