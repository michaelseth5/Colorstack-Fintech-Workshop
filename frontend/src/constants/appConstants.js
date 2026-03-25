/** Workshop demo user (shown when Google OAuth is off). */
export const WORKSHOP_USER = {
  name: "Workshop User",
  email: "workshop@colorstack.org",
  picture:
    "https://ui-avatars.com/api/?name=Workshop+User&background=2563eb&color=fff",
};

/** Sidebar navigation (local UI state only in workshop mode). */
export const NAVIGATION_ITEMS = [
  { icon: "▦", label: "Terminal" },
  { icon: "⟁", label: "Analytics" },
  { icon: "◎", label: "Strategy" },
  { icon: "☰", label: "Archive" },
  { icon: "?", label: "Support" },
];

/** Chart range pill keys (calendar windows; see utils/chartUtils.js). */
export const CHART_TIME_RANGES = ["1W", "1M", "3M", "6M", "1Y", "5Y", "10Y"];

/** Silent refresh interval for the active quote while the tab is open (ms). */
export const STOCK_POLL_INTERVAL_MS = 45_000;

/** Default watchlist seed symbols. */
export const DEFAULT_WATCHLIST_TICKERS = ["TSLA", "AAPL", "MSFT", "NVDA"];
