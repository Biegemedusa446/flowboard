# Productivity Dashboard Starter

Project structure
1. frontend  React app built with Vite
2. backend   Flask API with a /chat endpoint
3. docker-compose.yml  to run both together

Local quick start without Docker
1. Backend
   a. cd backend
   b. python -m venv .venv
   c. source .venv/bin/activate  Windows use .venv\Scripts\activate
   d. pip install -r requirements.txt
   e. python app.py
2. Frontend
   a. cd frontend
   b. npm install
   c. npm run dev
   d. Open http  localhost 5173

Run with Docker
1. Install Docker Desktop
2. In the project root run
   docker compose up --build
3. Open http  localhost 5173

Next steps
1. Replace the placeholder chatbot logic in backend app.py with OpenAI calls
2. Add routes for weather news calendar github
3. Store minimal preferences in localStorage
4. Write simple tests for the chat endpoint
