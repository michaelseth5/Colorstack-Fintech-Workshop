/**
 * Calendar-based chart window: anchor on the latest bar (last trading day in history),
 * slice backwards by real calendar days. Data must be YYYY-MM-DD strings from the API.
 *
 * Workshop note: the parent passes the full `history` array from Flask; we only *slice* it
 * here for the chart — we never fetch new data when you change 1W / 1M / etc.
 */

/** Default calendar lookback when range key is missing. */
export const DEFAULT_RANGE_CALENDAR_DAYS = 90;

/** Calendar lookback per range (slice from last bar backwards). */
export const RANGE_CALENDAR_DAYS = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
  "10Y": 3650,
};

function parseYmdUtc(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** UTC midnight ms for a YYYY-MM-DD (stable x-position for Recharts time axis). */
export function ymdToUtcMs(ymd) {
  if (!ymd || typeof ymd !== "string") return 0;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Date.UTC(y, m - 1, d);
}

export function msToYmd(ms) {
  if (ms == null || Number.isNaN(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

function subtractCalendarDaysFromYmd(endYmd, days) {
  const t = parseYmdUtc(endYmd);
  t.setUTCDate(t.getUTCDate() - days);
  return t.toISOString().slice(0, 10);
}

/**
 * Returns history rows sorted ascending, ending at the latest non-future bar,
 * within [end - N calendar days, end].
 */
export function getChartDataForRange(history, range) {
  if (!history?.length) return [];
  const sorted = [...history]
    .filter((row) => typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayStr = new Date().toISOString().slice(0, 10);
  const noFuture = sorted.filter((row) => row.date <= todayStr);
  if (!noFuture.length) return [];

  const end = noFuture[noFuture.length - 1].date;
  const daysBack = RANGE_CALENDAR_DAYS[range] ?? DEFAULT_RANGE_CALENDAR_DAYS;
  const startStr = subtractCalendarDaysFromYmd(end, daysBack);

  return noFuture.filter((row) => row.date >= startStr && row.date <= end);
}

function calendarDayGapYmd(a, b) {
  return (parseYmdUtc(b) - parseYmdUtc(a)) / 86400000;
}

/** Minimum gap between x-axis tick labels (calendar days) per range. */
const TICK_MIN_GAP_DAYS = {
  "1W": 1,
  "1M": 5,
  "3M": 14,
  "6M": 30,
  "1Y": 60,
  "5Y": 182,
  "10Y": 365,
};

/**
 * Builds a thinned list of date labels for the x-axis (reduces overlap).
 */
export function getAxisTickDates(sortedDateStrings, range) {
  const dates = sortedDateStrings.filter(Boolean);
  if (!dates.length) return [];

  const gap = TICK_MIN_GAP_DAYS[range] ?? 30;
  if (range === "1W" || gap <= 1) return [...dates];

  const out = [dates[0]];
  let lastShown = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const dt = dates[i];
    if (calendarDayGapYmd(lastShown, dt) >= gap) {
      out.push(dt);
      lastShown = dt;
    }
  }
  if (out[out.length - 1] !== dates[dates.length - 1]) {
    out.push(dates[dates.length - 1]);
  }
  return out;
}

/** Format date labels for axis / tooltip — each range has a distinct style. */
export function formatXAxisDate(dateStr, range) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T12:00:00Z`);

  switch (range) {
    case "1W":
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    case "1M":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "3M":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
    case "6M":
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    case "1Y":
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    case "5Y":
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    case "10Y":
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    default:
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
