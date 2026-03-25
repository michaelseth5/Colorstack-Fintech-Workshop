import { formatMarketCap, formatPrice, formatVolume } from "../utils/formatters";

/**
 * Six stat cards: market cap, volume, 52W range, P/E, dividend yield.
 */
export default function StockStats({
  marketCap,
  volume,
  week52High,
  week52Low,
  peRatio,
  dividendYield,
}) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-label">Market Cap</span>
        <span className="stat-value">{formatMarketCap(marketCap)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Volume</span>
        <span className="stat-value">{formatVolume(volume)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">52W High</span>
        <span className="stat-value up">{formatPrice(week52High)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">52W Low</span>
        <span className="stat-value down">{formatPrice(week52Low)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">P/E Ratio</span>
        <span className="stat-value">
          {peRatio != null ? Number(peRatio).toFixed(2) : "N/A"}
        </span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Dividend Yield</span>
        <span className="stat-value">
          {dividendYield != null ? `${dividendYield}%` : "—"}
        </span>
      </div>
    </div>
  );
}
