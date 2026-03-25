import { formatMarketCap, formatPrice, formatVolume } from "../utils/formatters";

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  padding: "0 10px 10px 10px",
  width: "100%",
  boxSizing: "border-box",
};

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "6px 10px",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          fontSize: "9px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#9ca3af",
          margin: "0 0 2px 0",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "13px",
          fontWeight: "700",
          color: "#111827",
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Compact 3×2 grid of quote fundamentals for the portfolio card.
 */
export default function StockStats({
  marketCap,
  volume,
  week52High,
  week52Low,
  peRatio,
  dividendYield,
}) {
  const capStr =
    marketCap != null && marketCap !== ""
      ? formatMarketCap(marketCap)
      : "—";
  const volStr =
    volume != null && volume !== "" ? formatVolume(volume) : "—";
  const highStr =
    week52High != null && week52High !== ""
      ? formatPrice(week52High)
      : "—";
  const lowStr =
    week52Low != null && week52Low !== "" ? formatPrice(week52Low) : "—";
  const peStr =
    peRatio != null && peRatio !== ""
      ? Number(peRatio).toFixed(2)
      : "—";
  const divStr =
    dividendYield != null && dividendYield !== ""
      ? `${dividendYield}%`
      : "—";

  return (
    <div style={gridStyle} className="stats-grid">
      <StatCard label="Market Cap" value={capStr} />
      <StatCard label="Volume" value={volStr} />
      <StatCard label="52W High" value={highStr} />
      <StatCard label="52W Low" value={lowStr} />
      <StatCard label="P/E Ratio" value={peStr} />
      <StatCard label="Div Yield" value={divStr} />
    </div>
  );
}
