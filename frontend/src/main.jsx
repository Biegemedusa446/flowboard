import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './ui/App'
import AiPage from './ui/AI'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/ai" element={<AiPage apiBase={API_BASE} />} />
    </Routes>
  </BrowserRouter>
)
