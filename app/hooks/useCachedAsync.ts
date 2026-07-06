'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cachedFetch, peekCache } from '../lib/api/cache';

export interface CachedAsyncState<T> {
  data: T | null;
  /** true only when there's nothing cached to show yet (cold cache). */
  loading: boolean;
  /** true while revalidating in the background with data already on screen. */
  refreshing: boolean;
  error: Error | null;
  /** Force a refetch, bypassing the cache. */
  reload: () => Promise<void>;
}

interface InternalState<T> {
  key: string;
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
}

function initFromCache<T>(key: string): InternalState<T> {
  const hit = peekCache<T>(key);
  return { key, data: hit ? hit.data : null, loading: !hit, refreshing: false, error: null };
}

/**
 * Stale-while-revalidate wrapper around `cachedFetch`, mirroring the
 * `{ data, loading, error, reload }` shape of `useAsync` and adding
 * `refreshing` for background revalidation. A cached hit paints on the
 * first render (no loading flash); stale entries revalidate silently.
 */
export function useCachedAsync<T>(key: string, fn: () => Promise<T>, ttlMs: number): CachedAsyncState<T> {
  const [state, setState] = useState<InternalState<T>>(() => initFromCache<T>(key));

  // Key changed → reset synchronously during render (React's derived-state
  // pattern) so a cached hit for the new key paints on the FIRST frame.
  if (state.key !== key) {
    setState(initFromCache<T>(key));
  }

  const fnRef = useRef(fn);
  fnRef.current = fn; // latest closure without an effect dependency

  useEffect(() => {
    const hit = peekCache<T>(key);
    if (hit?.fresh) return; // fresh: no request at all

    let active = true;
    if (hit) setState((s) => (s.key === key ? { ...s, refreshing: true } : s));

    cachedFetch<T>(key, () => fnRef.current(), ttlMs, { force: !!hit })
      .then((data) => {
        if (active) setState((s) => (s.key === key ? { ...s, data, loading: false, refreshing: false, error: null } : s));
      })
      .catch((err) => {
        if (active) {
          setState((s) =>
            s.key === key
              ? { ...s, loading: false, refreshing: false, error: err instanceof Error ? err : new Error(String(err)) }
              : s
          );
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttlMs]);

  const reload = useCallback(async () => {
    setState((s) => (s.key === key ? { ...s, refreshing: true, error: null } : s));
    try {
      const data = await cachedFetch<T>(key, () => fnRef.current(), ttlMs, { force: true });
      setState((s) => (s.key === key ? { ...s, data, loading: false, refreshing: false } : s));
    } catch (err) {
      setState((s) =>
        s.key === key
          ? { ...s, loading: false, refreshing: false, error: err instanceof Error ? err : new Error(String(err)) }
          : s
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttlMs]);

  return { data: state.data, loading: state.loading, refreshing: state.refreshing, error: state.error, reload };
}
