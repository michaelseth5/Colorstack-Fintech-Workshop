// App.jsx orchestrates authentication, stock fetching, and dashboard state.
// It renders either the login screen or the full trading dashboard UI.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

// Import each section as its own component
import LoginScreen    from "./components/LoginScreen";
import Sidebar        from "./components/Sidebar";
import LeftPanel      from "./components/LeftPanel";
import TopBar         from "./components/TopBar";
import PriceChart     from "./components/PriceChart";
import PortfolioPanel from "./components/PortfolioPanel";

// ── CONSTANTS ─────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:5000";

const NAV_ITEMS = [
  { icon: "▦", label: "Terminal" },
  { icon: "⟁", label: "Analytics" },
  { icon: "◎", label: "Strategy" },
  { icon: "☰", label: "Archive" },
  { icon: "?", label: "Support" },
];

const TIME_RANGES = ["1W", "1M", "3M", "6M", "1Y"];


// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState("TSLA");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockData, setStockData] = useState(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState("");
  const [selectedRange, setSelectedRange] = useState("3M");
  const [watchlistTickers, setWatchlistTickers] = useState(["TSLA", "AAPL", "MSFT", "NVDA"]);
  const [newsHeadlines, setNewsHeadlines] = useState([]);
  const [activeNavigation, setActiveNavigation] = useState("Terminal");
  const [isWatchlistInputVisible, setIsWatchlistInputVisible] = useState(false);
  const [watchlistInputValue, setWatchlistInputValue] = useState("");

  /**
   * Reads the authenticated user from Flask session.
   * Returns nothing; updates component state.
   */
  const fetchCurrentUser = useCallback(() => {
    fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" })
      // Parse JSON for both success and auth-failure payloads.
      .then((response) => response.json())
      // Store user only when backend confirms no error.
      .then((payload) => {
        if (!payload.error) setCurrentUser(payload);
      })
      // Keep login screen visible when session is missing.
      .catch(() => {});
  }, []);

  /**
   * Fetches stock details for a ticker and updates dashboard state.
   * Returns nothing; it sets loading, stock, and error states.
   */
  const fetchStockData = useCallback((tickerSymbol) => {
    setIsLoadingStock(true);
    setStockError("");

    fetch(`${API_BASE_URL}/api/stock/${tickerSymbol}`, { credentials: "include" })
      // Stop flow early when HTTP status is not successful.
      .then((response) => {
        if (!response.ok) throw new Error("Bad response from server");
        return response.json();
      })
      // Guard against API-level errors while accepting warning payloads.
      .then((payload) => {
        if (payload.error) throw new Error(payload.error);
        setStockData(payload);
        if (payload.warning) setStockError(payload.warning);
      })
      // Show a user-facing message and clear stale stock on failure.
      .catch(() => {
        setStockError("Could not load stock data. Try another ticker.");
        setStockData(null);
      })
      // Always clear loading state no matter how request resolves.
      .finally(() => {
        setIsLoadingStock(false);
      });
  }, []);

  /**
   * Handles ticker search form submission.
   * Returns nothing; updates selected ticker and watchlist state.
   */
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalizedTicker = searchQuery.trim().toUpperCase();
    if (!normalizedTicker) return;

    setSelectedTicker(normalizedTicker);
    setWatchlistTickers((currentTickers) =>
      currentTickers.includes(normalizedTicker)
        ? currentTickers
        : [...currentTickers, normalizedTicker]
    );
    setSearchQuery("");
  };

  /**
   * Formats a market-cap number into a compact dollar string.
   * Returns formatted string like "$3.20T", "$450.00B", or "N/A".
   */
  const formatMarketCap = (marketCapValue) => {
    if (!marketCapValue) return "N/A";
    if (marketCapValue >= 1e12) return `$${(marketCapValue / 1e12).toFixed(2)}T`;
    if (marketCapValue >= 1e9) return `$${(marketCapValue / 1e9).toFixed(2)}B`;
    return `$${(marketCapValue / 1e6).toFixed(2)}M`;
  };

  /**
   * Builds headline cards from the latest stock object.
   * Returns an array of headline/source objects.
   */
  const buildNewsFromStock = (latestStockData) => {
    if (!latestStockData) return [];
    const generatedHeadlines = [
      `${latestStockData.name} Stock Surges Amid Strong Quarterly Earnings`,
      `Analysts Raise Price Target for ${latestStockData.ticker} Following Product Launch`,
      `${latestStockData.name}: What Investors Need to Know This Week`,
      `${latestStockData.ticker} Faces Headwinds as Market Volatility Increases`,
      `Institutional Investors Increase Stakes in ${latestStockData.name}`,
      `${latestStockData.ticker} Options Activity Signals Bullish Sentiment`,
    ];
    return generatedHeadlines.map((headline) => ({ title: headline, source: "Yahoo" }));
  };

  /**
   * Slices historical price points for the active time range.
   * Returns a filtered history array.
   */
  const getChartDataForRange = useCallback(() => {
    if (!stockData) return [];
    const rangeToDaysMap = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
    return stockData.history.slice(-(rangeToDaysMap[selectedRange] || 90));
  }, [selectedRange, stockData]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchStockData(selectedTicker);
  }, [fetchStockData, selectedTicker]);

  useEffect(() => {
    setNewsHeadlines(buildNewsFromStock(stockData));
  }, [stockData]);

  const chartData = useMemo(() => getChartDataForRange(), [getChartDataForRange]);
  const isPriceUp = !!stockData && stockData.change >= 0;


  // ── RENDER ────────────────────────────────────────────────

  // Show login screen if nobody is logged in
  if (!currentUser) return <LoginScreen API={API_BASE_URL} />;

  // Otherwise show the full dashboard
  return (
    <div className="app">

      {/* Far left icon rail */}
      <Sidebar
        NAV_ITEMS={NAV_ITEMS}
        activeNav={activeNavigation}
        setActiveNav={setActiveNavigation}
        API={API_BASE_URL}
        setUser={setCurrentUser}
      />

      {/* Left panel — search + watchlist */}
      <LeftPanel
        user={currentUser}
        ticker={selectedTicker}
        setTicker={setSelectedTicker}
        input={searchQuery}
        setInput={setSearchQuery}
        watchlist={watchlistTickers}
        setWatchlist={setWatchlistTickers}
        showWlInput={isWatchlistInputVisible}
        setShowWlInput={setIsWatchlistInputVisible}
        wlInput={watchlistInputValue}
        setWlInput={setWatchlistInputValue}
        handleSearch={handleSearchSubmit}
      />

      {/* Main content */}
      <main className="main">

        {/* Header bar */}
        <TopBar stock={stockData} user={currentUser} isUp={isPriceUp} />

        {/* Loading + error messages */}
        {isLoadingStock && <div className="state-msg">Loading {selectedTicker}...</div>}
        {stockError && <div className="state-msg error">{stockError}</div>}

        {/* Dashboard grid — only shows when data is ready */}
        {stockData && !isLoadingStock && (
          <div className="dashboard-grid">

            {/* News feed */}
            <section className="news-section">
              {newsHeadlines.map((item, i) => (
                <div className="news-item" key={i}>
                  <span className="news-title">{item.title}</span>
                  <span className="news-source">{item.source}</span>
                </div>
              ))}
            </section>

            {/* Price chart */}
            <PriceChart
              chartData={chartData}
              range={selectedRange}
              setRange={setSelectedRange}
              ticker={selectedTicker}
              TIME_RANGES={TIME_RANGES}
            />

            {/* Watchlist panel — rendered inside LeftPanel, shown here in grid */}
            <section className="wl-panel">
              <div className="wl-header">
                <span className="wl-label">WATCHLIST</span>
              </div>
              {watchlistTickers.map((tickerSymbol) => (
                <div key={tickerSymbol} className={`wl-row ${selectedTicker === tickerSymbol ? "active" : ""}`}>
                  <button className="wl-row-main" onClick={() => setSelectedTicker(tickerSymbol)}>
                    <span className="wl-row-ticker">{tickerSymbol}</span>
                    <span className="wl-row-arrow">→</span>
                  </button>
                  {watchlistTickers.length > 1 && (
                    <button
                      className="wl-remove"
                      onClick={() => {
                        const updatedTickers = watchlistTickers.filter((existingTicker) => existingTicker !== tickerSymbol);
                        setWatchlistTickers(updatedTickers);
                        if (selectedTicker === tickerSymbol && updatedTickers[0]) setSelectedTicker(updatedTickers[0]);
                      }}
                    >✕</button>
                  )}
                </div>
              ))}
            </section>

            {/* Portfolio + stats */}
            <PortfolioPanel stock={stockData} formatCap={formatMarketCap} />

          </div>
        )}
      </main>
    </div>
  );
}
