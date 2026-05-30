import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLegacyViewedRecordsFromStorage,
  handleGetAllTags,
} from '../../src/apps/background/dbTagsMessageHandlers';
import { STORAGE_KEYS } from '../../src/utils/config';

describe('db tags message handlers', () => {
  beforeEach(() => {
    awaitChromeStorageClear();
  });

  it('reads chunked legacy viewed records from chrome storage', async () => {
    const key = STORAGE_KEYS.VIEWED_RECORDS;
    await chrome.storage.local.set({
      [`__chunks_meta__:${key}`]: { chunks: 2 },
      [`__chunk__:${key}::1`]: { A: { id: 'A' } },
      [`__chunk__:${key}::2`]: { B: { id: 'B' } },
    });

    await expect(getLegacyViewedRecordsFromStorage()).resolves.toEqual({
      A: { id: 'A' },
      B: { id: 'B' },
    });
  });

  it('builds top tags from IDB records, tag index rows, and legacy records', async () => {
    const sendResponse = vi.fn();

    await handleGetAllTags(
      { payload: { limit: 10 } },
      sendResponse,
      {
        viewedGetAll: vi.fn(async () => [{ id: 'A', tags: ['剧情'] }]),
        viewedTagIndexGetAll: vi.fn(async () => [
          { key: '巨乳::B', tag: '巨乳', videoId: 'B' },
          { key: '巨乳::C', tag: '巨乳', videoId: 'C' },
        ]),
        getLegacyViewedRecords: vi.fn(async () => ({
          D: { id: 'D', tags: ['剧情'] },
        })),
      },
    );

    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      tags: [
        { name: '剧情', count: 2 },
        { name: '巨乳', count: 2 },
      ],
    });
  });
});

function awaitChromeStorageClear(): void {
  chrome.storage.local.clear();
}
