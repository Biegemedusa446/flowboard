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
| Frontend | React (Vite) | Dashboard UI |
| Backend | Flask (Python) | API aggregation and business logic |
| Database | Session-based | Lightweight caching |
| AI | Google Gemini API | Chat assistant |
| Calendar | Google Calendar API | Event management |
| Deployment | GitHub Actions + Netlify | Continuous delivery |
| Auth | OAuth 2.0 | Google login integration |
</details>  

---

<details>
<summary><strong>🛠 Jobs in the Workflow</strong></summary>  

### ✅ Build, Test, and Deploy  
This workflow automates dependency installation, build verification, code quality checks, and Netlify deployment.  

#### 🔹 Steps:  
1. **Checkout Code:**  
   - Uses the `actions/checkout@v3` action to clone the repository.  

2. **Install Dependencies:**  
   - Installs both frontend and backend dependencies using `npm install` and `pip install`.  

3. **Build Frontend:**  
   - Executes `npm run build` inside the `frontend` directory to generate a production build.  

4. **Run Backend Tests (Optional):**  
   - Placeholder for unit tests or Flask endpoint verification.  

5. **Upload Build Artifact:**  
   - Uses `actions/upload-artifact@v4` to store the frontend build output for deployment.  

6. **Deploy to Netlify:**  
   - Automatically deploys to Netlify using a build hook or `South-Paw/action-netlify-deploy@v1.2.0`.  

</details>  

---

<details>
<summary><strong>🚀 Deployment Pipeline</strong></summary>  

This CI/CD pipeline automates the process of deploying Flowboard to Netlify after each successful build.  

#### 🔹 Steps:  
1. **Trigger:**  
   - Runs on push or pull requests to the `main` or `staging` branches.  

2. **Build Artifact Download:**  
   - Retrieves the frontend build files from GitHub Actions.  

3. **Set Environment Variables:**  
   - Configures Netlify environment settings dynamically based on the branch.  

4. **Netlify Deployment:**  
   - Deploys the production build using the **Netlify Auth Token** and **Site ID** stored as GitHub Secrets.  

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
- Netlify account with build hook configured  
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
     source .venv/bin/activate  # or .venv\Scripts\activate on Windows
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

4. **CI/CD Deployment:**  
   - Push commits to `main` or `staging` to trigger GitHub Actions.  
   - Monitor progress in the repository’s **Actions** tab.  
   - Verify live deployment on **Netlify**.  

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
- For deployment issues, verify Netlify site IDs and tokens in GitHub Secrets.  

</details>  
