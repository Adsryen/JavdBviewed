/**
 * @file runCloudSyncNow.ts
 * @description 扩展侧一键同步：走服务端权威 session（apply + stats/message）
 * @module features/cloudSync
 */
import { createSyncEngine } from '@javdb/sync-client';
import type { SyncEntity, SyncSessionCode, SyncSessionStats } from '@javdb/sync-protocol';
import { createChromeCursorStore } from './chromeCursorStore';
import { listCloudPending } from './chromePendingStore';
import { createExtensionCloudClient } from './createExtensionCloudClient';
import {
  collectLocalSyncEntities,
  createExtensionEntityStore,
  preparePushQueueStats,
} from './extensionEntityStore';
import { loadCloudSession } from './chromeTokenStore';
import { loadCloudSettings } from './cloudSettingsStorage';
import { countByType, type TypeCountMap } from './syncStats';

export type CloudSyncNowResult = {
  /** Server stats.downloaded */
  pulled: number;
  /** Server stats.uploaded */
  pushed: number;
  localEntityCount: number;
  pendingBefore: number;
  enqueuedNow: number;
  localByType: TypeCountMap;
  pendingByType: TypeCountMap;
  /** Server-authoritative fields */
  stats: SyncSessionStats;
  code: SyncSessionCode;
  message: string;
};

export async function runCloudSyncNow(): Promise<CloudSyncNowResult> {
  const session = await loadCloudSession();
  if (!session?.accessToken) {
    throw new Error('请先登录 Cloud');
  }
  const settings = await loadCloudSettings();
  const deviceId = session.deviceId || settings.deviceId;
  if (!deviceId) {
    throw new Error('缺少设备 ID，请重新登录');
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
  const result = await engine.syncSession(deviceId);
  const { response } = result;
  return {
    pulled: response.stats.downloaded,
    pushed: response.stats.uploaded,
    localEntityCount: prep.localEntityCount,
    pendingBefore: prep.pendingCount,
    enqueuedNow: prep.enqueuedNow,
    localByType,
    pendingByType,
    stats: response.stats,
    code: response.code,
    message: response.message,
  };
}
