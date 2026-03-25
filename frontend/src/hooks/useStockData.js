import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchStockNews, fetchStockQuote } from "../api/stockClient";
import { getChartDataForRange } from "../utils/chartUtils";
import {
  CHART_TIME_RANGES,
  DEFAULT_WATCHLIST_TICKERS,
  STOCK_POLL_INTERVAL_MS,
} from "../constants/appConstants";

/**
 * Dashboard data: selected symbol, quote, chart slice, watchlist snapshots, news.
 */
export function useStockData() {
  const [selectedTicker, setSelectedTicker] = useState("TSLA");
  const [searchQuery, setSearchQuery] = useState("");
  const [stock, setStock] = useState(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState("");
  const [selectedRange, setSelectedRange] = useState("3M");
  const [watchlistTickers, setWatchlistTickers] = useState(
    () => [...DEFAULT_WATCHLIST_TICKERS]
  );
  const [quoteSnapshots, setQuoteSnapshots] = useState({});
  const [activeNavigation, setActiveNavigation] = useState("Terminal");
  const [isWatchlistInputVisible, setIsWatchlistInputVisible] = useState(false);
  const [watchlistInputValue, setWatchlistInputValue] = useState("");
  const [newsArticles, setNewsArticles] = useState([]);

  const loadStock = useCallback(async (tickerSymbol, options = {}) => {
    const silent = options.silent === true;
    if (!silent) {
      setIsLoadingStock(true);
      setStockError("");
    }
    try {
      const data = await fetchStockQuote(tickerSymbol);
      setStock(data);
    } catch (err) {
      if (!silent) {
        setStockError(
          err instanceof Error
            ? err.message
            : "Could not load stock data. Try another ticker."
        );
        setStock(null);
      }
    } finally {
      if (!silent) {
        setIsLoadingStock(false);
      }
    }
  }, []);

  useEffect(() => {
    loadStock(selectedTicker);
  }, [loadStock, selectedTicker]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadStock(selectedTicker, { silent: true });
    }, STOCK_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadStock, selectedTicker]);

  useEffect(() => {
    if (stock?.symbol != null) {
      setQuoteSnapshots((previous) => ({
        ...previous,
        [stock.symbol]: {
          price: stock.price,
          change: stock.change,
        },
      }));
    }
  }, [stock]);

  useEffect(() => {
    let cancelled = false;
    const symbols = [...watchlistTickers];
    (async () => {
      await Promise.all(
        symbols.map(async (sym) => {
          try {
            const data = await fetchStockQuote(sym);
            if (cancelled || data?.symbol == null) return;
            setQuoteSnapshots((prev) => ({
              ...prev,
              [data.symbol]: {
                price: data.price,
                change: data.change,
              },
            }));
          } catch {
            /* keep prior snapshot if any */
          }
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [watchlistTickers]);

  useEffect(() => {
    let cancelled = false;
    const sym = selectedTicker?.trim().toUpperCase();
    if (!sym) {
      setNewsArticles([]);
      return undefined;
    }
    (async () => {
      try {
        const articles = await fetchStockNews(sym);
        if (!cancelled) setNewsArticles(articles);
      } catch {
        if (!cancelled) setNewsArticles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTicker]);

  const chartData = useMemo(
    () => getChartDataForRange(stock?.history, selectedRange),
    [stock, selectedRange]
  );

  const isPriceUp = Boolean(stock) && (stock.change ?? 0) >= 0;

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

  const handleRemoveWatchlistTicker = (tickerSymbol) => {
    setWatchlistTickers((previousTickers) => {
      const nextTickers = previousTickers.filter(
        (item) => item !== tickerSymbol
      );
      if (selectedTicker === tickerSymbol && nextTickers.length > 0) {
        setSelectedTicker(nextTickers[0]);
      }
      return nextTickers;
    });
    setQuoteSnapshots((previous) => {
      const next = { ...previous };
      delete next[tickerSymbol];
      return next;
    });
  };

  return {
    selectedTicker,
    setSelectedTicker,
    searchQuery,
    setSearchQuery,
    stock,
    isLoadingStock,
    stockError,
    selectedRange,
    setSelectedRange,
    watchlistTickers,
    setWatchlistTickers,
    quoteSnapshots,
    activeNavigation,
    setActiveNavigation,
    isWatchlistInputVisible,
    setIsWatchlistInputVisible,
    watchlistInputValue,
    setWatchlistInputValue,
    newsArticles,
    chartData,
    isPriceUp,
    handleSearchSubmit,
    handleRemoveWatchlistTicker,
    chartTimeRanges: CHART_TIME_RANGES,
  };
}
