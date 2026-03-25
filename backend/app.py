"""
Flask API for the workshop stock dashboard.

Stock data: yfinance (Yahoo) only. Google OAuth is not enabled in this file.
"""

import os
from datetime import datetime, timezone
from typing import Any

import yfinance as yf
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-workshop")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
HISTORY_START_DATE = os.getenv("HISTORY_START_DATE", "2016-01-01")

CORS(
    app,
    supports_credentials=False,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        FRONTEND_URL,
        r"http://localhost:\d+",
        r"http://127\.0\.0\.1:\d+",
    ],
)


def _safe_float(value: Any, default: float = 0.0) -> float:
    """Coerce a value to float, or return default when missing or invalid."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _yf_ticker(ticker_symbol: str):
    """Return a yfinance Ticker for the given uppercase symbol."""
    return yf.Ticker(ticker_symbol.upper())


def _quote_time_iso_from_info(info: dict) -> str | None:
    """Convert Yahoo regularMarketTime to ISO UTC string, or None."""
    raw = info.get("regularMarketTime")
    if raw is None:
        return None
    try:
        if isinstance(raw, (int, float)):
            ts = float(raw)
            if ts > 1e12:
                ts /= 1000.0
            return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        if isinstance(raw, datetime):
            return raw.astimezone(timezone.utc).isoformat()
    except (OSError, OverflowError, ValueError):
        return None
    return None


def json_error_response(message: str, ticker: str, status: int = 503):
    """Uniform JSON error body for failed stock routes."""
    return jsonify({"error": message, "ticker": ticker}), status


def build_quote_dict(ticker_symbol: str, stock: Any = None) -> dict[str, Any]:
    """Build live quote fields from yfinance info / fast_info (raises ValueError if no price)."""
    if stock is None:
        stock = _yf_ticker(ticker_symbol)
    info: dict = stock.info or {}
    fast: dict = getattr(stock, "fast_info", {}) or {}

    name = (
        info.get("longName")
        or info.get("shortName")
        or fast.get("name")
        or ticker_symbol
    )
    price = (
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or fast.get("last_price")
    )
    if price is None or _safe_float(price) <= 0:
        raise ValueError(
            "Live quote unavailable for this symbol (no price from Yahoo). "
            "Check the ticker or retry in a few seconds."
        )
    change_pct = info.get("regularMarketChangePercent")
    if change_pct is None:
        change_pct = fast.get("regular_market_change_percent")

    market_cap = info.get("marketCap") or fast.get("market_cap")
    volume = info.get("volume") or info.get("regularMarketVolume") or fast.get("last_volume")

    day_high = info.get("dayHigh") or info.get("regularMarketDayHigh")
    day_low = info.get("dayLow") or info.get("regularMarketDayLow")
    week_52_high = info.get("fiftyTwoWeekHigh")
    week_52_low = info.get("fiftyTwoWeekLow")
    pe_ratio = info.get("trailingPE")

    raw_div = info.get("dividendYield")
    dividend_yield = None
    if raw_div is not None:
        x = float(raw_div)
        if x <= 0.2:
            dividend_yield = round(x * 100, 2)
        elif x <= 1.0:
            dividend_yield = round(x, 2)
        else:
            dividend_yield = round(x, 2)

    quote_time_iso = _quote_time_iso_from_info(info)
    market_state = info.get("marketState") or info.get("market_state")
    tz_name = info.get("exchangeTimezoneName") or info.get("timeZoneFullName")

    return {
        "symbol": ticker_symbol.upper(),
        "name": name,
        "price": round(_safe_float(price), 2),
        "change": round(_safe_float(change_pct), 2),
        "volume": volume,
        "marketCap": market_cap,
        "high": round(_safe_float(day_high), 2) if day_high is not None else None,
        "low": round(_safe_float(day_low), 2) if day_low is not None else None,
        "week_52_high": round(_safe_float(week_52_high), 2) if week_52_high is not None else None,
        "week_52_low": round(_safe_float(week_52_low), 2) if week_52_low is not None else None,
        "pe_ratio": round(_safe_float(pe_ratio), 2) if pe_ratio is not None else None,
        "dividend_yield": dividend_yield,
        "quote_time_iso": quote_time_iso,
        "market_state": market_state,
        "exchange_timezone": tz_name,
    }


def build_history_list(ticker_symbol: str, stock: Any = None) -> list[dict[str, Any]]:
    """Fetch daily bars from HISTORY_START_DATE; return sorted {date, close, volume} rows."""
    if stock is None:
        stock = _yf_ticker(ticker_symbol)
    hist = stock.history(start=HISTORY_START_DATE)
    if hist is None or hist.empty:
        raise ValueError("No historical bars returned from Yahoo for this symbol.")

    rows: list[dict[str, Any]] = []
    for date_index, row in hist.iterrows():
        date_str = date_index.strftime("%Y-%m-%d") if hasattr(date_index, "strftime") else str(date_index)[:10]
        close_val = row.get("Close")
        vol_val = row.get("Volume")
        rows.append(
            {
                "date": date_str,
                "close": round(_safe_float(close_val), 2),
                "volume": int(_safe_float(vol_val, 0)),
            }
        )

    rows.sort(key=lambda r: r["date"])
    today_str = datetime.now(timezone.utc).date().isoformat()
    rows = [r for r in rows if r["date"] <= today_str]
    return rows


# --- Health (liveness / readiness style probes) ---


@app.route("/")
def serve_root_status():
    """Return JSON confirming the API process is running and the configured frontend URL."""
    return jsonify(
        {
            "status": "ok",
            "message": "ColorStack Finance backend is running (yfinance workshop mode)",
            "frontend_url": FRONTEND_URL,
        }
    )


@app.route("/api/healthz")
def serve_health_status_json():
    """Return JSON with data source label for monitoring (no secrets)."""
    return jsonify({"status": "ok", "data_source": "yfinance", "mode": "live_only"})


@app.route("/api/health")
def serve_health_ping():
    """Minimal liveness probe: 200 when Flask is up."""
    return jsonify({"status": "ok"})


# --- Stock (yfinance) ---


def build_news_list(ticker_symbol: str, stock: Any = None) -> list[dict[str, Any]]:
    """Normalize yfinance Ticker.news into {title, source, date, link} rows."""
    if stock is None:
        stock = _yf_ticker(ticker_symbol)
    raw = getattr(stock, "news", None)
    if not raw:
        return []
    out: list[dict[str, Any]] = []
    for item in raw[:12]:
        if not isinstance(item, dict):
            continue
        title = (item.get("title") or "").strip()
        if not title:
            continue
        publisher = (item.get("publisher") or "Yahoo Finance").strip()
        link = item.get("link") or ""
        ts = item.get("providerPublishTime")
        date_str = ""
        if ts is not None:
            try:
                tsv = float(ts)
                if tsv > 1e12:
                    tsv /= 1000.0
                date_str = datetime.fromtimestamp(tsv, tz=timezone.utc).strftime(
                    "%b %d, %Y · %H:%M UTC"
                )
            except (OSError, OverflowError, ValueError, TypeError):
                date_str = ""
        out.append(
            {
                "title": title,
                "source": publisher,
                "date": date_str,
                "link": link,
            }
        )
    return out


@app.route("/api/stock/<ticker>/news")
def serve_stock_news_json(ticker):
    """Return recent Yahoo Finance news headlines for the symbol (via yfinance)."""
    ticker_symbol = ticker.upper()
    try:
        stock = _yf_ticker(ticker_symbol)
        articles = build_news_list(ticker_symbol, stock=stock)
        return jsonify(
            {
                "ticker": ticker_symbol,
                "articles": articles,
                "data_source": "yfinance",
            }
        )
    except Exception as exc:
        return json_error_response(str(exc), ticker_symbol, 503)


@app.route("/api/stock/<ticker>/history")
def serve_stock_history_json(ticker):
    """Return daily history only: ticker, history, history_start, data_source."""
    ticker_symbol = ticker.upper()
    try:
        stock = _yf_ticker(ticker_symbol)
        history_points = build_history_list(ticker_symbol, stock=stock)
        return jsonify(
            {
                "ticker": ticker_symbol,
                "history": history_points,
                "history_start": HISTORY_START_DATE,
                "data_source": "yfinance",
            }
        )
    except ValueError as exc:
        return json_error_response(str(exc), ticker_symbol, 503)
    except Exception as exc:
        return json_error_response(str(exc), ticker_symbol, 503)


@app.route("/api/stock/<ticker>")
def serve_stock_quote_and_history_json(ticker):
    """Return live quote fields plus embedded daily history and metadata."""
    ticker_symbol = ticker.upper()
    try:
        stock = _yf_ticker(ticker_symbol)
        payload = build_quote_dict(ticker_symbol, stock=stock)
        payload["history"] = build_history_list(ticker_symbol, stock=stock)
        payload["history_start"] = HISTORY_START_DATE
        payload["data_source"] = "yfinance"
        return jsonify(payload)
    except ValueError as exc:
        return json_error_response(str(exc), ticker_symbol, 503)
    except Exception as exc:
        return json_error_response(str(exc), ticker_symbol, 503)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
