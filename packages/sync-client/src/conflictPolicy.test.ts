/**
 * @file conflictPolicy.test.ts
 */
import { describe, expect, it } from 'vitest';
import type { SyncEntity } from '@javdb/sync-protocol';
import { advanceCursors, mergeEntityBatches } from './conflictPolicy';

const e = (
  type: string,
  id: string,
  revision: number,
  payload: unknown = {},
): SyncEntity => ({
  id,
  type,
  revision,
  updatedAt: revision * 10,
  payload,
});

describe('mergeEntityBatches', () => {
  it('keeps higher revision per id', () => {
    const local = [e('video', 'a', 1, { s: 'L' }), e('video', 'b', 3, { s: 'B' })];
    const remote = [e('video', 'a', 2, { s: 'R' }), e('actor', 'x', 1, {})];
    const out = mergeEntityBatches(local, remote);
    const a = out.find((x) => x.id === 'a');
    expect(a?.revision).toBe(2);
    expect((a?.payload as { s: string }).s).toBe('R');
    expect(out.some((x) => x.id === 'b')).toBe(true);
    expect(out.some((x) => x.id === 'x')).toBe(true);
  });
});

describe('advanceCursors', () => {
  it('takes max revision per type', () => {
    const next = advanceCursors({ video: 1 }, [e('video', 'a', 5), e('actor', 'b', 2)]);
    expect(next.video).toBe(5);
    expect(next.actor).toBe(2);
  });
});
