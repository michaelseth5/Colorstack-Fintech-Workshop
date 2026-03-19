import os
import requests
import yfinance as yf
from flask import Flask, redirect, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI")


# ── STEP 2: Google OAuth ──────────────────────────────────────────────────────

@app.route("/auth/login")
def login():
    """Redirect the user to Google's OAuth consent screen."""
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
    """Exchange the auth code for tokens, fetch user info, save to session."""
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No code returned from Google"}), 400

    # Exchange code for tokens
    token_res = requests.post("https://oauth2.googleapis.com/token", data={
        "code":          code,
        "client_id":     GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "grant_type":    "authorization_code",
    })
    tokens = token_res.json()
    access_token = tokens.get("access_token")

    # Fetch user profile from Google
    user_res = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    user = user_res.json()
    session["user"] = {
        "name":    user.get("name"),
        "email":   user.get("email"),
        "picture": user.get("picture"),
    }

    return redirect("http://localhost:3000")


@app.route("/auth/me")
def me():
    """Return the logged-in user from session, or 401."""
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user)


@app.route("/auth/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


# ── STEP 3: Yahoo Finance via yfinance ───────────────────────────────────────

@app.route("/api/stock/<ticker>")
def get_stock(ticker):
    """Return current price and 30-day history for a ticker symbol."""
    try:
        stock = yf.Ticker(ticker.upper())
        info  = stock.info
        hist  = stock.history(period="1mo")

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
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
