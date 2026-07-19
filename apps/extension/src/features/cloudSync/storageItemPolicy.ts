/**
 * @file storageItemPolicy.ts
 * @description Cloud 同步 Chrome Storage 兜底项过滤规则
 * @module features/cloudSync
 */
import { STORAGE_KEYS } from '../../utils/config';

export const STORAGE_ITEM_TYPE = 'storage_item';

const TELEMETRY_CLIENT_STATE_KEY = 'telemetry_client_state';
const MAGNET_PUSH_LOGS_BACKUP_KEY = 'magnetPushLogs_backup';

const LOCAL_ONLY_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.LOGS,
  STORAGE_KEYS.IDB_MIGRATED,
  STORAGE_KEYS.IDB_LOGS_MIGRATED,
  STORAGE_KEYS.IDB_ACTORS_MIGRATED,
  STORAGE_KEYS.PRIVACY_SESSION,
  TELEMETRY_CLIENT_STATE_KEY,
  MAGNET_PUSH_LOGS_BACKUP_KEY,
  'cloud_auto_sync_settings_v1',
]);

const STRUCTURED_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS,
  STORAGE_KEYS.USER_PROFILE,
  STORAGE_KEYS.ADV_SEARCH_PRESETS,
]);

export function shouldSyncStorageItemKey(key: string): boolean {
  if (!key) return false;
  if (LOCAL_ONLY_STORAGE_KEYS.has(key)) return false;
  if (STRUCTURED_STORAGE_KEYS.has(key)) return false;
  if (key.startsWith('cloud_sync_')) return false;
  return true;
}
