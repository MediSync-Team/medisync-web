import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedFetch, clearApiCache, invalidateCache, peekCache, setCache } from '../../app/lib/api/cache';

describe('api cache', () => {
  beforeEach(() => {
    clearApiCache();
    vi.useFakeTimers();
  });

  it('resolves a fresh hit without calling fn', async () => {
    setCache('k', 'cached-value', 1000);
    const fn = vi.fn().mockResolvedValue('fresh-value');

    const result = await cachedFetch('k', fn, 1000);

    expect(result).toBe('cached-value');
    expect(fn).not.toHaveBeenCalled();
  });

  it('refetches once the TTL has expired', async () => {
    setCache('k', 'old-value', 1000);
    vi.advanceTimersByTime(1001);
    const fn = vi.fn().mockResolvedValue('new-value');

    const result = await cachedFetch('k', fn, 1000);

    expect(result).toBe('new-value');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(peekCache('k')).toEqual({ data: 'new-value', fresh: true });
  });

  it('dedupes concurrent calls for the same key into a single fn invocation', async () => {
    let resolveFn: (v: string) => void = () => undefined;
    const fn = vi.fn(() => new Promise<string>((resolve) => { resolveFn = resolve; }));

    const p1 = cachedFetch('k', fn, 1000);
    const p2 = cachedFetch('k', fn, 1000);
    resolveFn('value');

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe('value');
    expect(r2).toBe('value');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('force bypasses a fresh entry', async () => {
    setCache('k', 'old-value', 1000);
    const fn = vi.fn().mockResolvedValue('new-value');

    const result = await cachedFetch('k', fn, 1000, { force: true });

    expect(result).toBe('new-value');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('rethrows on failure, leaves a prior stale entry intact, and clears inflight so the next call retries', async () => {
    setCache('k', 'stale-value', 1000);
    vi.advanceTimersByTime(1001);
    const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('recovered');

    await expect(cachedFetch('k', fn, 1000)).rejects.toThrow('boom');
    expect(peekCache('k')).toEqual({ data: 'stale-value', fresh: false });

    const result = await cachedFetch('k', fn, 1000);
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('invalidateCache removes the exact prefix and nested keys but not lookalike keys', () => {
    setCache('turnos', 'a', 1000);
    setCache('turnos:mis:1:5', 'b', 1000);
    setCache('turnos:prof:x:2026-01-01:2026-02-01', 'c', 1000);
    setCache('turnosFoo', 'd', 1000);

    invalidateCache('turnos');

    expect(peekCache('turnos')).toBeUndefined();
    expect(peekCache('turnos:mis:1:5')).toBeUndefined();
    expect(peekCache('turnos:prof:x:2026-01-01:2026-02-01')).toBeUndefined();
    expect(peekCache('turnosFoo')).toEqual({ data: 'd', fresh: true });
  });

  it('invalidation mid-flight prevents the late write from a request already in progress', async () => {
    let resolveFn: (v: string) => void = () => undefined;
    const fn = vi.fn(() => new Promise<string>((resolve) => { resolveFn = resolve; }));

    const pending = cachedFetch('turnos:mis:1:5', fn, 1000);
    invalidateCache('turnos');
    resolveFn('late-value');
    await pending;

    expect(peekCache('turnos:mis:1:5')).toBeUndefined();
  });

  it('clearApiCache empties both the store and inflight map', async () => {
    setCache('k', 'v', 1000);
    expect(peekCache('k')).toBeDefined();

    clearApiCache();

    expect(peekCache('k')).toBeUndefined();
  });

  it('peekCache reports fresh:false once the TTL has passed', () => {
    setCache('k', 'v', 1000);
    vi.advanceTimersByTime(1001);

    expect(peekCache('k')).toEqual({ data: 'v', fresh: false });
  });
});
