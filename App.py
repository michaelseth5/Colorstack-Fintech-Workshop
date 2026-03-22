import os
import requests
import yfinance as yf
from flask import Flask, redirect, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # reads .env file into environment

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])  # allow React to talk to Flask

# Load Google OAuth credentials from .env — never hardcode these
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI")


# ── GOOGLE OAUTH ──────────────────────────────────────────────

@app.route("/auth/login")
def login():
    # Build Google's login URL and redirect the user there
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return redirect(google_auth_url)


@app.route("/auth/callback")
def callback():
    # Google sends back a one-time code — swap it for an access token
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No code returned from Google"}), 400

    # Exchange code → access token
    token_res = requests.post("https://oauth2.googleapis.com/token", data={
        "code":          code,
        "client_id":     GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "grant_type":    "authorization_code",
    })
    access_token = token_res.json().get("access_token")

    # Use token to fetch user's Google profile
    user = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    # Save user to session (like a login wristband stored in a cookie)
    session["user"] = {
        "name":    user.get("name"),
        "email":   user.get("email"),
        "picture": user.get("picture"),
    }
    return redirect("http://localhost:3000")


@app.route("/auth/me")
def me():
    # React calls this on startup to check if someone is logged in
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401  # 401 = not logged in
    return jsonify(user)


@app.route("/auth/logout")
def logout():
    session.clear()  # wipe the session → user is logged out
    return jsonify({"message": "Logged out"})


# ── YAHOO FINANCE ─────────────────────────────────────────────

@app.route("/api/stock/<ticker>")
def get_stock(ticker):
    # <ticker> is a URL parameter — /api/stock/AAPL → ticker = "AAPL"
    try:
        stock = yf.Ticker(ticker.upper())
        info  = stock.info
        hist  = stock.history(period="1mo")  # last 30 days of price data

        # Convert pandas DataFrame rows into plain dicts
        history = [
            {"date": str(date.date()), "close": round(row["Close"], 2)}
            for date, row in hist.iterrows()
        ]

        return jsonify({
            "ticker":     ticker.upper(),
            "name":       info.get("longName", ticker.upper()),
            "price":      round(info.get("currentPrice", 0), 2),
            "change":     round(info.get("regularMarketChangePercent", 0), 2),
            "market_cap": info.get("marketCap"),
            "history":    history,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500  # 500 = server error


if __name__ == "__main__":
    app.run(debug=True, port=5000)  # debug=True auto-restarts on save
