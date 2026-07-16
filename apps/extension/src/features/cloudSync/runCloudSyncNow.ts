/**
 * @file runCloudSyncNow.ts
 * @description 扩展侧一键同步：拉远端 → 合并写本地 → 推 pending
 * @module features/cloudSync
 */
import { createSyncEngine } from '@javdb/sync-client';
import { createChromeCursorStore } from './chromeCursorStore';
import { createExtensionCloudClient } from './createExtensionCloudClient';
import {
  createExtensionEntityStore,
  preparePushQueueStats,
} from './extensionEntityStore';
import { loadCloudSession } from './chromeTokenStore';

export type CloudSyncNowResult = {
  pulled: number;
  pushed: number;
  localEntityCount: number;
  pendingBefore: number;
  enqueuedNow: number;
};

export async function runCloudSyncNow(): Promise<CloudSyncNowResult> {
  const session = await loadCloudSession();
  if (!session?.accessToken) {
    throw new Error('请先登录 Cloud');
  }

  const prep = await preparePushQueueStats();
  const { api } = await createExtensionCloudClient();
  const engine = createSyncEngine({
    api,
    local: createExtensionEntityStore(),
    cursors: createChromeCursorStore(),
  });
  const result = await engine.syncNow();
  return {
    pulled: result.pulled,
    pushed: result.pushed,
    localEntityCount: prep.localEntityCount,
    pendingBefore: prep.pendingCount,
    enqueuedNow: prep.enqueuedNow,
  };
}
