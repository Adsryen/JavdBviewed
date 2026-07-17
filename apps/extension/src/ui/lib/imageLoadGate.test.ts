/**
 * @file imageLoadGate.test.ts
 * @description 图片起载限流单测
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureImageLoadGate,
  getImageLoadGateConfig,
  requestImageLoad,
  resetImageLoadGateForTests,
} from './imageLoadGate';

describe('imageLoadGate', () => {
  afterEach(() => {
    resetImageLoadGateForTests();
    configureImageLoadGate({ perSecond: 30 });
    vi.useRealTimers();
  });

  it('allows up to perSecond immediate starts then queues the rest', () => {
    configureImageLoadGate({ perSecond: 5 });
    resetImageLoadGateForTests();
    const started: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const n = i;
      requestImageLoad(() => {
        started.push(n);
      });
    }
    expect(started).toHaveLength(5);
    expect(getImageLoadGateConfig().queued).toBeGreaterThan(0);
  });

  it('drains queue over time under rate limit', () => {
    vi.useFakeTimers();
    configureImageLoadGate({ perSecond: 10 });
    resetImageLoadGateForTests();
    const started: number[] = [];
    for (let i = 0; i < 20; i += 1) {
      const n = i;
      requestImageLoad(() => {
        started.push(n);
      });
    }
    expect(started.length).toBe(10);
    vi.advanceTimersByTime(1100);
    // pump runs on 40ms ticks; after ~1s should allow more
    expect(started.length).toBeGreaterThan(10);
    expect(started.length).toBeLessThanOrEqual(20);
  });

  it('cancel prevents queued job from running', () => {
    configureImageLoadGate({ perSecond: 1 });
    resetImageLoadGateForTests();
    const a: string[] = [];
    requestImageLoad(() => a.push('first'));
    const second = requestImageLoad(() => a.push('second'));
    second.cancel();
    expect(a).toEqual(['first']);
  });
});
