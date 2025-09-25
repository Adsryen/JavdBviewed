// src/background/migrations.ts
// 迁移与周期任务（如磁链清理）

import { initDB, viewedBulkPut as idbViewedBulkPut, viewedCount as idbViewedCount, magnetsClearExpired as idbMagnetsClearExpired, logsBulkAdd as idbLogsBulkAdd } from './db';
import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';

async function ensureIDBMigrated(): Promise<void> {
  try {
    await initDB();
    const migrated = await getValue<boolean>(STORAGE_KEYS.IDB_MIGRATED, false);
    if (migrated) return;

    const viewedObj = await getValue<Record<string, any>>(STORAGE_KEYS.VIEWED_RECORDS, {});
    const all = Object.values(viewedObj || {});
    console.info('[DB] Starting initial migration to IndexedDB...', { count: all.length });

    const BATCH = 500;
    for (let i = 0; i < all.length; i += BATCH) {
      const slice = all.slice(i, i + BATCH);
      await idbViewedBulkPut(slice);
      console.info('[DB] Migrated batch', { from: i, to: Math.min(i + BATCH, all.length) });
    }

    await setValue(STORAGE_KEYS.IDB_MIGRATED, true);
    const cnt = await idbViewedCount().catch(() => -1);
    console.info('[DB] Migration finished', { total: all.length, idbCount: cnt });
  } catch (e) {
    console.warn('[DB] Migration failed (will not block extension)', (e as any)?.message);
  }
}

async function ensureIDBLogsMigrated(): Promise<void> {
  try {
    await initDB();
    const migrated = await getValue<boolean>(STORAGE_KEYS.IDB_LOGS_MIGRATED, false);
    if (migrated) return;

    const oldLogs = await getValue<any[]>(STORAGE_KEYS.LOGS, []);
    if (Array.isArray(oldLogs) && oldLogs.length > 0) {
      try { await idbLogsBulkAdd(oldLogs as any); } catch {}
      try { await setValue(STORAGE_KEYS.LOGS, []); } catch {}
    }
    await setValue(STORAGE_KEYS.IDB_LOGS_MIGRATED, true);
    console.info('[DB] Logs migration to IDB finished', { migrated: Array.isArray(oldLogs) ? oldLogs.length : 0 });
  } catch (e) {
    console.warn('[DB] Logs migration to IDB failed (will not block extension)', (e as any)?.message);
  }
}

export function ensureMigrationsStart(): void {
  // fire-and-forget on startup/wakeup
  try { ensureIDBMigrated(); } catch {}
  try { ensureIDBLogsMigrated(); } catch {}

  // Best-effort: 清理过期的磁链缓存
  try { idbMagnetsClearExpired(Date.now()).catch(() => {}); } catch {}

  // 定时清理过期的磁链缓存（chrome.alarms）
  try {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      // 每 12 小时触发一次，名称固定，重复创建会覆盖
      chrome.alarms.create('MAGNETS_CLEAN_EXPIRED', { periodInMinutes: 720 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm?.name === 'MAGNETS_CLEAN_EXPIRED') {
          try { idbMagnetsClearExpired(Date.now()).catch(() => {}); } catch {}
        }
      });
    }
  } catch {}
}
