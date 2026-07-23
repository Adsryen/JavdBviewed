/**
 * @file rateLimit.test.ts
 * @description 限频与熔断单测
 * @module features/drive115/mediaLibrary
 */
import { describe, expect, it, vi } from 'vitest';
import { createRateLimitController, isLikelyRateLimitError } from './rateLimit';

describe('rateLimit', () => {
  it('detects rate limit messages', () => {
    expect(isLikelyRateLimitError('请求过于频繁')).toBe(true);
    expect(isLikelyRateLimitError('HTTP 429')).toBe(true);
    expect(isLikelyRateLimitError('network error')).toBe(false);
    expect(isLikelyRateLimitError('', 40140117)).toBe(true);
  });

  it('enforces min interval and trips after consecutive rate limits', async () => {
    let fakeNow = 1000;
    const sleep = vi.fn(async (ms: number) => {
      fakeNow += ms;
    });
    const ctrl = createRateLimitController({
      rootIntervalMs: 100,
      folderIntervalMs: 50,
      circuitBreakerThreshold: 2,
      sleep,
      now: () => fakeNow,
    });

    // 第一次不需要等待（lastCallAt=0）
    await ctrl.beforeFolderCall();
    expect(sleep).not.toHaveBeenCalled();
    ctrl.markSuccess();

    // 立刻再调：应等待 folderIntervalMs
    await ctrl.beforeFolderCall();
    expect(sleep).toHaveBeenCalledWith(50);

    expect(ctrl.markFailure('频繁', true)).toBe(false);
    expect(ctrl.markFailure('频繁 again', true)).toBe(true);
    expect(ctrl.isTripped()).toBe(true);
    await expect(ctrl.beforeFolderCall()).rejects.toThrow(/暂停|熔断|限流/);
  });
});

