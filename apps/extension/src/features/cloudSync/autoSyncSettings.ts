/**
 * @file autoSyncSettings.ts
 * @description Cloud 自动同步开关与间隔（local-only）
 * @module features/cloudSync
 */

export const CLOUD_AUTO_SYNC_STORAGE_KEY = 'cloud_auto_sync_settings_v1';

export type CloudAutoSyncSettings = {
  /** 登录后周期自动同步 */
  enabled: boolean;
  /** 间隔分钟（最小 5） */
  intervalMinutes: number;
  updatedAt: number;
};

export const DEFAULT_CLOUD_AUTO_SYNC: CloudAutoSyncSettings = {
  enabled: true,
  intervalMinutes: 30,
  updatedAt: 0,
};

export async function loadCloudAutoSyncSettings(): Promise<CloudAutoSyncSettings> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([CLOUD_AUTO_SYNC_STORAGE_KEY], (res) => {
        const v = res?.[CLOUD_AUTO_SYNC_STORAGE_KEY] as Partial<CloudAutoSyncSettings> | undefined;
        if (!v || typeof v !== 'object') {
          resolve({ ...DEFAULT_CLOUD_AUTO_SYNC });
          return;
        }
        const interval = Number(v.intervalMinutes);
        resolve({
          enabled: v.enabled !== false,
          intervalMinutes:
            Number.isFinite(interval) && interval >= 5 ? Math.floor(interval) : 30,
          updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : 0,
        });
      });
    } catch {
      resolve({ ...DEFAULT_CLOUD_AUTO_SYNC });
    }
  });
}

export async function saveCloudAutoSyncSettings(
  patch: Partial<CloudAutoSyncSettings>,
): Promise<CloudAutoSyncSettings> {
  const cur = await loadCloudAutoSyncSettings();
  const interval = Number(patch.intervalMinutes ?? cur.intervalMinutes);
  const next: CloudAutoSyncSettings = {
    enabled: patch.enabled ?? cur.enabled,
    intervalMinutes: Number.isFinite(interval) && interval >= 5 ? Math.floor(interval) : 30,
    updatedAt: Date.now(),
  };
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [CLOUD_AUTO_SYNC_STORAGE_KEY]: next }, () => resolve(next));
    } catch {
      resolve(next);
    }
  });
}
