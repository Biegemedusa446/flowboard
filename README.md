# 🚀 Flowboard — AI-Powered Productivity Dashboard  

This repository contains the configuration and setup for an **AI-driven productivity dashboard** built with **React (Vite)** and **Flask**. It integrates multiple APIs — including **Google Gemini**, **Google Calendar**, **GitHub**, and **Visual Crossing Weather** — into a unified personal productivity tool.  

The project also supports **automated deployment** via **GitHub Actions** and **Netlify Build Hooks**, providing continuous integration and delivery (CI/CD).  

---

<details>
<summary><strong>📖 Project Overview</strong></summary>  

<strong>Project Name:</strong> `Flowboard — AI Productivity Dashboard`  

### 🎯 Key Features  
- 🤖 **Gemini AI Assistant:** Context-aware chat for scheduling and task suggestions.  
- 🌦 **Weather Forecasts:** Real-time data from Visual Crossing API.  
- 🗓 **Google Calendar Integration:** View and create events directly from the dashboard.  
- 💻 **GitHub Activity Feed:** Displays your recent commits, PRs, and issue events.  
- 🧩 **Unified UI:** React-based interface with dynamic, interactive columns.  
- 🚀 **Automated Deployment:** CI/CD pipeline through GitHub Actions and Netlify.  

### 🏗 Architecture  
| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | React (Vite) |
| Backend | Flask (Python) | API aggregation and business logic |
| AI | Google Gemini API |
| Calendar | Google Calendar API |
</details>  

---
<details>
<summary><strong>🔐 Security Considerations</strong></summary>  

- All sensitive credentials (e.g., `GEMINI_API_KEY`, `WEATHER_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_CLIENT_ID`, `NETLIFY_AUTH_TOKEN`) are securely stored as **GitHub Secrets** and **environment variables**.  
- The `.env` and `credentials.json` files are explicitly excluded via `.gitignore`.  
- CORS is restricted to `http://localhost:5173` for development, and Netlify domain in production.  

</details>  

---

<details>
<summary><strong>⚙️ Prerequisites</strong></summary>  

- Node.js ≥ 18  
- Python ≥ 3.10  
- Docker (optional, for containerized runs)  
- Google OAuth credentials (`credentials.json`) for Calendar API  
- Visual Crossing and Gemini API keys  

</details>  

---

<details>
<summary><strong>📌 How to Use</strong></summary>  

1. **Clone the repository:**  
   ```bash
   git clone https://github.com/<your-username>/flowboard.git
   cd flowboard
   ```  

2. **Run locally without Docker:**  
   - Backend  
     ```bash
     cd backend
     python -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     python app.py
     ```  
   - Frontend  
     ```bash
     cd frontend
     npm install
     npm run dev
     ```  
   - Open [http://localhost:5173](http://localhost:5173)  

3. **Run with Docker:**  
   ```bash
   docker compose up --build
   ```  

</details>  

---

<details>
<summary><strong>⚠️ Limitations</strong></summary>  

- The system relies on third-party APIs (Gemini, Netlify, Google Calendar, Visual Crossing) which may experience rate limits or temporary downtime.  
- Google Calendar OAuth requires manual consent for first-time users.  
- Free Netlify tier has limited build minutes per month.  

</details>  

---

<details>
<summary><strong>🛠 Troubleshooting</strong></summary>  

- Ensure all required secrets are correctly configured in your GitHub repository.  
- If CORS errors appear, confirm that frontend and backend origins match.  
- Re-generate and refresh your Google OAuth credentials if token errors occur.  

</details>  
