import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCachedAsync } from '../../app/hooks/useCachedAsync';
import { clearApiCache, setCache } from '../../app/lib/api/cache';

describe('useCachedAsync', () => {
  beforeEach(() => {
    clearApiCache();
  });

  it('starts loading on a cold key and settles with fetched data', async () => {
    const fn = vi.fn().mockResolvedValue('value');
    const { result } = renderHook(() => useCachedAsync('k', fn, 1000));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBe('value');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('paints cached data on the first render for a fresh key without calling fn', async () => {
    setCache('k', 'cached', 1000);
    const fn = vi.fn().mockResolvedValue('should-not-be-used');

    const { result } = renderHook(() => useCachedAsync('k', fn, 1000));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('cached');
    expect(fn).not.toHaveBeenCalled();
  });

  it('shows stale data immediately while revalidating in the background', async () => {
    setCache('k', 'stale', -1); // already expired
    const fn = vi.fn().mockResolvedValue('fresh');

    const { result } = renderHook(() => useCachedAsync('k', fn, 1000));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('stale');
    expect(result.current.refreshing).toBe(true);

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.data).toBe('fresh');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('reload() forces a refetch even when the cache is fresh', async () => {
    const fn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const { result } = renderHook(() => useCachedAsync('k', fn, 1000));

    await waitFor(() => expect(result.current.data).toBe('first'));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.data).toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('resets to loading when the key changes to a cold key', async () => {
    const fn = vi.fn().mockResolvedValue('a-value');
    const { result, rerender } = renderHook(({ key }) => useCachedAsync(key, fn, 1000), {
      initialProps: { key: 'a' },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ key: 'b' });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('keeps stale data visible and surfaces the error when the fetch fails', async () => {
    setCache('k', 'stale', -1);
    const fn = vi.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useCachedAsync('k', fn, 1000));

    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(result.current.data).toBe('stale');
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('network down');
  });
});
