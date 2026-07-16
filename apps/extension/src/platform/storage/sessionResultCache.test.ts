/**
 * @file sessionResultCache.test.ts
 * @description 跨页 session 结果缓存单测
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cache', () => ({
  globalCache: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined),
  },
}));

import { globalCache } from './cache';
import {
  clearSessionResultMemory,
  getOrFetchSessionResult,
  getSessionResult,
  setSessionResult,
} from './sessionResultCache';

describe('sessionResultCache', () => {
  beforeEach(() => {
    clearSessionResultMemory();
    vi.clearAllMocks();
    (globalCache.get as any).mockResolvedValue(null);
    (globalCache.set as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearSessionResultMemory();
  });

  it('fetches once and serves memory cache', async () => {
    const fetcher = vi.fn(async () => ({ lists: [1] }));
    const first = await getOrFetchSessionResult('relatedLists', 'ABC-123', fetcher);
    expect(first.fromCache).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);

    const second = await getOrFetchSessionResult('relatedLists', 'ABC-123', fetcher);
    expect(second.fromCache).toBe(true);
    expect(second.data).toEqual({ lists: [1] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent fetches for same key', async () => {
    let resolveFetch: (v: string) => void = () => {};
    const fetcher = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const p1 = getOrFetchSessionResult('fc2', 'id-1', fetcher);
    const p2 = getOrFetchSessionResult('fc2', 'id-1', fetcher);
    // p1 需先 await getSessionResult 后才调用 fetcher
    await vi.waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
    resolveFetch('ok');
    const [a, b] = await Promise.all([p1, p2]);
    expect(a.data).toBe('ok');
    expect(b.data).toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('force bypasses cache', async () => {
    const fetcher = vi.fn(async () => 1);
    await getOrFetchSessionResult('onlineAvailability', 'X', fetcher);
    fetcher.mockResolvedValue(2);
    const again = await getOrFetchSessionResult('onlineAvailability', 'X', fetcher, { force: true });
    expect(again.fromCache).toBe(false);
    expect(again.data).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reads through globalCache when memory empty', async () => {
    (globalCache.get as any).mockResolvedValue({ hit: true });
    const value = await getSessionResult<{ hit: boolean }>('relatedLists', 'ZZ-1');
    expect(value).toEqual({ hit: true });
    await setSessionResult('relatedLists', 'ZZ-1', { hit: false });
    expect(globalCache.set).toHaveBeenCalled();
  });
});
