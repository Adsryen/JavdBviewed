import { logsBulkAdd as idbLogsBulkAdd, magnetPushLogsBulkAdd as idbMagnetPushLogsBulkAdd, initDB, logsClear as idbLogsClear, viewedReplaceAll as idbViewedReplaceAll } from '../../../platform/storage/indexedDb';
import { STORAGE_KEYS } from '../../../utils/config';
import { getSettings, saveSettings, setValue } from '../../../utils/storage';
import type { WebDAVClientLog } from '../infrastructure/webdavClient';
import { ensureWebDAVClientIdentity } from './clientIdentity';
import { sanitizeImportedSettings } from './importSanitizer';
import { parseBackupFromUrl, resolveWebDavUrl } from './restorePreview';
import {
  RESTORE_BATCH_SIZE,
  clearStore,
  putRecordsInBatches,
  toArrayFromObjMap,
} from './restoreStorage';
import { performWebDAVUpload } from './uploadService';

let restoreInProgress = false;

export interface RestoreServiceOptions {
  logger?: WebDAVClientLog;
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
        const written = await idbViewedReplaceAll(items);
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
