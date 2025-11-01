import os
import time
import requests
from datetime import datetime
from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime, timedelta


# =====================================================
# --- Load environment variables ---
# =====================================================
load_dotenv()

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key-change-this")

# =====================================================
# --- Environment Variables ---
# =====================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
GITHUB_USER = os.getenv("GITHUB_USER")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
CLIENT_SECRETS_FILE = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "backend/credentials.json")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5000/oauth2callback")
GOOGLE_SCOPES = os.getenv("GOOGLE_SCOPES", "https://www.googleapis.com/auth/calendar").split(",")

# --- Validate credentials path ---
if not os.path.exists(CLIENT_SECRETS_FILE):
    print(f"WARNING: Google credentials file not found at '{CLIENT_SECRETS_FILE}'")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY missing from environment.")
if not WEATHER_API_KEY:
    print("WARNING: WEATHER_API_KEY missing from environment.")

# =====================================================
# --- Gemini Chat Endpoint
# =====================================================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    history = data.get("history", [])
    user_message = history[-1]["text"] if history else None

    if not user_message:
        return jsonify({"reply": "Please type something so I can help."})

    session.setdefault("chat_history", [])
    session["chat_history"].extend(history)

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
    }

    system_prompt = (
        "You are Flowboard AI, a concise productivity/chat assistant. "
        "Always reply in short, clear sentences or bullet points. "
        "Avoid long essays. Keep responses under 5 sentences unless explicitly asked. "
        "If listing, use simple dashes (- item) instead of Markdown stars. "
        "Whenever you suggest an actionable activity or task (something the user can do, schedule, or complete), "
        "append the marker ' §add' at the end of that line. "
        "Do not add this marker to greetings, explanations, or normal responses."
    )

    contents = [{"role": "user", "parts": [{"text": system_prompt}]}]
    for msg in session["chat_history"]:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["text"]}]})
    payload = {"contents": contents}

    # --- Retry logic for transient errors ---
    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            break
        except requests.exceptions.RequestException as e:
            status_code = getattr(e.response, "status_code", None)
            print(f"⚠️ Gemini API error (attempt {attempt + 1}): {e}")
            if status_code == 503 and attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
                continue
            elif status_code == 401:
                return jsonify({"reply": "Invalid or expired Gemini API key."}), 401
            else:
                return jsonify({"reply": "The AI service is currently unavailable. Please try again later."}), 503
    else:
        return jsonify({"reply": "Sorry, I'm having trouble connecting to the AI service. Try again soon!"}), 500

    # --- Parse reply ---
    try:
        reply = (
            data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "No reply")
        )
    except Exception:
        reply = "Sorry, I couldn’t understand the response from the AI service."

    session["chat_history"].append({"role": "model", "text": reply})
    return jsonify({"reply": reply})


# =====================================================
# --- Weather Endpoint
# =====================================================
BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"

@app.route("/api/weather", methods=["GET"])
def get_weather():
    city = request.args.get("city", "Berlin")
    days = int(request.args.get("days", 1))
    try:
        url = f"{BASE_URL}/{city}?unitGroup=metric&include=days,hours,alerts&key={WEATHER_API_KEY}&contentType=json"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if "days" in data:
            data["days"] = data["days"][:days]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# --- GitHub Activity Endpoint
# =====================================================
@app.route("/api/github", methods=["GET"])
def github_events():
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    url = f"https://api.github.com/users/{GITHUB_USER}/events"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        grouped_pushes = defaultdict(lambda: {"commits": [], "last_time": None})
        events = []

        for ev in data[:15]:
            etype = ev.get("type")
            repo_name = ev.get("repo", {}).get("name", "Unknown repo")
            created_at = ev.get("created_at")
            payload = ev.get("payload", {})

            # --- Handle PushEvent grouping ---
            if etype == "PushEvent":
                branch = payload.get("ref", "").replace("refs/heads/", "")
                commits = payload.get("commits", [])
                commit_messages = [c.get("message", "") for c in commits]

                # Fetch commit messages
                if not commit_messages and repo_name and branch:
                    try:
                        commits_url = f"https://api.github.com/repos/{repo_name}/commits?sha={branch}&per_page=20"
                        commits_res = requests.get(commits_url, headers=headers)
                        commits_res.raise_for_status()
                        commit_messages = [
                            c["commit"]["message"] for c in commits_res.json()[:20]
                        ]
                    except Exception as fetch_err:
                        print(f"⚠️ Could not fetch commits for {repo_name}/{branch}: {fetch_err}")

                key = f"{repo_name}:{branch}"
                grouped_pushes[key]["commits"].extend(commit_messages)
                grouped_pushes[key]["last_time"] = created_at
                continue

            # --- Non-push events stay as-is ---
            if etype == "PublicEvent":
                events.append({
                    "id": ev.get("id"),
                    "created_at": created_at,
                    "action": {
                        "type": "PublicEvent",
                        "repo": repo_name,
                        "detail": f"Made {repo_name} public",
                    }
                })

        # Convert grouped push events to single entries
        for key, value in grouped_pushes.items():
            repo_name, branch = key.split(":")
            unique_commits = list(dict.fromkeys(value["commits"]))  # remove dupes
            events.append({
                "id": f"grouped-{key}",
                "created_at": value["last_time"],
                "action": {
                    "type": "PushEvent",
                    "repo": repo_name,
                    "branch": branch,
                    "commit_count": len(unique_commits),
                    "commit_messages": unique_commits[:20],
                }
            })

        # Sort newest first
        events.sort(key=lambda e: e.get("created_at", ""), reverse=True)
        return jsonify(events)

    except Exception as e:
        print("⚠️ GitHub API error:", e)
        return jsonify({"error": str(e)}), 500

# =====================================================
# --- Google Calendar OAuth + API
# =====================================================
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

@app.route("/login/google")
def login_google():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(prompt="consent")
    session["state"] = state
    return redirect(auth_url)

@app.route("/oauth2callback")
def oauth2callback():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    flow.fetch_token(authorization_response=request.url)

    creds = flow.credentials
    session["credentials"] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes
    }
    return redirect("http://localhost:5173")

@app.route("/api/calendar")
def get_calendar():
    if "credentials" not in session:
        return jsonify({"events": [], "auth": False})
    creds = Credentials(**session["credentials"])
    try:
        service = build("calendar", "v3", credentials=creds)
        now = datetime.utcnow().isoformat() + "Z"
        events_result = service.events().list(
            calendarId="primary",
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        events = []
        for ev in events_result.get("items", []):
            if "birthday" in ev.get("summary", "").lower():
                continue
            start = ev["start"].get("dateTime", ev["start"].get("date"))
            events.append({
                "id": ev["id"],
                "summary": ev.get("summary", "(No title)"),
                "start": start
            })

        return jsonify({"events": events, "auth": True})
    except Exception as e:
        return jsonify({"error": str(e), "events": [], "auth": False}), 500

@app.route("/api/calendar/add", methods=["POST"])
def add_calendar_event():
    if "credentials" not in session:
        return jsonify({"auth": False, "error": "Not logged in"}), 401
    creds = Credentials(**session["credentials"])
    try:
        data = request.get_json(force=True)
        summary = data.get("summary", "AI Suggested Task")
        start = data.get("start")
        end = data.get("end")

        service = build("calendar", "v3", credentials=creds)
        event = {
            "summary": summary,
            "start": {"dateTime": start, "timeZone": "Europe/Berlin"},
            "end": {"dateTime": end, "timeZone": "Europe/Berlin"},
        }
        created_event = service.events().insert(calendarId="primary", body=event).execute()
        return jsonify({"success": True, "event": created_event})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# --- Main Entrypoint
# =====================================================
if __name__ == "__main__":
    host = os.getenv("FLASK_RUN_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_RUN_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    print(f"🚀 Starting Flask on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
