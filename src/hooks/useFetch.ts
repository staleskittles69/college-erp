import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: boolean;
  refetch: () => void;
  /** Escape hatch for optimistic updates (e.g. after a POST/PATCH) without a refetch round-trip. */
  setData: Dispatch<SetStateAction<T>>;
}

// Standardizes the fetch+loading+error pattern repeated across the app's pages:
// GET a JSON endpoint, fall back to a default value on any failure.
export function useFetch<T>(url: string | null, fallback: T): UseFetchResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    if (!url) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    fetch(url, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setData)
      .catch(() => { setData(fallback); setError(true); })
      .finally(() => setLoading(false));
    // fallback is a stable default value (array/object literal), not a reactive dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
