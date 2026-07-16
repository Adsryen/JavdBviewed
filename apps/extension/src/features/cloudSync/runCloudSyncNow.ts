/**
 * @file runCloudSyncNow.ts
 * @description 扩展侧一键同步：拉远端 → 合并写本地 → 推 pending
 * @module features/cloudSync
 */
import { createSyncEngine } from '@javdb/sync-client';
import type { SyncEntity } from '@javdb/sync-protocol';
import { createChromeCursorStore } from './chromeCursorStore';
import { listCloudPending } from './chromePendingStore';
import { createExtensionCloudClient } from './createExtensionCloudClient';
import {
  collectLocalSyncEntities,
  createExtensionEntityStore,
  preparePushQueueStats,
} from './extensionEntityStore';
import { loadCloudSession } from './chromeTokenStore';
import { countByType, type TypeCountMap } from './syncStats';

export type CloudSyncNowResult = {
  pulled: number;
  pushed: number;
  localEntityCount: number;
  pendingBefore: number;
  enqueuedNow: number;
  localByType: TypeCountMap;
  pendingByType: TypeCountMap;
};

export async function runCloudSyncNow(): Promise<CloudSyncNowResult> {
  const session = await loadCloudSession();
  if (!session?.accessToken) {
    throw new Error('请先登录 Cloud');
  }

  const snapshot = await collectLocalSyncEntities();
  const localByType = countByType(snapshot);
  const prep = await preparePushQueueStats();
  const pending = await listCloudPending();
  const pendingByType = countByType(pending as SyncEntity[]);

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
    localByType,
    pendingByType,
  };
}
