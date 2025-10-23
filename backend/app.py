import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dotenv import load_dotenv

# --- Load environment variables ---
load_dotenv()

# --- Flask App Setup ---
app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)

app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key-change-this")

# --- Environment Variables ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
GITHUB_USER = os.getenv("GITHUB_USER")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
CLIENT_SECRETS_FILE = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "credentials.json")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_SCOPES = os.getenv("GOOGLE_SCOPES", "https://www.googleapis.com/auth/calendar.readonly").split(",")

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

    # maintain chat history in session
    session.setdefault("chat_history", [])
    session["chat_history"].extend(history)

    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY
        }

        system_prompt = (
            "You are Flowboard AI, a concise productivity/chat assistant. "
            "Always reply in short, clear sentences or bullet points. "
            "Avoid long essays. Keep responses under 5 sentences unless explicitly asked. "
            "If listing, use simple dashes (- item) instead of Markdown stars."
        )

        # Build full message sequence
        contents = [{"role": "user", "parts": [{"text": system_prompt}]}]
        for msg in session["chat_history"]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["text"]}]})

        payload = {"contents": contents}

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        reply = (
            data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "No reply")
        )

        session["chat_history"].append({"role": "model", "text": reply})
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"reply": f"Error: {str(e)}"}), 500


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

        events = []
        for ev in data[:10]:
            repo = ev.get("repo", {}).get("name")
            etype = ev.get("type")
            time = ev.get("created_at")

            if etype == "PushEvent":
                action = f"Pushed {len(ev['payload'].get('commits', []))} commits"
            elif etype == "IssuesEvent":
                action = f"Issue {ev['payload'].get('action')} #{ev['payload'].get('issue', {}).get('number')}"
            elif etype == "PullRequestEvent":
                action = f"PR {ev['payload'].get('action')} #{ev['payload'].get('number')}"
            else:
                action = etype

            events.append({"repo": repo, "action": action, "time": time})

        return jsonify({"events": events})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# --- Google Calendar OAuth + API
# =====================================================
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # allow HTTP in dev

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

    app.run(host=host, port=port, debug=debug)
