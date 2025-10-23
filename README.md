# 🧠 Productivity Dashboard Starter

This project provides a complete **AI-powered productivity dashboard** setup using **React (Vite)** for the frontend and **Flask** for the backend.

---

## 📁 Project Structure

| Folder / File | Description |
|----------------|-------------|
| **frontend/** | React application built with Vite |
| **backend/** | Flask API exposing endpoints (e.g., `/chat`) |
| **docker-compose.yml** | Orchestrates both services for local development |

---

## ⚙️ Local Quick Start (without Docker)

### 🧩 Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### ⚛️ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Then open 👉 **http://localhost:5173** in your browser.

---

## 🐳 Run with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run Command

```bash
docker compose up --build
```

Then open 👉 **http://localhost:5173** in your browser.

---

✅ Both services (React + Flask) will run automatically via Docker Compose.
