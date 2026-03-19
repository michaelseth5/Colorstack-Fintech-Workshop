import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:5000';

// ── STEP 4: Dashboard UI ─────────────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState(null);
  const [ticker,  setTicker]  = useState('AAPL');
  const [stock,   setStock]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Check if user is already logged in on page load
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setUser(data))
      .catch(() => {});
  }, []);

  const fetchStock = async (t = ticker) => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/api/stock/${t}`, { credentials: 'include' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStock(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Not logged in ──
  if (!user) {
    return (
      <div style={styles.center}>
        <h1 style={styles.title}>ColorStack Finance Dashboard</h1>
        <p style={styles.sub}>Sign in with Google to get started</p>
        <a href={`${API}/auth/login`} style={styles.btn}>Sign in with Google</a>
      </div>
    );
  }

  // ── Logged in ──
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Finance Dashboard</h1>
        <div style={styles.userRow}>
          <img src={user.picture} alt="avatar" style={styles.avatar} />
          <span style={styles.name}>{user.name}</span>
          <a href={`${API}/auth/logout`} style={styles.logoutBtn}>Log out</a>
        </div>
      </header>

      {/* Search */}
      <div style={styles.searchRow}>
        <input
          style={styles.input}
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && fetchStock()}
          placeholder="Ticker symbol (e.g. AAPL)"
        />
        <button style={styles.btn} onClick={() => fetchStock()} disabled={loading}>
          {loading ? 'Loading...' : 'Get Stock'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Stock card */}
      {stock && (
        <div style={styles.card}>
          <div style={styles.stockHeader}>
            <div>
              <h2 style={styles.stockName}>{stock.name}</h2>
              <span style={styles.tickerLabel}>{stock.ticker}</span>
            </div>
            <div style={styles.priceBlock}>
              <span style={styles.price}>${stock.price.toLocaleString()}</span>
              <span style={{ color: stock.change >= 0 ? '#16a34a' : '#dc2626', fontSize: 14 }}>
                {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change)}%
              </span>
            </div>
          </div>

          {/* 30-day price chart */}
          {stock.history.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stock.history}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`$${v}`, 'Close']} />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page:        { maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', gap: 12 },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:       { fontSize: 22, fontWeight: 600, margin: 0 },
  sub:         { color: '#6b7280', marginBottom: 8 },
  userRow:     { display: 'flex', alignItems: 'center', gap: 8 },
  avatar:      { width: 32, height: 32, borderRadius: '50%' },
  name:        { fontSize: 14, color: '#374151' },
  searchRow:   { display: 'flex', gap: 8, marginBottom: '1rem' },
  input:       { flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 },
  btn:         { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', textDecoration: 'none' },
  logoutBtn:   { padding: '4px 10px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#6b7280', textDecoration: 'none' },
  card:        { border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', background: '#fff' },
  stockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  stockName:   { fontSize: 18, fontWeight: 600, margin: 0 },
  tickerLabel: { fontSize: 13, color: '#6b7280' },
  priceBlock:  { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 },
  price:       { fontSize: 22, fontWeight: 700 },
  error:       { color: '#dc2626', fontSize: 14, marginBottom: 8 },
};
