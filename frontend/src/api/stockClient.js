/** Base URL for the Flask workshop API (port 5000). */
export const API_BASE_URL = "http://localhost:5000";

/**
 * Fetches combined quote + daily history for one symbol.
 * @param {string} tickerSymbol Uppercase ticker.
 * @returns {Promise<object>} Parsed JSON with normalized `history` array.
 */
export async function fetchStockQuote(tickerSymbol) {
  const response = await fetch(
    `${API_BASE_URL}/api/stock/${encodeURIComponent(tickerSymbol)}`
  );
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Bad response from server (not JSON). Is the backend running on port 5000?"
    );
  }
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  if (data.error) {
    throw new Error(data.error);
  }
  return {
    ...data,
    history: Array.isArray(data.history) ? data.history : [],
  };
}
