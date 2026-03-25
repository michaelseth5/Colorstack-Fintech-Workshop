"""Flask API for auth + stock data used by the React dashboard."""

import os
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, session
from flask_cors import CORS

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "yahoo-finance15.p.rapidapi.com")

CORS(
    app,
    supports_credentials=True,
    origins=[r"http://localhost:\d+", r"http://127.0.0.1:\d+", FRONTEND_URL],
)


def rapidapi_headers():
    """Builds RapidAPI headers from environment config and returns a dict."""
    return {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    }


def frontend_redirect_target():
    """Resolves frontend origin from request headers/referrer and returns URL string."""
    request_origin = request.headers.get("Origin")
    if request_origin and ("localhost" in request_origin or "127.0.0.1" in request_origin):
        return request_origin

    request_referrer = request.referrer
    if request_referrer:
        parsed_referrer = urlparse(request_referrer)
        if parsed_referrer.scheme and parsed_referrer.netloc:
            return f"{parsed_referrer.scheme}://{parsed_referrer.netloc}"

    return FRONTEND_URL


def demo_stock_payload(ticker_symbol: str):
    """Returns stable fallback stock payload when upstream data is unavailable."""
    return {
        "ticker": ticker_symbol,
        "name": f"{ticker_symbol} (Demo Data)",
        "price": 213.55,
        "change": 1.24,
        "market_cap": 3200000000000,
        "volume": 65432100,
        "week_52_high": 245.12,
        "week_52_low": 164.08,
        "pe_ratio": 31.7,
        "dividend_yield": 0.55,
        "history": [
            {"date": "2026-02-24", "close": 199.2, "volume": 62000000},
            {"date": "2026-02-25", "close": 200.3, "volume": 61500000},
            {"date": "2026-02-26", "close": 202.1, "volume": 60100000},
            {"date": "2026-02-27", "close": 201.6, "volume": 59200000},
            {"date": "2026-02-28", "close": 203.4, "volume": 60500000},
            {"date": "2026-03-01", "close": 204.0, "volume": 61100000},
            {"date": "2026-03-02", "close": 205.3, "volume": 62200000},
            {"date": "2026-03-03", "close": 206.8, "volume": 63400000},
            {"date": "2026-03-04", "close": 205.9, "volume": 62800000},
            {"date": "2026-03-05", "close": 207.1, "volume": 64000000},
            {"date": "2026-03-06", "close": 208.0, "volume": 64500000},
            {"date": "2026-03-07", "close": 207.4, "volume": 63900000},
            {"date": "2026-03-08", "close": 208.7, "volume": 64800000},
            {"date": "2026-03-09", "close": 209.9, "volume": 65200000},
            {"date": "2026-03-10", "close": 210.5, "volume": 65800000},
            {"date": "2026-03-11", "close": 211.2, "volume": 66100000},
            {"date": "2026-03-12", "close": 210.8, "volume": 65500000},
            {"date": "2026-03-13", "close": 212.0, "volume": 66400000},
            {"date": "2026-03-14", "close": 212.7, "volume": 66800000},
            {"date": "2026-03-15", "close": 213.55, "volume": 65432100},
        ],
    }


def fetch_quote_payload(ticker_symbol: str):
    """Fetches quote payload from RapidAPI and returns parsed JSON dict."""
    quote_response = requests.get(
        "https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote",
        headers=rapidapi_headers(),
        params={"ticker": ticker_symbol, "type": "STOCKS"},
        timeout=20,
    )
    return quote_response.json() if quote_response.content else {}


def fetch_history_payload(ticker_symbol: str):
    """Fetches historical payload from RapidAPI and returns parsed JSON dict."""
    history_response = requests.get(
        "https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/history",
        headers=rapidapi_headers(),
        params={"symbol": ticker_symbol, "interval": "1d", "diffandsplits": "false"},
        timeout=20,
    )
    return history_response.json() if history_response.content else {}


def parse_history_points(history_payload):
    """Converts raw history map into sorted list of date/close/volume dicts."""
    raw_history_map = history_payload.get("body", None) if isinstance(history_payload, dict) else None
    if not isinstance(raw_history_map, dict):
        return []

    normalized_points = [
        {
            "date": history_entry.get("date", ""),
            "close": round(float(history_entry.get("close", 0)), 2),
            "volume": int(history_entry.get("volume", 0)),
        }
        for history_entry in raw_history_map.values()
        if history_entry.get("close")
    ]
    return sorted(normalized_points, key=lambda point: point["date"])[-30:]


def build_live_stock_payload(ticker_symbol: str, quote_payload, history_points):
    """Builds final stock response from quote + history inputs and returns dict."""
    quote_body = quote_payload.get("body", {}) if isinstance(quote_payload, dict) else {}
    raw_dividend_yield = quote_body.get("dividendYield")
    dividend_yield_percent = round(float(raw_dividend_yield) * 100, 2) if raw_dividend_yield else None

    return {
        "ticker": ticker_symbol,
        "name": quote_body.get("longName", ticker_symbol),
        "price": round(float(quote_body.get("regularMarketPrice", 0)), 2),
        "change": round(float(quote_body.get("regularMarketChangePercent", 0)), 2),
        "market_cap": quote_body.get("marketCap"),
        "volume": quote_body.get("regularMarketVolume"),
        "week_52_high": quote_body.get("fiftyTwoWeekHigh"),
        "week_52_low": quote_body.get("fiftyTwoWeekLow"),
        "pe_ratio": quote_body.get("trailingPE"),
        "dividend_yield": dividend_yield_percent,
        "history": history_points,
    }


def demo_response_with_warning(ticker_symbol: str, warning_message: str):
    """Builds demo fallback payload including warning text and provider metadata."""
    return jsonify(
        demo_stock_payload(ticker_symbol)
        | {"warning": warning_message, "provider": "demo"}
    )


@app.route("/")
def index():
    """Returns basic backend heartbeat metadata as JSON."""
    return jsonify(
        {
            "status": "ok",
            "message": "ColorStack Finance backend is running",
            "frontend_url": FRONTEND_URL,
        }
    )


@app.route("/api/healthz")
def healthz():
    """Returns non-secret health check details for debugging setup issues."""
    return jsonify({"status": "ok", "rapidapi_key_present": bool(RAPIDAPI_KEY)})


@app.route("/auth/workshop-login")
def workshop_login():
    """Creates demo user session and redirects to frontend for workshop mode."""
    workshop_mode_enabled = True
    if not workshop_mode_enabled:
        return jsonify({"error": "Workshop mode is disabled"}), 403

    session["user"] = {
        "name": "Workshop User",
        "email": "workshop@colorstack.org",
        "picture": "https://ui-avatars.com/api/?name=Workshop+User&background=2563eb&color=fff",
    }
    return redirect(frontend_redirect_target())


@app.route("/auth/login")
def login():
    """Redirects browser to Google OAuth authorization endpoint."""
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
    """Exchanges OAuth code for user info, stores session, and redirects frontend."""
    authorization_code = request.args.get("code")
    if not authorization_code:
        return jsonify({"error": "No code returned from Google"}), 400

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": authorization_code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=20,
    )
    google_access_token = token_response.json().get("access_token")
    profile_response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {google_access_token}"},
        timeout=20,
    )
    profile_data = profile_response.json()

    session["user"] = {
        "name": profile_data.get("name"),
        "email": profile_data.get("email"),
        "picture": profile_data.get("picture"),
    }
    return redirect(frontend_redirect_target())


@app.route("/auth/me")
def me():
    """Returns current session user object or 401 when not authenticated."""
    authenticated_user = session.get("user")
    if not authenticated_user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(authenticated_user)


@app.route("/auth/logout")
def logout():
    """Clears session user and returns logout confirmation JSON."""
    session.clear()
    return jsonify({"message": "Logged out"})


@app.route("/api/stock/<ticker>")
def get_stock(ticker):
    """Returns live stock payload when possible; otherwise returns demo fallback."""
    ticker_symbol = ticker.upper()

    if not RAPIDAPI_KEY:
        return demo_response_with_warning(ticker_symbol, "RAPIDAPI_KEY not set; using demo data.")

    try:
        quote_payload = fetch_quote_payload(ticker_symbol)
        if not isinstance(quote_payload, dict) or "body" not in quote_payload:
            warning_message = quote_payload.get("message", "Bad quote response")
            return demo_response_with_warning(ticker_symbol, warning_message)

        history_payload = fetch_history_payload(ticker_symbol)
        history_points = parse_history_points(history_payload)
        if not history_points:
            warning_message = (
                history_payload.get("message", "Bad history response")
                if isinstance(history_payload, dict)
                else "Bad history response"
            )
            return demo_response_with_warning(ticker_symbol, warning_message)

        return jsonify(build_live_stock_payload(ticker_symbol, quote_payload, history_points))
    except Exception as error:
        return demo_response_with_warning(ticker_symbol, str(error))


if __name__ == "__main__":
    """Runs local Flask development server."""
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
