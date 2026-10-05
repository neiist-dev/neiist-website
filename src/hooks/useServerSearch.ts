"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface UseServerSearchOptions<T> {
  fetcher: (
    _query: string,
    _page: number,
    _signal: AbortSignal
  ) => Promise<{
    data: T[];
    total?: number;
    totalPages?: number;
  }>;
  initialData?: T[];
  initialTotal?: number;
  initialPage?: number;
  pageSize?: number;
  debounceMs?: number;
}

export type SearchStatus = "idle" | "ready" | "loading";

export interface UseServerSearchResult<T> {
  results: T[];
  query: string;
  setQuery: (_q: string) => void;
  status: SearchStatus;
  isSearching: boolean;
  clear: () => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  totalPages: number;
  setResults: React.Dispatch<React.SetStateAction<T[]>>;
  setTotal: React.Dispatch<React.SetStateAction<number>>;
  refresh: () => void;
}

export function useServerSearch<T>(options: UseServerSearchOptions<T>): UseServerSearchResult<T> {
  const {
    fetcher,
    initialData = [],
    initialTotal = initialData.length,
    initialPage = 1,
    pageSize = 50,
    debounceMs = 300,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>(initialData);
  const [page, setPage] = useState<number>(initialPage);
  const [total, setTotal] = useState<number>(initialTotal);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const prevQueryRef = useRef(query);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      if (initialData.length > 0 || initialTotal > 0) {
        return;
      }
    }

    const controller = new AbortController();
    setIsSearching(true);

    const isQueryChange = prevQueryRef.current !== query;
    prevQueryRef.current = query;
    const delay = isQueryChange ? debounceMs : 0;

    const timer = setTimeout(async () => {
      try {
        const response = await fetcher(query, page, controller.signal);
        if (!controller.signal.aborted) {
          setResults(response.data || []);
          if (typeof response.total === "number") {
            setTotal(response.total);
          }
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error("useServerSearch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetcher, query, page, refreshIndex, debounceMs, initialData.length, initialTotal]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setQueryAndResetPage = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshIndex((v) => v + 1);
  }, []);

  const status: SearchStatus = isSearching ? "loading" : query.trim() === "" ? "idle" : "ready";

  return {
    results,
    query,
    setQuery: setQueryAndResetPage,
    status,
    isSearching,
    clear,
    page,
    setPage,
    total,
    totalPages,
    setResults,
    setTotal,
    refresh,
  };
}
