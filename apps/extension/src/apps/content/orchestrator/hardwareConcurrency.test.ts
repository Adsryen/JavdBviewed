import { describe, expect, it } from 'vitest';
import { resolveBrowserHighTaskConcurrency, resolveHighTaskConcurrency } from './hardwareConcurrency';

describe('resolveHighTaskConcurrency', () => {
  it('uses five high tasks for high-end devices', () => {
    expect(resolveHighTaskConcurrency(8).maxConcurrentHighTasks).toBe(5);
    expect(resolveHighTaskConcurrency(16).message).toContain('High-end');
  });

  it('uses three high tasks for mid-range devices and as fallback', () => {
    expect(resolveHighTaskConcurrency(4).maxConcurrentHighTasks).toBe(3);
    expect(resolveHighTaskConcurrency(undefined).maxConcurrentHighTasks).toBe(3);
  });

  it('uses two high tasks for low-end devices', () => {
    expect(resolveHighTaskConcurrency(2).maxConcurrentHighTasks).toBe(2);
  });

  it('falls back when browser hardware concurrency cannot be read', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() {
        throw new Error('navigator unavailable');
      },
    });

    expect(resolveBrowserHighTaskConcurrency()).toEqual({
      maxConcurrentHighTasks: 3,
      message: 'Hardware detection failed, using default concurrency: 3',
    });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });
});
