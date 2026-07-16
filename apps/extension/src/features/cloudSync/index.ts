/**
 * @file index.ts
 * @description Cloud 同步扩展侧入口（配置/会话/API/本地实体适配/立即同步）
 * @module features/cloudSync
 */
export {
  CLOUD_SETTINGS_STORAGE_KEY,
  loadCloudSettings,
  saveCloudSettings,
  normalizeCloudBaseUrl,
  createDefaultCloudSettings,
  type CloudConnectionSettings,
} from './cloudSettingsStorage';
export {
  CLOUD_SESSION_STORAGE_KEY,
  createChromeTokenStore,
  loadCloudSession,
  type CloudSessionRecord,
} from './chromeTokenStore';
export { createExtensionCloudClient } from './createExtensionCloudClient';
export { createChromeCursorStore, CLOUD_CURSORS_STORAGE_KEY } from './chromeCursorStore';
export {
  createExtensionEntityStore,
  collectLocalSyncEntities,
  preparePushQueueStats,
} from './extensionEntityStore';
export { runCloudSyncNow, type CloudSyncNowResult } from './runCloudSyncNow';
export {
  countByType,
  formatTypeCounts,
  humanizeCloudError,
  SYNC_TYPE_LABELS,
  type TypeCountMap,
} from './syncStats';
