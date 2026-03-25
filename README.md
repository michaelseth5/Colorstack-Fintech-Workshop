# Colorstack Fintech Workshop

This project is a full-stack stock dashboard:
- **Backend**: Flask API for auth/session and stock data aggregation
- **Frontend**: React + Vite dashboard UI

## Project Structure

```text
project/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── components/
│   ├── public/
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

## Run the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py
```

Backend runs at `http://localhost:5000`.

## Run the Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on Vite dev port (usually `http://localhost:5173`).

## Required Environment Variables

### `backend/.env`

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/callback
FLASK_SECRET_KEY=change_this_to_a_random_string
FLASK_ENV=development
RAPIDAPI_KEY=your_key_here
RAPIDAPI_HOST=yahoo-finance15.p.rapidapi.com
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000
```

## How Frontend and Backend Communicate

- React sends requests to Flask at `http://localhost:5000`
- Flask enables CORS for localhost dev ports and supports credentials
- Auth state is stored in Flask session and read by `/auth/me`
- Stock UI reads `/api/stock/<ticker>` and renders live or fallback data
