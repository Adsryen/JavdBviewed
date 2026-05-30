import { logsBulkAdd as idbLogsBulkAdd, magnetPushLogsBulkAdd as idbMagnetPushLogsBulkAdd, initDB, logsClear as idbLogsClear } from '../../../platform/storage/indexedDb';
import { STORAGE_KEYS } from '../../../utils/config';
import { getSettings, saveSettings, setValue } from '../../../utils/storage';
import type { WebDAVClientLog } from '../infrastructure/webdavClient';
import { ensureWebDAVClientIdentity } from './clientIdentity';
import { sanitizeImportedSettings } from './importSanitizer';
import { parseBackupFromUrl, resolveWebDavUrl } from './restorePreview';
import { performWebDAVUpload } from './uploadService';

const RESTORE_BATCH_SIZE = 1000;
let restoreInProgress = false;

export interface LegacyRestoreOptions {
  restoreSettings: boolean;
  restoreRecords: boolean;
  restoreUserProfile: boolean;
  restoreActorRecords: boolean;
  restoreLogs: boolean;
  restoreMagnetPushLogs?: boolean;
  restoreImportStats: boolean;
  restoreIdb: boolean;
  preview: boolean;
}

export interface RestoreServiceOptions {
  logger?: WebDAVClientLog;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (!Array.isArray(arr) || size <= 0) return [arr as any];
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

export function toArrayFromObjMap<T = any>(maybeMap: any): T[] {
  if (!maybeMap) return [];
  if (Array.isArray(maybeMap)) return maybeMap as T[];
  if (typeof maybeMap === 'object') return Object.values(maybeMap) as T[];
  return [];
}

async function clearStore(db: any, storeName: string, logger?: WebDAVClientLog): Promise<void> {
  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    await tx.complete;
    logger?.('DEBUG', `Store cleared successfully: ${storeName}`);
  } catch (error: any) {
    logger?.('ERROR', `Failed to clear store: ${storeName}`, { error: error.message });
    throw error;
  }
}

async function putRecordsInBatches(db: any, storeName: string, records: any[], batchSize = RESTORE_BATCH_SIZE, logger?: WebDAVClientLog): Promise<number> {
  if (!Array.isArray(records) || records.length === 0) return 0;
  let written = 0;

  for (const part of chunk(records, batchSize)) {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const putPromises = part.map(record => store.put(record));
      await Promise.all(putPromises);
      await tx.complete;
      written += part.length;

      logger?.('DEBUG', `Batch write completed for ${storeName}`, {
        batchSize: part.length,
        totalWritten: written,
        remaining: records.length - written,
      });
    } catch (error: any) {
      logger?.('ERROR', `Batch write failed for ${storeName}`, {
        error: error.message,
        batchSize: part.length,
        written,
      });
      continue;
    }
  }

  return written;
}

async function getCurrentSettingsWithIdentity(): Promise<any> {
  return ensureWebDAVClientIdentity({ getSettings, saveSettings });
}

export async function applyImportDataDirect(importData: any, options?: {
  categories?: {
    settings?: boolean;
    userProfile?: boolean;
    viewed?: boolean;
    actors?: boolean;
    newWorks?: boolean;
    magnets?: boolean;
    logs?: boolean;
    magnetPushLogs?: boolean;
    importStats?: boolean;
  };
}, serviceOptions: RestoreServiceOptions = {}): Promise<{ success: boolean; error?: string; summary?: any }> {
  const logger = serviceOptions.logger;
  const defaults = {
    categories: {
      settings: true,
      userProfile: true,
      viewed: true,
      actors: true,
      newWorks: true,
      importStats: true,
      logs: false,
      magnetPushLogs: false,
      magnets: false,
    },
  } as const;
  const opts = {
    categories: { ...defaults.categories, ...(options?.categories || {}) },
  };

  if (restoreInProgress) return { success: false, error: '另一个恢复任务正在进行，请稍后再试' };
  restoreInProgress = true;
  const tStart = Date.now();
  const summary: any = { categories: {}, startedAt: new Date().toISOString() };
  try {
    const db = await initDB();
    const mark = (name: string, info: any) => { summary.categories[name] = info; };

    if (opts.categories.settings) {
      const c0 = Date.now();
      try {
        if (importData?.settings) {
          const currentSettings = await getCurrentSettingsWithIdentity();
          await saveSettings(sanitizeImportedSettings(importData.settings, currentSettings));
          mark('settings', { replaced: true, durationMs: Date.now() - c0 });
        } else {
          mark('settings', { replaced: false, reason: 'missing', durationMs: Date.now() - c0 });
        }
      } catch (e: any) {
        mark('settings', { replaced: false, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.userProfile) {
      const c0 = Date.now();
      try {
        const val = importData?.userProfile ?? importData?.storageAll?.[STORAGE_KEYS.USER_PROFILE];
        if (val != null) {
          await setValue(STORAGE_KEYS.USER_PROFILE, val);
          mark('userProfile', { replaced: true, durationMs: Date.now() - c0 });
        } else {
          mark('userProfile', { replaced: false, reason: 'missing', durationMs: Date.now() - c0 });
        }
      } catch (e: any) {
        mark('userProfile', { replaced: false, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.viewed) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.viewedRecords)) items = importData.idb.viewedRecords;
        else if (importData?.data) items = toArrayFromObjMap(importData.data);
        else if (importData?.viewed) items = toArrayFromObjMap(importData.viewed);
        else if (importData?.storageAll?.[STORAGE_KEYS.VIEWED_RECORDS]) items = toArrayFromObjMap(importData.storageAll[STORAGE_KEYS.VIEWED_RECORDS]);
        await clearStore(db, 'viewedRecords', logger);
        const written = await putRecordsInBatches(db, 'viewedRecords', items, RESTORE_BATCH_SIZE, logger);
        mark('viewed', { cleared: true, written, durationMs: Date.now() - c0 });
      } catch (e: any) {
        mark('viewed', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.actors) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.actors)) items = importData.idb.actors;
        else if (importData?.actorRecords) items = toArrayFromObjMap(importData.actorRecords);
        else if (importData?.storageAll?.[STORAGE_KEYS.ACTOR_RECORDS]) items = toArrayFromObjMap(importData.storageAll[STORAGE_KEYS.ACTOR_RECORDS]);
        await clearStore(db, 'actors', logger);
        const written = await putRecordsInBatches(db, 'actors', items, RESTORE_BATCH_SIZE, logger);
        mark('actors', { cleared: true, written, durationMs: Date.now() - c0 });
      } catch (e: any) {
        mark('actors', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.newWorks) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.newWorks)) items = importData.idb.newWorks;
        else if (importData?.newWorks?.records) items = toArrayFromObjMap(importData.newWorks.records);
        await clearStore(db, 'newWorks', logger);
        const written = await putRecordsInBatches(db, 'newWorks', items, RESTORE_BATCH_SIZE, logger);
        const subs = importData?.newWorks?.subscriptions ?? importData?.storageAll?.[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS];
        const recs = importData?.newWorks?.records ?? importData?.storageAll?.[STORAGE_KEYS.NEW_WORKS_RECORDS];
        const cfg = importData?.newWorks?.config ?? importData?.storageAll?.[STORAGE_KEYS.NEW_WORKS_CONFIG];
        if (subs != null) await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, subs);
        if (recs != null) await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, recs);
        if (cfg != null) await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, cfg);
        mark('newWorks', { cleared: true, written, durationMs: Date.now() - c0 });
      } catch (e: any) {
        mark('newWorks', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.magnets) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.magnets)) items = importData.idb.magnets;
        await clearStore(db, 'magnets', logger);
        const written = await putRecordsInBatches(db, 'magnets', items, RESTORE_BATCH_SIZE, logger);
        mark('magnets', { cleared: true, written, durationMs: Date.now() - c0 });
      } catch (e: any) {
        mark('magnets', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.logs) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.logs)) items = importData.idb.logs;
        else if (Array.isArray(importData?.logs)) items = importData.logs;
        try { await idbLogsClear(); } catch {}
        if (items.length > 0) { try { await idbLogsBulkAdd(items as any); } catch {} }
        mark('logs', { cleared: true, written: items.length, durationMs: Date.now() - c0 });
      } catch (e: any) {
        mark('logs', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.magnetPushLogs) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.magnetPushLogs)) items = importData.idb.magnetPushLogs;
        else if (Array.isArray(importData?.magnetPushLogs)) items = importData.magnetPushLogs;
        else if (Array.isArray(importData?.data?.magnetPushLogs)) items = importData.data.magnetPushLogs;
        try { await clearStore(db, 'magnetPushLogs', logger); } catch {}
        if (items.length > 0) { try { await idbMagnetPushLogsBulkAdd(items as any); } catch {} }
        mark('magnetPushLogs', { cleared: true, written: items.length, durationMs: Date.now() - c0 });
      } catch (e: any) {
        mark('magnetPushLogs', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    if (opts.categories.importStats) {
      const c0 = Date.now();
      const val = importData?.importStats ?? importData?.storageAll?.[STORAGE_KEYS.LAST_IMPORT_STATS];
      if (val != null) {
        await setValue(STORAGE_KEYS.LAST_IMPORT_STATS, val);
        mark('importStats', { replaced: true, durationMs: Date.now() - c0 });
      } else {
        mark('importStats', { replaced: false, reason: 'missing', durationMs: Date.now() - c0 });
      }
    }

    summary.totalDurationMs = Date.now() - tStart;
    return { success: true, summary };
  } catch (e: any) {
    return { success: false, error: e?.message, summary };
  } finally {
    restoreInProgress = false;
  }
}

export async function performRestoreUnified(filename: string, options?: {
  categories?: {
    settings?: boolean;
    userProfile?: boolean;
    viewed?: boolean;
    actors?: boolean;
    newWorks?: boolean;
    magnets?: boolean;
    logs?: boolean;
    magnetPushLogs?: boolean;
    importStats?: boolean;
  };
  autoBackupBeforeRestore?: boolean;
}, serviceOptions: RestoreServiceOptions = {}): Promise<{ success: boolean; error?: string; summary?: any }> {
  const logger = serviceOptions.logger;
  const defaults = {
    categories: {
      settings: true,
      userProfile: true,
      viewed: true,
      actors: true,
      newWorks: true,
      importStats: true,
      logs: false,
      magnetPushLogs: false,
      magnets: false,
    },
    autoBackupBeforeRestore: true,
  } as const;
  const opts = {
    categories: { ...defaults.categories, ...(options?.categories || {}) },
    autoBackupBeforeRestore: options?.autoBackupBeforeRestore ?? defaults.autoBackupBeforeRestore,
  };

  if (restoreInProgress) return { success: false, error: '另一个恢复任务正在进行，请稍后再试' };
  restoreInProgress = true;
  const tStart = Date.now();
  const summary: any = { categories: {}, startedAt: new Date().toISOString() };
  try {
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
      throw new Error('WebDAV 未启用或 URL 未配置');
    }
    const finalUrl = resolveWebDavUrl(filename, settings.webdav.url);
    if (opts.autoBackupBeforeRestore) {
      try { await performWebDAVUpload({ getSettings, saveSettings, logger }); } catch (e: any) { logger?.('WARN', 'Auto-backup before restore failed', { error: e?.message }); }
    }

    const importData = await parseBackupFromUrl(finalUrl, { username: settings.webdav.username, password: settings.webdav.password });
    restoreInProgress = false;
    const directResult = await applyImportDataDirect(importData, { categories: opts.categories }, serviceOptions);
    summary.categories = directResult.summary?.categories || {};
    summary.totalDurationMs = Date.now() - tStart;
    return directResult.success ? { success: true, summary } : { success: false, error: directResult.error, summary };
  } catch (e: any) {
    return { success: false, error: e?.message, summary };
  } finally {
    restoreInProgress = false;
  }
}

export async function performRestore(filename: string, options: LegacyRestoreOptions = {
  restoreSettings: true,
  restoreRecords: true,
  restoreUserProfile: true,
  restoreActorRecords: true,
  restoreLogs: false,
  restoreImportStats: false,
  restoreIdb: false,
  preview: false,
}, serviceOptions: RestoreServiceOptions = {}): Promise<{ success: boolean; error?: string; data?: any }> {
  const logger = serviceOptions.logger;
  logger?.('INFO', 'Attempting to restore from WebDAV.', { filename, options });
  const settings = await getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) {
    const errorMsg = 'WebDAV is not enabled or URL is not configured.';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const finalUrl = resolveWebDavUrl(filename, settings.webdav.url);
    logger?.('INFO', `Attempting to restore from WebDAV URL: ${finalUrl}`);
    const importData = await parseBackupFromUrl(finalUrl, { username: settings.webdav.username, password: settings.webdav.password });

    logger?.('INFO', 'Parsed backup data', {
      hasSettings: !!importData.settings,
      hasData: !!importData.data,
      hasUserProfile: !!importData.userProfile,
      hasActorRecords: !!importData.actorRecords,
      hasLogs: !!importData.logs,
      hasImportStats: !!importData.importStats,
      hasNewWorks: !!importData.newWorks,
      version: importData.version || '1.0',
      preview: options.preview,
    });

    if (options.preview) {
      return {
        success: true,
        data: {
          version: importData.version || '1.0',
          timestamp: importData.timestamp,
          settings: importData.settings || null,
          data: importData.data || importData.viewed || null,
          viewed: importData.viewed || null,
          userProfile: importData.userProfile || null,
          actorRecords: importData.actorRecords || null,
          logs: importData.logs || null,
          importStats: importData.importStats || null,
          newWorks: importData.newWorks || null,
        },
      };
    }

    if (importData.settings && options.restoreSettings) {
      const currentSettings = await getCurrentSettingsWithIdentity();
      await saveSettings(sanitizeImportedSettings(importData.settings, currentSettings));
      logger?.('INFO', 'Restored settings');
    }
    if (importData.data && options.restoreRecords) {
      await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
      logger?.('INFO', 'Restored video records');
    } else if (options.restoreRecords) {
      await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
      logger?.('INFO', 'Restored video records (legacy format)');
    }
    if (importData.userProfile && options.restoreUserProfile) {
      await setValue(STORAGE_KEYS.USER_PROFILE, importData.userProfile);
      logger?.('INFO', 'Restored user profile');
    }
    if (importData.actorRecords && options.restoreActorRecords) {
      await setValue(STORAGE_KEYS.ACTOR_RECORDS, importData.actorRecords);
      logger?.('INFO', 'Restored actor records');
    }
    if (importData.importStats && options.restoreImportStats) {
      await setValue(STORAGE_KEYS.LAST_IMPORT_STATS, importData.importStats);
      logger?.('INFO', 'Restored import stats');
    }
    if (importData.newWorks) {
      if (importData.newWorks.subscriptions) await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, importData.newWorks.subscriptions);
      if (importData.newWorks.records) await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, importData.newWorks.records);
      if (importData.newWorks.config) await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, importData.newWorks.config);
      logger?.('INFO', 'Restored new works data');
    }
    if (importData.logs && options.restoreLogs) {
      try {
        await idbLogsBulkAdd(importData.logs);
        logger?.('INFO', 'Restored logs to IDB', { count: importData.logs.length });
      } catch (e: any) {
        logger?.('WARN', 'Failed to restore logs to IDB', { error: e?.message });
      }
    }
    if ((importData.magnetPushLogs || importData.data?.magnetPushLogs) && options.restoreMagnetPushLogs) {
      const mpLogs = importData.magnetPushLogs || importData.data?.magnetPushLogs || [];
      try {
        await idbMagnetPushLogsBulkAdd(mpLogs);
        logger?.('INFO', 'Restored magnet push logs to IDB', { count: mpLogs.length });
      } catch (e: any) {
        logger?.('WARN', 'Failed to restore magnet push logs to IDB', { error: e?.message });
      }
    }
    if (options.restoreIdb && importData.idb) {
      try {
        const db = await initDB();
        if (Array.isArray(importData.idb.viewedRecords)) {
          const tx = db.transaction('viewedRecords', 'readwrite');
          for (const r of importData.idb.viewedRecords) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          logger?.('INFO', 'Restored IDB viewedRecords', { count: importData.idb.viewedRecords.length });
        }
        if (Array.isArray(importData.idb.actors)) {
          const tx = db.transaction('actors', 'readwrite');
          for (const r of importData.idb.actors) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          logger?.('INFO', 'Restored IDB actors', { count: importData.idb.actors.length });
        }
        if (Array.isArray(importData.idb.newWorks)) {
          const tx = db.transaction('newWorks', 'readwrite');
          for (const r of importData.idb.newWorks) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          logger?.('INFO', 'Restored IDB newWorks', { count: importData.idb.newWorks.length });
        }
        if (Array.isArray(importData.idb.magnets)) {
          const tx = db.transaction('magnets', 'readwrite');
          for (const r of importData.idb.magnets) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          logger?.('INFO', 'Restored IDB magnets', { count: importData.idb.magnets.length });
        }
      } catch (e: any) {
        logger?.('WARN', 'IDB restore encountered an error', { error: e?.message });
      }
    }
    return { success: true };
  } catch (error: any) {
    logger?.('ERROR', 'Failed to restore from WebDAV.', { error: error.message, filename });
    return { success: false, error: error.message };
  }
}
