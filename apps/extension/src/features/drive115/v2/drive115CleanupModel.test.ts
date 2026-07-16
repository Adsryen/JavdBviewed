/**
 * @file drive115CleanupModel.test.ts
 * @description 115 清理清单 pure 模型单测
 * @module features/drive115
 */
import { describe, expect, it } from 'vitest';
import {
  EMPTY_CLEANUP_LIST,
  enqueueCleanupItem,
  listPendingCleanup,
  markCleanupResult,
  pruneFinishedCleanup,
} from './drive115CleanupModel';

describe('drive115CleanupModel', () => {
  it('enqueues unique pending items', () => {
    let state = EMPTY_CLEANUP_LIST;
    state = enqueueCleanupItem(state, {
      code: 'ABC-1',
      title: 't',
      fileId: 'f1',
      pickCode: 'p1',
      reason: 'watched',
    }, 1);
    state = enqueueCleanupItem(state, {
      code: 'ABC-1',
      title: 't',
      fileId: 'f1',
      pickCode: 'p1',
      reason: 'watched',
    }, 2);
    expect(listPendingCleanup(state)).toHaveLength(1);
  });

  it('marks deleted and prunes finished', () => {
    let state = enqueueCleanupItem(EMPTY_CLEANUP_LIST, {
      code: 'ABC-1',
      title: 't',
      fileId: 'f1',
      reason: 'watched',
    }, 1);
    const id = state.items[0].id;
    state = markCleanupResult(state, id, 'deleted');
    expect(listPendingCleanup(state)).toHaveLength(0);
    state = pruneFinishedCleanup(state, 3);
    expect(state.items).toHaveLength(0);
  });
});
