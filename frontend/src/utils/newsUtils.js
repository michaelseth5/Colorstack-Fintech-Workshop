/** Builds placeholder headline rows for the news column (workshop demo copy, not live RSS). */
export function buildNewsHeadlines(companyName, symbol) {
  if (!companyName || !symbol) return [];
  const lines = [
    `${companyName} Stock Surges Amid Strong Quarterly Earnings`,
    `Analysts Raise Price Target for ${symbol} Following Product Launch`,
    `${companyName}: What Investors Need to Know This Week`,
    `${symbol} Faces Headwinds as Market Volatility Increases`,
    `Institutional Investors Increase Stakes in ${companyName}`,
    `${symbol} Options Activity Signals Bullish Sentiment`,
  ];
  return lines.map((title) => ({ title, source: "Yahoo" }));
}
