# ColorStack UTD — Finance Dashboard Workshop

Build a live stock dashboard with Google OAuth + Yahoo Finance.  
**Stack:** Python (Flask) · React · yfinance · Recharts

---

## Prerequisites

Install these before the workshop:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/)

---

## Setup (do this before 6:00 PM)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_ORG/colorstack-workshop.git
cd colorstack-workshop
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Add your environment variables

```bash
cp ../.env.example .env
```

Open `.env` and fill in your Google OAuth credentials (see `GOOGLE_OAUTH_SETUP.md`).

### 4. Start the backend

```bash
python app.py
# Running on http://localhost:5000
```

### 5. Frontend setup (new terminal tab)

```bash
cd frontend
npm install
npm start
# Running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — you should see the login screen.

---

## Workshop checkpoint branches

If you fall behind, jump to any checkpoint:

```bash
git checkout step-1-auth        # Google OAuth complete
git checkout step-2-api-call    # Yahoo Finance endpoint working
git checkout step-3-dashboard   # Full React dashboard complete
```

---

## API reference

| Endpoint | Method | Description |
|---|---|---|
| `/auth/login` | GET | Redirects to Google OAuth |
| `/auth/callback` | GET | Handles OAuth redirect |
| `/auth/me` | GET | Returns logged-in user |
| `/auth/logout` | GET | Clears session |
| `/api/stock/<ticker>` | GET | Returns price + 30-day history |

### Example stock response

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "price": 213.55,
  "change": 1.24,
  "market_cap": 3200000000000,
  "history": [
    { "date": "2025-02-17", "close": 210.11 },
    ...
  ]
}
```

---

## Stretch goals (open build time)

- Add multiple tickers to compare side by side
- Show volume or market cap metrics
- Add a watchlist saved to localStorage
- Deploy to Vercel (frontend) + Railway (backend)

---

## Questions?

Ping us in the ColorStack UTD Discord or GroupMe.
