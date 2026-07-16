/**
 * @file conflict.test.ts
 * @description Unit tests for protocol conflict pure functions.
 */
import { describe, expect, it } from 'vitest';
import {
  compareRevisioned,
  mergePreferenceMap,
  mergeRecord,
  mergeSetWithTombstones,
  mergeSyncEntity,
  mergeVaultItem,
} from './conflict';
import type { SyncEntity, VaultItem } from './types';

describe('compareRevisioned / mergeRecord', () => {
  it('prefers higher revision', () => {
    const a = { revision: 2, updatedAt: 10 };
    const b = { revision: 5, updatedAt: 1 };
    expect(mergeRecord(a, b)).toBe(b);
    expect(compareRevisioned(a, b)).toBeLessThan(0);
  });

  it('tie-breaks on updatedAt when revision equal', () => {
    const a = { revision: 3, updatedAt: 100 };
    const b = { revision: 3, updatedAt: 200 };
    expect(mergeRecord(a, b)).toBe(b);
  });

  it('prefers later soft-delete when rev and updatedAt equal', () => {
    const a = { revision: 1, updatedAt: 50, deletedAt: 10 };
    const b = { revision: 1, updatedAt: 50, deletedAt: 90 };
    expect(mergeRecord(a, b)).toBe(b);
  });
});

describe('mergeSetWithTombstones', () => {
  it('unions members without tombstones', () => {
    const r = mergeSetWithTombstones(
      { members: ['a', 'b'] },
      { members: ['b', 'c'] },
    );
    expect(r.members).toEqual(['a', 'b', 'c']);
    expect(r.tombstones).toEqual([]);
  });

  it('does not resurrect tombstoned members', () => {
    const r = mergeSetWithTombstones(
      { members: ['a', 'b'], tombstones: [{ memberId: 'b', deletedAt: 10 }] },
      { members: ['b', 'c'] },
    );
    expect(r.members).toEqual(['a', 'c']);
    expect(r.tombstones).toEqual([{ memberId: 'b', deletedAt: 10 }]);
  });

  it('keeps newer tombstone timestamp', () => {
    const r = mergeSetWithTombstones(
      { members: [], tombstones: [{ memberId: 'x', deletedAt: 5 }] },
      { members: ['x'], tombstones: [{ memberId: 'x', deletedAt: 9 }] },
    );
    expect(r.members).toEqual([]);
    expect(r.tombstones[0]?.deletedAt).toBe(9);
  });
});

describe('mergePreferenceMap', () => {
  it('merges per-key by revision then updatedAt', () => {
    const out = mergePreferenceMap(
      [
        { key: 'theme', value: 'dark', updatedAt: 1, revision: 1 },
        { key: 'lang', value: 'zh', updatedAt: 5, revision: 1 },
      ],
      [
        { key: 'theme', value: 'light', updatedAt: 2, revision: 2 },
        { key: 'density', value: 'compact', updatedAt: 1, revision: 1 },
      ],
    );
    const byKey = Object.fromEntries(out.map((e) => [e.key, e.value]));
    expect(byKey.theme).toBe('light');
    expect(byKey.lang).toBe('zh');
    expect(byKey.density).toBe('compact');
  });
});

describe('mergeVaultItem / mergeSyncEntity', () => {
  it('LWW vault items by revision', () => {
    const a: VaultItem = {
      id: 'w1',
      kind: 'webdav',
      ciphertext: 'old',
      revision: 1,
      updatedAt: 10,
    };
    const b: VaultItem = {
      id: 'w1',
      kind: 'webdav',
      ciphertext: 'new',
      revision: 2,
      updatedAt: 5,
    };
    expect(mergeVaultItem(a, b).ciphertext).toBe('new');
  });

  it('merges sync entities of same id/type', () => {
    const a: SyncEntity<{ n: number }> = {
      id: 'v1',
      type: 'video',
      revision: 1,
      updatedAt: 1,
      payload: { n: 1 },
    };
    const b: SyncEntity<{ n: number }> = {
      id: 'v1',
      type: 'video',
      revision: 2,
      updatedAt: 1,
      payload: { n: 2 },
    };
    expect(mergeSyncEntity(a, b).payload.n).toBe(2);
  });

  it('throws when entity identity differs', () => {
    const a: SyncEntity = {
      id: '1',
      type: 'video',
      revision: 1,
      updatedAt: 1,
      payload: {},
    };
    const b: SyncEntity = {
      id: '2',
      type: 'video',
      revision: 2,
      updatedAt: 1,
      payload: {},
    };
    expect(() => mergeSyncEntity(a, b)).toThrow(/same id/);
  });
});
