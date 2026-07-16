/**
 * @file chromeCursorStore.ts
 * @description Cloud 同步游标持久化（本机 local-only）
 * @module features/cloudSync
 */
import type { CursorStore } from '@javdb/sync-client';
import type { SyncCursorMap } from '@javdb/sync-protocol';

export const CLOUD_CURSORS_STORAGE_KEY = 'cloud_sync_cursors_v1';

export function createChromeCursorStore(): CursorStore {
  return {
    async get() {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.get([CLOUD_CURSORS_STORAGE_KEY], (res) => {
            const v = res?.[CLOUD_CURSORS_STORAGE_KEY];
            resolve(v && typeof v === 'object' ? (v as SyncCursorMap) : {});
          });
        } catch {
          resolve({});
        }
      });
    },
    async set(cursors) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [CLOUD_CURSORS_STORAGE_KEY]: cursors }, () => resolve());
        } catch {
          resolve();
        }
      });
    },
  };
}
