import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css";

const API = "http://localhost:5000"; // base URL for our Flask backend

export default function App() {

  // useState stores data that React watches — when it changes, UI re-renders
  const [user, setUser]           = useState(null);               // logged-in user (null = not logged in)
  const [ticker, setTicker]       = useState("AAPL");             // active stock ticker
  const [input, setInput]         = useState("");                  // search box value
  const [stock, setStock]         = useState(null);               // stock data from API
  const [loading, setLoading]     = useState(false);              // true while fetching
  const [error, setError]         = useState("");                  // error message
  const [watchlist, setWatchlist] = useState(["AAPL", "TSLA", "MSFT"]); // sidebar tickers

  // Check if user is logged in when the app first loads
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" }) // credentials sends session cookie
      .then((r) => r.json())
      .then((d) => { if (!d.error) setUser(d); })
      .catch(() => {});
  }, []); // [] = run once on mount

  // Fetch stock data whenever the ticker changes
  useEffect(() => {
    fetchStock(ticker);
  }, [ticker]); // re-runs every time ticker changes

  const fetchStock = async (t) => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API}/api/stock/${t}`, { credentials: "include" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStock(data); // triggers re-render with new stock data
    } catch (e) {
      setError("Could not load stock data. Try another ticker.");
      setStock(null);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault(); // prevents page refresh on form submit
    if (!input.trim()) return;
    const t = input.trim().toUpperCase();
    setTicker(t);
    if (!watchlist.includes(t)) setWatchlist([...watchlist, t]); // add to watchlist if new
    setInput("");
  };

  // Format raw market cap number → readable string (e.g. 3200000000000 → "$3.20T")
  const formatCap = (n) => {
    if (!n) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
    return `$${(n / 1e6).toFixed(2)}M`;
  };

  // Show login screen if no user in session
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-badge">ColorStack UTD</div>
          <h1 className="login-title">Wall St.<br />Decoded</h1>
          <p className="login-sub">Live stock data. Real OAuth. Built by you.</p>

          {/* Links to /auth/login → Flask redirects user to Google */}
          <a href={`${API}/auth/login`} className="login-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </a>
          <p className="login-note">API 101 Workshop · March 26, 2025 · SLC 2.304</p>
        </div>
        {/* Animated background tickers — purely decorative */}
        <div className="login-bg">
          {["AAPL", "TSLA", "MSFT", "NVDA", "AMZN", "META", "GOOG", "JPM"].map((t, i) => (
            <span key={t} className="bg-ticker" style={{ "--i": i }}>{t}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">FinDash</span>
          </div>

          {/* Show Google profile photo + name from session */}
          <div className="user-pill">
            <img src={user.picture} alt={user.name} className="avatar" />
            <div className="user-info">
              <span className="user-name">{user.name.split(" ")[0]}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Clicking a watchlist item sets the ticker → triggers data fetch */}
        <div className="watchlist">
          <p className="watchlist-label">Watchlist</p>
          {watchlist.map((t) => (
            <button
              key={t}
              className={`watchlist-item ${ticker === t ? "active" : ""}`} // highlight active ticker
              onClick={() => setTicker(t)}
            >
              <span className="wl-ticker">{t}</span>
              <span className="wl-dot" />
            </button>
          ))}
        </div>

        {/* Logout: clears Flask session, sets user to null → shows login screen */}
        <button
          className="logout-btn"
          onClick={() => fetch(`${API}/auth/logout`, { credentials: "include" }).then(() => setUser(null))}
        >
          Sign out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        <header className="topbar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              className="search-input"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="Search ticker... AAPL, TSLA"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
        </header>

        {loading && <div className="state-msg">Loading {ticker}...</div>}
        {error   && <div className="state-msg error">{error}</div>}

        {stock && !loading && (
          <>
            {/* STOCK HERO — price, name, change */}
            <section className="hero">
              <div className="hero-left">
                <p className="hero-ticker">{stock.ticker}</p>
                <h2 className="hero-name">{stock.name}</h2>
                <div className="hero-price">${stock.price.toLocaleString()}</div>
                {/* Dynamically apply "up" or "down" class based on % change */}
                <div className={`hero-change ${stock.change >= 0 ? "up" : "down"}`}>
                  {stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.change)}%
                  <span className="hero-change-label"> 30-day change</span>
                </div>
              </div>

              <div className="hero-stats">
                <div className="stat-card">
                  <span className="stat-label">Market Cap</span>
                  <span className="stat-value">{formatCap(stock.market_cap)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Data Points</span>
                  <span className="stat-value">{stock.history.length} days</span>
                </div>
                {/* Math.max(...array.map()) finds the highest closing price */}
                <div className="stat-card">
                  <span className="stat-label">Period High</span>
                  <span className="stat-value">
                    ${Math.max(...stock.history.map((h) => h.close)).toFixed(2)}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Period Low</span>
                  <span className="stat-value">
                    ${Math.min(...stock.history.map((h) => h.close)).toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            {/* AREA CHART — 30 days of closing prices */}
            <section className="chart-section">
              <p className="chart-title">30-Day Price History</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stock.history}>
                  <defs>
                    {/* Gradient fill under the line — green fades to transparent */}
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6ee7b7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#6ee7b7" }}
                    formatter={(v) => [`$${v}`, "Close"]}
                  />
                  <Area type="monotone" dataKey="close" stroke="#6ee7b7" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            {/* PRICE TABLE — most recent dates first */}
            <section className="table-section">
              <p className="chart-title">Price History</p>
              <div className="table-wrap">
                <table className="price-table">
                  <thead>
                    <tr><th>Date</th><th>Close Price</th><th>Change</th></tr>
                  </thead>
                  <tbody>
                    {[...stock.history].reverse().map((row, i, arr) => {
                      const prev = arr[i + 1];
                      const diff = prev ? row.close - prev.close : 0; // daily change vs previous row
                      return (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>${row.close}</td>
                          <td className={diff >= 0 ? "up" : "down"}>
                            {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
