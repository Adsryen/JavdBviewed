/**
 * @file mediaWatchEvidence.test.ts
 * @description 本地观看证据单测
 * @module features/media
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store: Record<string, unknown> = {};

vi.mock('../../utils/storage', () => ({
  getValue: vi.fn(async (key: string, fallback: unknown) => {
    return key in store ? store[key] : fallback;
  }),
  setValue: vi.fn(async (key: string, value: unknown) => {
    store[key] = value;
  }),
}));

import { getWatchEvidence, reportWatchProgress } from './mediaWatchEvidence';

describe('mediaWatchEvidence', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it('merges higher percent and marks watched at threshold', async () => {
    await reportWatchProgress({ code: 'abc-1', source: 'drive115', percent: 20 });
    const mid = await getWatchEvidence('ABC-1');
    expect(mid?.percent).toBe(20);
    expect(mid?.watched).toBe(false);

    await reportWatchProgress({ code: 'ABC-1', source: 'drive115', percent: 95 });
    const done = await getWatchEvidence('abc-1');
    expect(done?.percent).toBe(95);
    expect(done?.watched).toBe(true);
  });

  it('does not decrease percent', async () => {
    await reportWatchProgress({ code: 'X-1', source: 'drive115', percent: 80 });
    await reportWatchProgress({ code: 'X-1', source: 'drive115', percent: 10 });
    const e = await getWatchEvidence('X-1');
    expect(e?.percent).toBe(80);
  });
});
