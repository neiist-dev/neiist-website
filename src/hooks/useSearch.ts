import { useState, useMemo, useCallback, useDeferredValue } from "react";
import MiniSearch, { SearchOptions } from "minisearch";

export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const IST_PREFIX_REG = /^ist\d*/i;

export const isIstIdQuery = (query: string): boolean => IST_PREFIX_REG.test(query.trim());

export const normalizeIstId = (value: string): string =>
  value.replace(/^ist/i, "").replace(/\D/g, "");

export type SearchField<T> =
  | (T extends object ? keyof T : string)
  | string
  | { field: (T extends object ? keyof T : string) | string; boost?: number };

export interface UseSearchOptions<T> {
  data?: T[];
  fields: SearchField<T>[];
  idField?: (T extends object ? keyof T : string) | string;
  fuzzy?: number | false;
  limit?: number;
  returnAllWhenEmpty?: boolean; // Defaults to true
  extractField?: (_item: T, _field: string) => string | string[] | unknown;
}

export type SearchStatus = "idle" | "ready";

export interface UseSearchResult<T> {
  results: T[];
  query: string;
  setQuery: (_q: string) => void;
  status: SearchStatus;
  allData: T[];
  isSearching: boolean;
  clear: () => void;
}

const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== "object") return "";
  const parts = path.split(".");
  let current: unknown = obj;
  for (let i = 0; i < parts.length; i++) {
    if (current == null) return "";
    if (Array.isArray(current)) {
      const remainingPath = parts.slice(i).join(".");
      return current.map((item) => getNestedValue(item, remainingPath)).flat();
    }
    current = (current as Record<string, unknown>)[parts[i]];
  }
  return current;
};

export function useSearch<T>(options: UseSearchOptions<T>): UseSearchResult<T> {
  const {
    data: staticData,
    fields,
    fuzzy = 0.2,
    limit,
    returnAllWhenEmpty = true,
    extractField,
  } = options;

  const [query, setQuery] = useState("");
  const allData = useMemo(() => staticData ?? [], [staticData]);

  const fieldNames = useMemo(
    () => fields.map((f) => (typeof f === "object" ? String(f.field) : String(f))),
    [fields]
  );

  const boostMap = useMemo(() => {
    const map: Record<string, number> = {};
    fields.forEach((f) => {
      if (typeof f === "object" && f.boost !== undefined) map[String(f.field)] = f.boost;
    });
    return map;
  }, [fields]);

  const istFieldKey = useMemo(() => {
    return (
      fieldNames.find((name) =>
        ["istid", "userNumber", "user_istid", "voter_istid"].includes(name)
      ) ?? null
    );
  }, [fieldNames]);

  const miniSearch = useMemo(() => {
    if (allData.length === 0) return null;

    const ms = new MiniSearch({
      idField: "__mini_search_id__",
      fields: fieldNames,
      searchOptions: {
        boost: boostMap,
        prefix: true,
        fuzzy: (term: string) =>
          fuzzy === false || term.length < 3 ? false : typeof fuzzy === "number" ? fuzzy : 0.2,
        combineWith: "AND",
      } as SearchOptions,
      extractField: (doc: Record<string, unknown>, fieldName: string) => {
        if (fieldName === "__mini_search_id__")
          return doc.__mini_search_id__ != null ? String(doc.__mini_search_id__) : "";

        if (extractField) {
          const rawItem = (doc.self !== undefined ? doc.self : doc) as T;
          const custom = extractField(rawItem, fieldName);
          if (custom !== undefined)
            return Array.isArray(custom)
              ? custom.map((c) => String(c ?? "")).join(" ")
              : String(custom ?? "");
        }
        if (fieldName === "self" && doc.self !== undefined) return String(doc.self);

        const val = getNestedValue(doc, fieldName);
        if (Array.isArray(val))
          return val
            .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v ?? "")))
            .join(" ");

        return val != null ? String(val) : "";
      },
      processTerm: (term) => normalizeText(term) || undefined,
    });

    try {
      const documentsToIndex = allData.map((item, idx) =>
        typeof item === "object" && item !== null
          ? { ...item, __mini_search_id__: String(idx) }
          : { self: item, __mini_search_id__: String(idx) }
      );
      ms.addAll(documentsToIndex);
    } catch (e) {
      console.error("useSearch: MiniSearch indexing error:", e);
    }

    return ms;
  }, [allData, boostMap, fieldNames, fuzzy, extractField]);

  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) {
      if (!returnAllWhenEmpty) return [];
      return limit ? allData.slice(0, limit) : allData;
    }

    // Fast-path IST ID matching
    if (istFieldKey && isIstIdQuery(trimmed)) {
      const digits = normalizeIstId(trimmed);
      const getItemIstId = (item: T): string => {
        if (typeof item !== "object" || item === null) return "";
        const val = getNestedValue(item, istFieldKey);
        return normalizeIstId(String(val ?? ""));
      };

      const exact = allData.filter((item) => getItemIstId(item) === digits);
      if (exact.length > 0) return limit ? exact.slice(0, limit) : exact;

      const prefix = allData
        .filter((item) => {
          const id = getItemIstId(item);
          return id.length > 0 && id.startsWith(digits);
        })
        .sort((a, b) => getItemIstId(a).length - getItemIstId(b).length);
      return limit ? prefix.slice(0, limit) : prefix;
    }

    if (!miniSearch) return returnAllWhenEmpty ? (limit ? allData.slice(0, limit) : allData) : [];

    const hits = miniSearch.search(normalizeText(trimmed), {
      boost: boostMap,
      combineWith: "AND",
      prefix: true,
      fuzzy: (term: string) =>
        fuzzy === false || term.length < 3 ? false : typeof fuzzy === "number" ? fuzzy : 0.2,
    });
    const mapped = hits
      .map((hit) => allData[Number(hit.id)])
      .filter((item): item is T => item !== undefined);

    return limit ? mapped.slice(0, limit) : mapped;
  }, [deferredQuery, allData, istFieldKey, miniSearch, boostMap, limit, returnAllWhenEmpty, fuzzy]);

  const status: SearchStatus = query.trim() === "" ? "idle" : "ready";

  const clear = useCallback(() => {
    setQuery("");
  }, []);

  return { results, query, setQuery, status, allData, isSearching: false, clear };
}
