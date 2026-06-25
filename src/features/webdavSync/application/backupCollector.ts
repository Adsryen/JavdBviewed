import { logsGetAll as idbLogsGetAll, magnetPushLogsGetAll as idbMagnetPushLogsGetAll, initDB } from '../../../platform/storage/indexedDb';
import { STORAGE_KEYS } from '../../../utils/config';
import { getSettings, getValue } from '../../../utils/storage';
import { TELEMETRY_CLIENT_STATE_KEY } from '../../telemetry';
import type { WebDAVClientLog } from '../infrastructure/webdavClient';

const LOCAL_ONLY_STORAGE_KEYS = [
  TELEMETRY_CLIENT_STATE_KEY,
  STORAGE_KEYS.EMBY_LIBRARY_STATE,
] as const;

export interface WebDAVBackupCollectorOptions {
  logger?: WebDAVClientLog;
}

export function byteSizeOf(value: any): number {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return new TextEncoder().encode(s).length;
  } catch {
    return 0;
  }
}

export function omitLocalOnlyStorageKeys(value: Record<string, any>): Record<string, any> {
  const next = { ...(value || {}) };
  for (const key of LOCAL_ONLY_STORAGE_KEYS) {
    delete next[key];
  }
  return next;
}

export async function collectBackupData(options: WebDAVBackupCollectorOptions = {}): Promise<any> {
  const settings = await getSettings();

  const [
    recordsToSync,
    userProfile,
    actorRecords,
    importStats,
    newWorksSubscriptions,
    newWorksRecords,
    newWorksConfig,
  ] = await Promise.all([
    getValue(STORAGE_KEYS.VIEWED_RECORDS, {}),
    getValue(STORAGE_KEYS.USER_PROFILE, null),
    getValue(STORAGE_KEYS.ACTOR_RECORDS, {}),
    getValue(STORAGE_KEYS.LAST_IMPORT_STATS, null),
    getValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {}),
    getValue(STORAGE_KEYS.NEW_WORKS_RECORDS, {}),
    getValue(STORAGE_KEYS.NEW_WORKS_CONFIG, {}),
  ]);

  const logs = await idbLogsGetAll().catch(async () => await getValue(STORAGE_KEYS.LOGS, []));
  const magnetPushLogs = await idbMagnetPushLogsGetAll().catch(async () => await getValue('magnetPushLogs_backup' as any, []));

  let idbViewed: any[] = [];
  let idbActors: any[] = [];
  let idbNewWorks: any[] = [];
  let idbMagnets: any[] = [];
  let idbLists: any[] = [];
  try {
    const db = await initDB();
    try { idbViewed = await db.getAll('viewedRecords'); } catch {}
    try { idbActors = await db.getAll('actors'); } catch {}
    try { idbNewWorks = await db.getAll('newWorks'); } catch {}
    try { idbMagnets = await db.getAll('magnets'); } catch {}
    try { idbLists = await db.getAll('lists'); } catch {}
  } catch {}

  let storageKeysCount = 0;
  let topStorageKeysByBytes: Array<{ key: string; bytes: number }> = [];
  let storageAll: Record<string, any> | null = null;
  try {
    const all = await new Promise<Record<string, any>>((resolve) => {
      try { chrome.storage.local.get(null, (res) => resolve(res || {})); } catch { resolve({}); }
    });
    const backupStorage = omitLocalOnlyStorageKeys(all);
    const entries = Object.entries(backupStorage);
    storageKeysCount = entries.length;
    topStorageKeysByBytes = entries
      .map(([k, v]) => ({ key: k, bytes: byteSizeOf(v) }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 50);
    storageAll = backupStorage;
  } catch {}

  const stats = {
    storage: {
      keys: storageKeysCount,
      selectedKeysBytes: {
        settings: byteSizeOf(settings),
        viewed: byteSizeOf(recordsToSync),
        userProfile: byteSizeOf(userProfile),
        actorRecords: byteSizeOf(actorRecords),
        newWorks: {
          subscriptions: byteSizeOf(newWorksSubscriptions),
          records: byteSizeOf(newWorksRecords),
          config: byteSizeOf(newWorksConfig),
        },
        logs: byteSizeOf(logs),
        magnetPushLogs: byteSizeOf(magnetPushLogs),
        importStats: byteSizeOf(importStats),
      },
      topKeysBySize: topStorageKeysByBytes,
    },
    idb: {
      viewedRecords: { count: Array.isArray(idbViewed) ? idbViewed.length : 0 },
      actors: { count: Array.isArray(idbActors) ? idbActors.length : 0 },
      newWorks: { count: Array.isArray(idbNewWorks) ? idbNewWorks.length : 0 },
      magnets: { count: Array.isArray(idbMagnets) ? idbMagnets.length : 0 },
      lists: { count: Array.isArray(idbLists) ? idbLists.length : 0 },
      logs: { count: Array.isArray(logs) ? logs.length : 0 },
      magnetPushLogs: { count: Array.isArray(magnetPushLogs) ? magnetPushLogs.length : 0 },
    },
    storageViewedMapCount: recordsToSync ? Object.keys(recordsToSync || {}).length : 0,
  } as any;

  const snapshot = {
    version: '2.1',
    extensionVersion: chrome.runtime.getManifest().version,
    timestamp: new Date().toISOString(),
    settings,
    data: recordsToSync,
    userProfile,
    actorRecords,
    logs,
    magnetPushLogs,
    importStats,
    newWorks: {
      subscriptions: newWorksSubscriptions,
      records: newWorksRecords,
      config: newWorksConfig,
    },
    idb: {
      viewedRecords: idbViewed,
      actors: idbActors,
      newWorks: idbNewWorks,
      magnets: idbMagnets,
      lists: idbLists,
      logs,
      magnetPushLogs,
    },
    storageAll,
    stats,
  } as any;

  options.logger?.('INFO', 'Prepared backup snapshot', {
    version: snapshot.version,
    storageViewedCount: stats.storageViewedMapCount,
    idbViewedCount: stats.idb.viewedRecords.count,
    idbActorsCount: stats.idb.actors.count,
    idbNewWorksCount: stats.idb.newWorks.count,
    idbMagnetsCount: stats.idb.magnets.count,
    idbListsCount: stats.idb.lists.count,
    logsCount: stats.idb.logs.count,
    magnetPushLogsCount: stats.idb.magnetPushLogs.count,
    storageKeys: stats.storage.keys,
  });

  return snapshot;
}
