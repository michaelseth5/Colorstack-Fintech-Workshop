import { formatMarketCap, formatPrice, formatVolume } from "../utils/formatters";

const shellStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  background: "#ffffff",
  overflow: "hidden",
  width: "100%",
  boxSizing: "border-box",
};

const headerRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  borderBottom: "1px solid #e5e7eb",
};

const titleStyle = {
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};

const buyBtnStyle = {
  background: "#10b981",
  color: "#ffffff",
  border: "none",
  borderRadius: "5px",
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
};

const sellBtnStyle = {
  background: "#ef4444",
  color: "#ffffff",
  border: "none",
  borderRadius: "5px",
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
};

const emptyStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  padding: "4px 12px 8px",
  margin: 0,
};

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
 * Portfolio card: header + Buy/Sell, empty state, 3×2 stats (Yahoo / Flask fields).
 */
export default function PortfolioPanel({
  marketCap,
  volume,
  week52High,
  week52Low,
  peRatio,
  dividendYield,
  onBuy,
  onSell,
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
    <div style={shellStyle}>
      <div style={headerRowStyle}>
        <span style={titleStyle}>Portfolio</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => onBuy?.()}
            style={buyBtnStyle}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => onSell?.()}
            style={sellBtnStyle}
          >
            Sell
          </button>
        </div>
      </div>

      <p style={emptyStyle}>No holdings yet</p>

      <div style={gridStyle}>
        <StatCard label="Market Cap" value={capStr} />
        <StatCard label="Volume" value={volStr} />
        <StatCard label="52W High" value={highStr} />
        <StatCard label="52W Low" value={lowStr} />
        <StatCard label="P/E Ratio" value={peStr} />
        <StatCard label="Div Yield" value={divStr} />
      </div>
    </div>
  );
}
