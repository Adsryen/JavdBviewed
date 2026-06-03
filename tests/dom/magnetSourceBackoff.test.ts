import { describe, expect, it } from 'vitest';
import {
  MAGNET_SOURCE_BACKOFF_MS,
  clearMagnetSourceBackoff,
  filterMagnetSourcesByBackoff,
  getMagnetSourceBackoff,
  recordMagnetSourceFailure,
  recordMagnetSourceSuccess,
  shouldSkipMagnetSource,
  type MagnetSourceBackoffState,
} from '../../src/features/magnets/application/sourceBackoff';

describe('magnet source backoff', () => {
  it('skips a failed source until its retry time', () => {
    const state: MagnetSourceBackoffState = {};
    const failedAt = 1_000;

    recordMagnetSourceFailure(state, 'btdig', new Error('timeout'), failedAt);

    expect(shouldSkipMagnetSource(state, 'btdig', failedAt + MAGNET_SOURCE_BACKOFF_MS - 1)).toBe(true);
    expect(shouldSkipMagnetSource(state, 'btdig', failedAt + MAGNET_SOURCE_BACKOFF_MS)).toBe(false);
    expect(getMagnetSourceBackoff(state, 'btdig')?.error).toBe('timeout');
  });

  it('clears a source backoff after a successful search', () => {
    const state: MagnetSourceBackoffState = {};

    recordMagnetSourceFailure(state, 'javbus', 'network failed', 2_000);
    recordMagnetSourceSuccess(state, 'javbus');

    expect(shouldSkipMagnetSource(state, 'javbus', 2_100)).toBe(false);
    expect(getMagnetSourceBackoff(state, 'javbus')).toBeUndefined();
  });

  it('keeps manual retry available while automatic runs are throttled', () => {
    const state: MagnetSourceBackoffState = {};
    const sources = [
      { key: 'javbus' as const, name: 'JAVBUS' },
      { key: 'btdig' as const, name: 'BTdig' },
    ];

    recordMagnetSourceFailure(state, 'javbus', 'blocked', 3_000);

    const automatic = filterMagnetSourcesByBackoff(sources, state, { now: 3_500 });
    expect(automatic.runnable.map(source => source.key)).toEqual(['btdig']);
    expect(automatic.skipped.map(entry => entry.source.key)).toEqual(['javbus']);

    const manual = filterMagnetSourcesByBackoff(sources, state, { manual: true, now: 3_500 });
    expect(manual.runnable.map(source => source.key)).toEqual(['javbus', 'btdig']);
    expect(manual.skipped).toEqual([]);

    clearMagnetSourceBackoff(state, 'javbus');
    expect(shouldSkipMagnetSource(state, 'javbus', 3_500)).toBe(false);
  });
});
