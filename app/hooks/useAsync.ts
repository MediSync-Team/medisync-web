'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-run the async function on demand (e.g. after a mutation). */
  reload: () => Promise<void>;
}

/**
 * Run an async function on mount and whenever `deps` change, exposing the
 * canonical `{ data, loading, error, reload }` shape. Replaces the hand-rolled
 * `loading/error/data + useEffect(fetch)` triads repeated across the dashboards.
 *
 * The function is invoked through a ref-stable `reload` callback keyed on `deps`,
 * so passing inline functions is fine. Errors are captured into `error` rather
 * than thrown, and `data` is left untouched on failure.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    run()
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err instanceof Error ? err : new Error(String(err))); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [run]);

  return { data, loading, error, reload };
}
