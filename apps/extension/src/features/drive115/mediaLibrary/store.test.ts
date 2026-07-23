/**
 * @file store.test.ts
 * @description 索引 state 规范化单测
 * @module features/drive115/mediaLibrary
 */
import { describe, expect, it } from 'vitest';
import { lookupByCode, normalizeDrive115LibraryState } from './store';

describe('store', () => {
  it('normalizes dirty state and drops invalid entries', () => {
    const state = normalizeDrive115LibraryState({
      version: 9,
      updatedAt: 123,
      entries: [
        {
          folderCid: 'f1',
          videoFileId: 'v1',
          pickCode: 'p1',
          code: 'ABC-1',
          title: 'ABC-1',
          fileName: 'a.mp4',
        },
        { folderCid: '', videoFileId: 'x', pickCode: 'y' },
        null,
      ],
      stats: { indexed: 1 },
    });
    expect(state.version).toBe(1);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].key).toBe('f1:v1');
    expect(state.stats.indexed).toBe(1);
  });

  it('lookups by code case-insensitively', () => {
    const state = normalizeDrive115LibraryState({
      entries: [
        {
          folderCid: 'f',
          videoFileId: '1',
          pickCode: 'p',
          code: 'SSIS-001',
          title: 'SSIS-001',
          fileName: 'a.mp4',
        },
      ],
    });
    expect(lookupByCode(state, 'ssis-001')).toHaveLength(1);
    expect(lookupByCode(state, 'NONE')).toHaveLength(0);
  });
});
