/** Formats market cap for display (T / B / M). */
export function formatMarketCap(value) {
  if (value == null || value === "") return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  return `$${(value / 1e6).toFixed(2)}M`;
}

/** Formats daily volume as millions. */
export function formatVolume(value) {
  if (value == null || value === "") return "N/A";
  return `${(value / 1e6).toFixed(2)}M`;
}

/** Formats a dollar price or returns N/A. */
export function formatPrice(value) {
  if (value == null || value === "") return "N/A";
  return `$${Number(value).toFixed(2)}`;
}
