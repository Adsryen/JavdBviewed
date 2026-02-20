// src/background/webdav.ts
// 抽离 WebDAV 相关功能与消息路由

import JSZip from 'jszip';
import { getSettings, setValue, getValue, saveSettings } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import { quickDiagnose, type DiagnosticResult } from '../utils/webdavDiagnostic';
import { logsGetAll as idbLogsGetAll, logsBulkAdd as idbLogsBulkAdd, initDB, logsClear as idbLogsClear } from './db';

// 背景日志封装：转发到 background 的 log-message 处理
function bgLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): void {
  try { chrome.runtime.sendMessage({ type: 'log-message', payload: { level, message, data } }); } catch {}
}

// 计算对象序列化后的字节大小（UTF-8）
function byteSizeOf(value: any): number {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return new TextEncoder().encode(s).length;
  } catch {
    return 0;
  }
}

let webdavAutoUploadInProgress = false;

export async function triggerWebDAVAutoUpload(): Promise<void> {
  if (webdavAutoUploadInProgress) return;
  webdavAutoUploadInProgress = true;
  try {
    const settings = await getSettings();
    const webdav = settings?.webdav as any;
    if (!webdav?.enabled || !webdav?.autoSync) return;
    if (!webdav?.url || !webdav?.username || !webdav?.password) return;
    await performUpload();
  } finally {
    webdavAutoUploadInProgress = false;
  }
}

// ----- 恢复相关工具函数与常量 -----
const RESTORE_BATCH_SIZE = 1000; // 默认批量写入大小
let restoreInProgress = false;   // 简单并发锁，避免并发恢复

function chunk<T>(arr: T[], size: number): T[][] {
  if (!Array.isArray(arr) || size <= 0) return [arr as any];
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function resolveWebDavUrl(filename: string, webdavBaseUrl: string): string {
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  if (filename.startsWith('/')) {
    const origin = new URL(webdavBaseUrl).origin;
    return new URL(filename, origin).href;
  }
  let base = webdavBaseUrl;
  if (!base.endsWith('/')) base += '/';
  return new URL(filename, base).href;
}

async function parseBackupFromUrl(finalUrl: string, auth: { username: string; password: string }): Promise<any> {
  const response = await fetch(finalUrl, {
    method: 'GET',
    headers: { Authorization: 'Basic ' + btoa(`${auth.username}:${auth.password}`) },
  });
  if (!response.ok) throw new Error(`Download failed with status: ${response.status}`);
  const isZip = /\.zip$/i.test(finalUrl);
  if (isZip) {
    const arrayBuf = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuf);
    const jsonFile = zip.file('backup.json') || zip.file(/\.json$/i)[0];
    if (!jsonFile) throw new Error('ZIP 中未找到 JSON 备份文件');
    const jsonText = await jsonFile.async('text');
    return JSON.parse(jsonText);
  } else {
    const fileContents = await response.text();
    return JSON.parse(fileContents);
  }
}

function toArrayFromObjMap<T = any>(maybeMap: any): T[] {
  if (!maybeMap) return [];
  if (Array.isArray(maybeMap)) return maybeMap as T[];
  if (typeof maybeMap === 'object') return Object.values(maybeMap) as T[];
  return [];
}

async function clearStore(db: any, storeName: string): Promise<void> {
  try { 
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    await tx.complete;
    bgLog('DEBUG', `Store cleared successfully: ${storeName}`);
  } catch (error: any) {
    bgLog('ERROR', `Failed to clear store: ${storeName}`, { error: error.message });
    throw error;
  }
}

async function putRecordsInBatches(db: any, storeName: string, records: any[], batchSize = RESTORE_BATCH_SIZE): Promise<number> {
  if (!Array.isArray(records) || records.length === 0) return 0;
  let written = 0;
  
  // 按批次处理，每批次开启独立的事务
  for (const part of chunk(records, batchSize)) {
    try {
      // 为每个批次开启新的 readwrite 事务
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // 批量写入当前批次的记录
      const putPromises = part.map(record => store.put(record));
      await Promise.all(putPromises);
      
      // 等待事务完成
      await tx.complete;
      written += part.length;
      
      bgLog('DEBUG', `Batch write completed for ${storeName}`, { 
        batchSize: part.length, 
        totalWritten: written,
        remaining: records.length - written
      });
      
    } catch (error: any) {
      bgLog('ERROR', `Batch write failed for ${storeName}`, { 
        error: error.message, 
        batchSize: part.length,
        written 
      });
      // 继续处理下一批次，不中断整个恢复流程
      continue;
    }
  }
  
  return written;
}

async function previewBackup(filename: string): Promise<{ success: boolean; error?: string; preview?: any; raw?: any }> {
  try {
    const settings = await getSettings();
    const finalUrl = resolveWebDavUrl(filename, settings.webdav.url);
    const importData = await parseBackupFromUrl(finalUrl, { username: settings.webdav.username, password: settings.webdav.password });
    const stats = (importData && importData.stats) || {};
    const preview = {
      version: importData?.version || '1.0',
      timestamp: importData?.timestamp || null,
      counts: {
        viewed: (stats?.idb?.viewedRecords?.count) ?? (Array.isArray(importData?.idb?.viewedRecords) ? importData.idb.viewedRecords.length : Object.keys(importData?.data || importData?.viewed || {}).length),
        actors: (stats?.idb?.actors?.count) ?? (Array.isArray(importData?.idb?.actors) ? importData.idb.actors.length : Object.keys(importData?.actorRecords || {}).length),
        newWorks: (stats?.idb?.newWorks?.count) ?? (Array.isArray(importData?.idb?.newWorks) ? importData.idb.newWorks.length : Object.keys(importData?.newWorks?.records || {}).length),
        magnets: (stats?.idb?.magnets?.count) ?? (Array.isArray(importData?.idb?.magnets) ? importData.idb.magnets.length : 0),
        logs: (stats?.idb?.logs?.count) ?? (Array.isArray(importData?.idb?.logs) ? importData.idb.logs.length : Array.isArray(importData?.logs) ? importData.logs.length : 0),
      },
      bytes: {
        settings: byteSizeOf(importData?.settings),
        userProfile: byteSizeOf(importData?.userProfile),
        viewed: byteSizeOf(importData?.idb?.viewedRecords || importData?.data || importData?.viewed),
        actors: byteSizeOf(importData?.idb?.actors || importData?.actorRecords),
        newWorks: byteSizeOf(importData?.idb?.newWorks || importData?.newWorks),
        magnets: byteSizeOf(importData?.idb?.magnets),
        logs: byteSizeOf(importData?.idb?.logs || importData?.logs),
        importStats: byteSizeOf(importData?.importStats),
      },
      storageKeys: stats?.storage?.keys ?? (importData?.storageAll ? Object.keys(importData.storageAll).length : undefined),
    };
    return { success: true, preview, raw: importData };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

// 汇总备份所需的所有数据（包含 chrome.storage.local 与 IndexedDB 快照），并产出统计信息
async function collectBackupData(): Promise<any> {
  const settings = await getSettings();

  // 优先读取 storage 中的关键键（用于兼容旧版恢复逻辑）
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

  // 日志优先从 IDB 导出，失败则回退至 storage
  const logs = await idbLogsGetAll().catch(async () => await getValue(STORAGE_KEYS.LOGS, []));

  // 读取 IndexedDB 中的所有相关表
  let idbViewed: any[] = [];
  let idbActors: any[] = [];
  let idbNewWorks: any[] = [];
  let idbMagnets: any[] = [];
  try {
    const db = await initDB();
    try { idbViewed = await db.getAll('viewedRecords'); } catch {}
    try { idbActors = await db.getAll('actors'); } catch {}
    try { idbNewWorks = await db.getAll('newWorks'); } catch {}
    try { idbMagnets = await db.getAll('magnets'); } catch {}
  } catch {}

  // 统计 storage 键的体积（Top-N 用于日志参考，不纳入备份数据本体）
  let storageKeysCount = 0;
  let topStorageKeysByBytes: Array<{ key: string; bytes: number }> = [];
  let storageAll: Record<string, any> | null = null;
  try {
    const all = await new Promise<Record<string, any>>((resolve) => {
      try { chrome.storage.local.get(null, (res) => resolve(res || {})); } catch { resolve({}); }
    });
    const entries = Object.entries(all);
    storageKeysCount = entries.length;
    topStorageKeysByBytes = entries
      .map(([k, v]) => ({ key: k, bytes: byteSizeOf(v) }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 50);
    storageAll = all;
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
        importStats: byteSizeOf(importStats),
      },
      topKeysBySize: topStorageKeysByBytes,
    },
    idb: {
      viewedRecords: { count: Array.isArray(idbViewed) ? idbViewed.length : 0 },
      actors: { count: Array.isArray(idbActors) ? idbActors.length : 0 },
      newWorks: { count: Array.isArray(idbNewWorks) ? idbNewWorks.length : 0 },
      magnets: { count: Array.isArray(idbMagnets) ? idbMagnets.length : 0 },
      logs: { count: Array.isArray(logs) ? logs.length : 0 },
    },
    storageViewedMapCount: recordsToSync ? Object.keys(recordsToSync || {}).length : 0,
  } as any;

  const snapshot = {
    version: '2.1',
    timestamp: new Date().toISOString(),
    // 兼容旧版字段（优先从 storage 读取）
    settings,
    data: recordsToSync,
    userProfile,
    actorRecords,
    logs,
    importStats,
    newWorks: {
      subscriptions: newWorksSubscriptions,
      records: newWorksRecords,
      config: newWorksConfig,
    },
    // 新增：完整 IDB 快照（用于“全量备份”）
    idb: {
      viewedRecords: idbViewed,
      actors: idbActors,
      newWorks: idbNewWorks,
      magnets: idbMagnets,
      logs,
    },
    // 新增：完整 storage 快照（全量备份），包含所有键值
    storageAll,
    // 新增：统计信息（仅用于诊断与日志）
    stats,
  } as any;

  bgLog('INFO', 'Prepared backup snapshot', {
    version: snapshot.version,
    storageViewedCount: stats.storageViewedMapCount,
    idbViewedCount: stats.idb.viewedRecords.count,
    idbActorsCount: stats.idb.actors.count,
    idbNewWorksCount: stats.idb.newWorks.count,
    idbMagnetsCount: stats.idb.magnets.count,
    logsCount: stats.idb.logs.count,
    storageKeys: stats.storage.keys,
  });

  return snapshot;
}

interface WebDAVFile {
  name: string;
  path: string;
  lastModified: string;
  isDirectory: boolean;
  size?: number;
}

/**
 * 确保 WebDAV 目录存在，如果不存在则尝试创建
 */
async function ensureWebDAVDirectoryExists(dirUrl: string, username: string, password: string): Promise<void> {
  try {
    // 先检查目录是否存在
    const checkResponse = await fetch(dirUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: 'Basic ' + btoa(`${username}:${password}`),
        Depth: '0',
      },
    });

    // 如果目录存在，直接返回
    if (checkResponse.ok) {
      bgLog('DEBUG', 'WebDAV directory exists', { dirUrl });
      return;
    }

    // 如果是 404，尝试创建目录
    if (checkResponse.status === 404) {
      bgLog('INFO', 'WebDAV directory not found, attempting to create', { dirUrl });
      
      // 解析 URL，逐级创建目录
      const url = new URL(dirUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      
      // 从根路径开始，逐级检查和创建目录
      let currentPath = '';
      for (const part of pathParts) {
        currentPath += '/' + part;
        const currentUrl = `${url.origin}${currentPath}/`;
        
        // 检查当前路径是否存在
        const existsResponse = await fetch(currentUrl, {
          method: 'PROPFIND',
          headers: {
            Authorization: 'Basic ' + btoa(`${username}:${password}`),
            Depth: '0',
          },
        });

        // 如果不存在，创建目录
        if (existsResponse.status === 404) {
          const mkcolResponse = await fetch(currentUrl, {
            method: 'MKCOL',
            headers: {
              Authorization: 'Basic ' + btoa(`${username}:${password}`),
            },
          });

          if (mkcolResponse.ok || mkcolResponse.status === 201) {
            bgLog('INFO', 'Created WebDAV directory', { path: currentUrl });
          } else if (mkcolResponse.status === 405) {
            // 405 Method Not Allowed 可能表示目录已存在
            bgLog('DEBUG', 'Directory might already exist (405)', { path: currentUrl });
          } else {
            bgLog('WARN', 'Failed to create directory', { 
              path: currentUrl, 
              status: mkcolResponse.status 
            });
          }
        }
      }
      
      bgLog('INFO', 'WebDAV directory structure ensured', { dirUrl });
    } else {
      bgLog('WARN', 'Unexpected response when checking directory', { 
        dirUrl, 
        status: checkResponse.status 
      });
    }
  } catch (error: any) {
    bgLog('ERROR', 'Failed to ensure WebDAV directory exists', { 
      dirUrl, 
      error: error.message 
    });
    throw error;
  }
}

async function performUpload(): Promise<{ success: boolean; error?: string }> {
  bgLog('INFO', 'Attempting to perform WebDAV upload.');
  const settings = await getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) {
    const errorMsg = 'WebDAV is not enabled or URL is not configured.';
    bgLog('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const dataToExport = await collectBackupData();

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const filename = `javdb-extension-backup-${date}-${hour}-${minute}-${second}.zip`;

    let fileUrl = settings.webdav.url;
    if (!fileUrl.endsWith('/')) fileUrl += '/';
    
    // 确保目录存在
    try {
      await ensureWebDAVDirectoryExists(fileUrl, settings.webdav.username, settings.webdav.password);
    } catch (dirError: any) {
      bgLog('WARN', 'Failed to ensure directory exists, will try upload anyway', { error: dirError.message });
    }
    
    fileUrl += filename.startsWith('/') ? filename.substring(1) : filename;

    const zip = new JSZip();
    const backupJson = JSON.stringify(dataToExport, null, 2);
    const backupJsonBytes = byteSizeOf(backupJson);
    zip.file('backup.json', backupJson);
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    try { bgLog('INFO', 'Backup package prepared', { jsonBytes: backupJsonBytes, zipBytes: (zipBlob as any)?.size }); } catch {}
    try { bgLog('DEBUG', 'Backup stats summary', (dataToExport as any)?.stats || {}); } catch {}

    bgLog('INFO', `Uploading to ${fileUrl}`, { zipBytes: (zipBlob as any)?.size });
    const response = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });
    if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);

    const updatedSettings = await getSettings();
    updatedSettings.webdav.lastSync = new Date().toISOString();
    
    // 同时更新当前激活配置的 lastSync
    const activeConfigId = updatedSettings.webdav.activeConfigId;
    if (activeConfigId && updatedSettings.webdav.configs) {
      const configIndex = updatedSettings.webdav.configs.findIndex(c => c.id === activeConfigId);
      if (configIndex !== -1) {
        updatedSettings.webdav.configs[configIndex].lastSync = updatedSettings.webdav.lastSync;
      }
    }
    
    await saveSettings(updatedSettings);
    bgLog('INFO', 'WebDAV upload successful, updated last sync time.');

    try {
      const retentionDays = Number(updatedSettings.webdav.retentionDays ?? 7);
      if (!isNaN(retentionDays) && retentionDays > 0) {
        await cleanupOldBackups(retentionDays);
      }
    } catch (e: any) {
      bgLog('WARN', 'Failed to cleanup old WebDAV backups', { error: e?.message });
    }

    return { success: true };
  } catch (error: any) {
    bgLog('ERROR', 'WebDAV upload failed.', { error: error.message });
    return { success: false, error: error.message };
  }
}

// 统一恢复（替换语义，不合并）
async function performRestoreUnified(filename: string, options?: {
  categories?: {
    settings?: boolean;
    userProfile?: boolean;
    viewed?: boolean;
    actors?: boolean;
    newWorks?: boolean;
    magnets?: boolean;
    logs?: boolean;
    importStats?: boolean;
  };
  autoBackupBeforeRestore?: boolean;
}): Promise<{ success: boolean; error?: string; summary?: any }> {
  const defaults = {
    categories: {
      settings: true,
      userProfile: true,
      viewed: true,
      actors: true,
      newWorks: true,
      importStats: true,
      logs: false,
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
    // 恢复前自动备份
    if (opts.autoBackupBeforeRestore) {
      try { await performUpload(); } catch (e: any) { bgLog('WARN', 'Auto-backup before restore failed', { error: e?.message }); }
    }

    const importData = await parseBackupFromUrl(finalUrl, { username: settings.webdav.username, password: settings.webdav.password });
    const db = await initDB();

    // 工具：记录类别摘要
    const mark = (name: string, info: any) => { summary.categories[name] = info; };

    // 1) 设置
    if (opts.categories.settings) {
      const c0 = Date.now();
      try {
        if (importData?.settings) {
          await saveSettings(importData.settings);
          mark('settings', { replaced: true, durationMs: Date.now() - c0 });
        } else {
          mark('settings', { replaced: false, reason: 'missing', durationMs: Date.now() - c0 });
        }
      } catch (e: any) {
        bgLog('ERROR', 'Settings restore failed', { error: e?.message });
        mark('settings', { replaced: false, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    // 2) 用户资料
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
        bgLog('ERROR', 'UserProfile restore failed', { error: e?.message });
        mark('userProfile', { replaced: false, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    // 3) 观看记录（IDB viewedRecords）
    if (opts.categories.viewed) {
      const c0 = Date.now();
      try {
        let items: any[] = [];
        if (Array.isArray(importData?.idb?.viewedRecords)) items = importData.idb.viewedRecords;
        else if (importData?.data) items = toArrayFromObjMap(importData.data);
        else if (importData?.viewed) items = toArrayFromObjMap(importData.viewed);
        else if (importData?.storageAll?.[STORAGE_KEYS.VIEWED_RECORDS]) items = toArrayFromObjMap(importData.storageAll[STORAGE_KEYS.VIEWED_RECORDS]);
        await clearStore(db, 'viewedRecords');
        const written = await putRecordsInBatches(db, 'viewedRecords', items);
        mark('viewed', { cleared: true, written, durationMs: Date.now() - c0 });
      } catch (e: any) {
        bgLog('ERROR', 'Viewed records restore failed', { error: e?.message });
        mark('viewed', { cleared: false, written: 0, reason: 'error', error: e?.message, durationMs: Date.now() - c0 });
      }
    }

    // 4) 演员（IDB actors）
    if (opts.categories.actors) {
      const c0 = Date.now();
      let items: any[] = [];
      if (Array.isArray(importData?.idb?.actors)) items = importData.idb.actors;
      else if (importData?.actorRecords) items = toArrayFromObjMap(importData.actorRecords);
      else if (importData?.storageAll?.[STORAGE_KEYS.ACTOR_RECORDS]) items = toArrayFromObjMap(importData.storageAll[STORAGE_KEYS.ACTOR_RECORDS]);
      await clearStore(db, 'actors');
      const written = await putRecordsInBatches(db, 'actors', items);
      mark('actors', { cleared: true, written, durationMs: Date.now() - c0 });
    }

    // 5) 新作品（IDB newWorks + storage 三键）
    if (opts.categories.newWorks) {
      const c0 = Date.now();
      let items: any[] = [];
      if (Array.isArray(importData?.idb?.newWorks)) items = importData.idb.newWorks;
      else if (importData?.newWorks?.records) items = toArrayFromObjMap(importData.newWorks.records);
      await clearStore(db, 'newWorks');
      const written = await putRecordsInBatches(db, 'newWorks', items);
      const subs = importData?.newWorks?.subscriptions ?? importData?.storageAll?.[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS];
      const recs = importData?.newWorks?.records ?? importData?.storageAll?.[STORAGE_KEYS.NEW_WORKS_RECORDS];
      const cfg = importData?.newWorks?.config ?? importData?.storageAll?.[STORAGE_KEYS.NEW_WORKS_CONFIG];
      if (subs != null) await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, subs);
      if (recs != null) await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, recs);
      if (cfg != null) await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, cfg);
      mark('newWorks', { cleared: true, written, hasSubs: subs != null, hasRecords: recs != null, hasConfig: cfg != null, durationMs: Date.now() - c0 });
    }

    // 6) 磁链缓存（IDB magnets）
    if (opts.categories.magnets) {
      const c0 = Date.now();
      let items: any[] = [];
      if (Array.isArray(importData?.idb?.magnets)) items = importData.idb.magnets;
      await clearStore(db, 'magnets');
      const written = await putRecordsInBatches(db, 'magnets', items);
      mark('magnets', { cleared: true, written, durationMs: Date.now() - c0 });
    }

    // 7) 日志（IDB logs）
    if (opts.categories.logs) {
      const c0 = Date.now();
      let items: any[] = [];
      if (Array.isArray(importData?.idb?.logs)) items = importData.idb.logs;
      else if (Array.isArray(importData?.logs)) items = importData.logs;
      try { await idbLogsClear(); } catch {}
      if (items.length > 0) {
        try { await idbLogsBulkAdd(items as any); } catch (e: any) {
          // 极端情况下写入失败不阻断整体
          bgLog('WARN', 'IDB logs restore failed', { error: e?.message, count: items.length });
        }
      }
      mark('logs', { cleared: true, written: items.length, durationMs: Date.now() - c0 });
    }

    // 8) 导入统计（storage）
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

async function performRestore(filename: string, options = {
  restoreSettings: true,
  restoreRecords: true,
  restoreUserProfile: true,
  restoreActorRecords: true,
  restoreLogs: false,
  restoreImportStats: false,
  restoreIdb: false,
  preview: false,
}): Promise<{ success: boolean; error?: string; data?: any }> {
  bgLog('INFO', 'Attempting to restore from WebDAV.', { filename, options });
  const settings = await getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) {
    const errorMsg = 'WebDAV is not enabled or URL is not configured.';
    bgLog('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    let finalUrl: string;
    const webdavBaseUrl = settings.webdav.url;
    if (filename.startsWith('http://') || filename.startsWith('https://')) finalUrl = filename;
    else if (filename.startsWith('/')) {
      const origin = new URL(webdavBaseUrl).origin;
      finalUrl = new URL(filename, origin).href;
    } else {
      let base = webdavBaseUrl;
      if (!base.endsWith('/')) base += '/';
      finalUrl = new URL(filename, base).href;
    }

    bgLog('INFO', `Attempting to restore from WebDAV URL: ${finalUrl}`);
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: { Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`) },
    });
    if (!response.ok) throw new Error(`Download failed with status: ${response.status}`);

    const isZip = /\.zip$/i.test(finalUrl);
    let importData: any;
    if (isZip) {
      const arrayBuf = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuf);
      const jsonFile = zip.file('backup.json') || zip.file(/\.json$/i)[0];
      if (!jsonFile) throw new Error('ZIP 中未找到 JSON 备份文件');
      const jsonText = await jsonFile.async('text');
      importData = JSON.parse(jsonText);
    } else {
      const fileContents = await response.text();
      importData = JSON.parse(fileContents);
    }

    bgLog('INFO', 'Parsed backup data', {
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
      await saveSettings(importData.settings);
      bgLog('INFO', 'Restored settings');
    }
    if (importData.data && options.restoreRecords) {
      await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
      bgLog('INFO', 'Restored video records');
    } else if (options.restoreRecords) {
      await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
      bgLog('INFO', 'Restored video records (legacy format)');
    }
    if (importData.userProfile && options.restoreUserProfile) {
      await setValue(STORAGE_KEYS.USER_PROFILE, importData.userProfile);
      bgLog('INFO', 'Restored user profile');
    }
    if (importData.actorRecords && options.restoreActorRecords) {
      await setValue(STORAGE_KEYS.ACTOR_RECORDS, importData.actorRecords);
      bgLog('INFO', 'Restored actor records', { actorCount: Object.keys(importData.actorRecords).length });
    }
    if (importData.logs && options.restoreLogs) {
      try {
        await idbLogsBulkAdd(importData.logs);
        bgLog('INFO', 'Restored logs to IDB', { logCount: Array.isArray(importData.logs) ? importData.logs.length : 0 });
      } catch (e: any) {
        // 回退到 storage（极端情况下）
        await setValue(STORAGE_KEYS.LOGS, importData.logs);
        bgLog('WARN', 'IDB logs restore failed, fallback to storage', { error: e?.message });
      }
    }
    if (importData.importStats && options.restoreImportStats) {
      await setValue(STORAGE_KEYS.LAST_IMPORT_STATS, importData.importStats);
      bgLog('INFO', 'Restored import statistics');
    }
    if (importData.newWorks) {
      if (importData.newWorks.subscriptions) await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, importData.newWorks.subscriptions);
      if (importData.newWorks.records) await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, importData.newWorks.records);
      if (importData.newWorks.config) await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, importData.newWorks.config);
      bgLog('INFO', 'Restored new works data');
    }
    // 可选：恢复备份中的 IDB 快照（默认关闭，仅当 options.restoreIdb=true 时执行）
    if (importData.idb && options.restoreIdb) {
      try {
        const db = await initDB();
        // viewedRecords
        if (Array.isArray(importData.idb.viewedRecords)) {
          const tx = db.transaction('viewedRecords', 'readwrite');
          for (const r of importData.idb.viewedRecords) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          bgLog('INFO', 'Restored IDB viewedRecords', { count: importData.idb.viewedRecords.length });
        }
        // actors
        if (Array.isArray(importData.idb.actors)) {
          const tx = db.transaction('actors', 'readwrite');
          for (const r of importData.idb.actors) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          bgLog('INFO', 'Restored IDB actors', { count: importData.idb.actors.length });
        }
        // newWorks
        if (Array.isArray(importData.idb.newWorks)) {
          const tx = db.transaction('newWorks', 'readwrite');
          for (const r of importData.idb.newWorks) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          bgLog('INFO', 'Restored IDB newWorks', { count: importData.idb.newWorks.length });
        }
        // magnets（可能较大）
        if (Array.isArray(importData.idb.magnets)) {
          const tx = db.transaction('magnets', 'readwrite');
          for (const r of importData.idb.magnets) { try { await tx.store.put(r); } catch {} }
          try { await tx.done; } catch {}
          bgLog('INFO', 'Restored IDB magnets', { count: importData.idb.magnets.length });
        }
      } catch (e: any) {
        bgLog('WARN', 'IDB restore encountered an error', { error: e?.message });
      }
    }
    return { success: true };
  } catch (error: any) {
    bgLog('ERROR', 'Failed to restore from WebDAV.', { error: error.message, filename });
    return { success: false, error: error.message };
  }
}

async function listFiles(): Promise<{ success: boolean; error?: string; files?: WebDAVFile[] }> {
  bgLog('INFO', 'Attempting to list files from WebDAV.');
  const settings = await getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) {
    const errorMsg = 'WebDAV is not enabled or URL is not configured.';
    bgLog('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    let url = settings.webdav.url;
    if (!url.endsWith('/')) url += '/';
    bgLog('INFO', `Sending PROPFIND request to: ${url}`);
    const headers: Record<string, string> = {
      Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
      Depth: '1',
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'JavDB-Extension/1.0',
    };
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>\n<D:propfind xmlns:D="DAV:">\n    <D:allprop/>\n</D:propfind>`;
    const response = await fetch(url, { method: 'PROPFIND', headers, body: xmlBody });
    bgLog('INFO', `WebDAV response status: ${response.status} ${response.statusText}`);
    const __headersObj: Record<string, string> = {};
    try { response.headers.forEach((value, key) => { __headersObj[key] = value; }); } catch {}
    bgLog('DEBUG', 'WebDAV response headers:', __headersObj);
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 401) errorDetail += ' - 认证失败，请检查用户名和密码';
      else if (response.status === 403) errorDetail += ' - 访问被拒绝，请检查权限设置';
      else if (response.status === 404) errorDetail += ' - 路径不存在，请检查WebDAV URL';
      else if (response.status === 405) errorDetail += ' - 服务器不支持PROPFIND方法';
      else if (response.status >= 500) errorDetail += ' - 服务器内部错误';
      throw new Error(errorDetail);
    }
    const text = await response.text();
    bgLog('DEBUG', 'Received WebDAV PROPFIND response:', {
      responseLength: text.length,
      responsePreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    });
    if (!text || text.trim().length === 0) throw new Error('服务器返回空响应');

    const files = parseWebDAVResponse(text);
    bgLog('INFO', `Successfully parsed ${files.length} files from WebDAV response`);
    bgLog('DEBUG', 'Parsed WebDAV files:', { files });
    if (files.length === 0) bgLog('WARN', 'No backup files found in WebDAV response. This might be normal if no backups exist yet.');

    return { success: true, files };
  } catch (error: any) {
    bgLog('ERROR', 'Failed to list WebDAV files.', {
      error: error.message,
      url: (await getSettings()).webdav.url,
      username: (await getSettings()).webdav.username ? '[CONFIGURED]' : '[NOT SET]',
    });
    return { success: false, error: error.message };
  }
}

async function cleanupOldBackups(retentionDays: number): Promise<void> {
  const settings = await getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) return;
  try {
    const result = await listFiles();
    if (!result.success || !result.files || result.files.length === 0) return;
    const files = result.files
      .filter((f) => f.name.includes('javdb-extension-backup-') && (f.name.endsWith('.json') || f.name.endsWith('.zip')))
      .sort((a, b) => (a.name > b.name ? -1 : 1));
    const nowMs = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    for (const file of files) {
      let fileTime = 0;
      if (file.lastModified && file.lastModified !== 'N/A') {
        const parsed = Date.parse(file.lastModified);
        if (!isNaN(parsed)) fileTime = parsed;
      }
      if (!fileTime) {
        const match = file.name.match(/javdb-extension-backup-(\d{4}-\d{2}-\d{2})(?:-(\d{2})-(\d{2})-(\d{2}))?\.(json|zip)$/);
        if (match) {
          const datePart = match[1];
          const h = match[2] || '00';
          const m = match[3] || '00';
          const s = match[4] || '00';
          const iso = `${datePart}T${h}:${m}:${s}Z`;
          const parsed = Date.parse(iso);
          if (!isNaN(parsed)) fileTime = parsed;
        }
      }
      if (!fileTime) continue;
      const ageMs = nowMs - fileTime;
      if (ageMs > maxAgeMs) {
        try {
          let base = settings.webdav.url;
          if (!base.endsWith('/')) base += '/';
          const fileUrl = new URL(file.path.startsWith('/') ? file.path.substring(1) : file.path, base).href;
          await fetch(fileUrl, {
            method: 'DELETE',
            headers: { Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`), 'User-Agent': 'JavDB-Extension/1.0' },
          });
          bgLog('INFO', 'Deleted expired WebDAV backup', { name: file.name, url: fileUrl });
        } catch (e: any) {
          bgLog('WARN', 'Failed to delete expired WebDAV backup', { name: file.name, error: e?.message });
        }
      }
    }
  } catch (e: any) {
    bgLog('WARN', 'cleanupOldBackups encountered an error', { error: e?.message });
  }
}

function parseWebDAVResponse(xmlString: string): WebDAVFile[] {
  const files: WebDAVFile[] = [];
  let simplifiedXml = xmlString;
  simplifiedXml = simplifiedXml.replace(/<(\/)?.+?:/g, '<$1');
  simplifiedXml = simplifiedXml.replace(/\s+xmlns[^=]*="[^"]*"/g, '');
  const responsePatterns = [/<response>(.*?)<\/response>/gs, /<multistatus[^>]*>(.*?)<\/multistatus>/gs, /<propstat[^>]*>(.*?)<\/propstat>/gs];
  const hrefPatterns = [/<href[^>]*>(.*?)<\/href>/i, /<displayname[^>]*>(.*?)<\/displayname>/i, /<name[^>]*>(.*?)<\/name>/i];
  const timePatterns = [/<getlastmodified[^>]*>(.*?)<\/getlastmodified>/i, /<lastmodified[^>]*>(.*?)<\/lastmodified>/i, /<modificationtime[^>]*>(.*?)<\/modificationtime>/i, /<creationdate[^>]*>(.*?)<\/creationdate>/i];
  const sizePatterns = [/<getcontentlength[^>]*>(.*?)<\/getcontentlength>/i, /<contentlength[^>]*>(.*?)<\/contentlength>/i, /<size[^>]*>(.*?)<\/size>/i];
  const collectionPatterns = [/<resourcetype[^>]*>.*?<collection[^>]*\/>.*?<\/resourcetype>/i, /<resourcetype[^>]*>.*?<collection[^>]*>.*?<\/collection>.*?<\/resourcetype>/i, /<getcontenttype[^>]*>.*?directory.*?<\/getcontenttype>/i, /<iscollection[^>]*>true<\/iscollection>/i];
  for (const responsePattern of responsePatterns) {
    let match: RegExpExecArray | null;
    responsePattern.lastIndex = 0;
    while ((match = responsePattern.exec(simplifiedXml)) !== null) {
      const responseXml = match[1];
      let href = '';
      let displayName = '';
      for (const hrefPattern of hrefPatterns) {
        const hrefMatch = responseXml.match(hrefPattern);
        if (hrefMatch && hrefMatch[1]) {
          href = hrefMatch[1].trim();
          if (href.includes('/')) displayName = decodeURIComponent(href.split('/').filter(Boolean).pop() || '');
          else displayName = decodeURIComponent(href);
          break;
        }
      }
      if (!href || !displayName) continue;
      let isDirectory = false;
      for (const collectionPattern of collectionPatterns) {
        if (collectionPattern.test(responseXml)) { isDirectory = true; break; }
      }
      if (isDirectory || href.endsWith('/')) continue;
      if (displayName.includes('javdb-extension-backup')) {
        let lastModified = 'N/A';
        for (const timePattern of timePatterns) {
          const timeMatch = responseXml.match(timePattern);
          if (timeMatch && timeMatch[1]) {
            try { lastModified = new Date(timeMatch[1]).toLocaleString(); break; } catch {}
          }
        }
        let size: number | undefined;
        for (const sizePattern of sizePatterns) {
          const sizeMatch = responseXml.match(sizePattern);
          if (sizeMatch && sizeMatch[1]) {
            const parsedSize = parseInt(sizeMatch[1], 10);
            if (!isNaN(parsedSize)) { size = parsedSize; break; }
          }
        }
        files.push({ name: displayName, path: href, lastModified, isDirectory: false, size });
      }
    }
    if (files.length > 0) break;
  }
  return files;
}

async function testWebDAVConnection(): Promise<{ success: boolean; error?: string }> {
  bgLog('INFO', 'Testing WebDAV connection.');
  const settings = await getSettings();
  if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
    const errorMsg = 'WebDAV connection details are not fully configured.';
    bgLog('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    let url = settings.webdav.url;
    if (!url.endsWith('/')) url += '/';
    bgLog('INFO', `Testing connection to: ${url}`);
    const headers: Record<string, string> = {
      Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'JavDB-Extension/1.0',
    };
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>\n<D:propfind xmlns:D="DAV:">\n    <D:prop>\n        <D:resourcetype/>\n        <D:getcontentlength/>\n        <D:getlastmodified/>\n    </D:prop>\n</D:propfind>`;
    const response = await fetch(url, { method: 'PROPFIND', headers, body: xmlBody });
    bgLog('INFO', `Test response: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const responseText = await response.text();
      bgLog('DEBUG', 'Test response content:', { length: responseText.length, preview: responseText.substring(0, 200) });
      if (responseText.includes('<?xml') || responseText.includes('<multistatus') || responseText.includes('<response')) {
        bgLog('INFO', 'WebDAV connection test successful - server supports WebDAV protocol');
        return { success: true };
      } else {
        bgLog('WARN', 'Server responded but may not support WebDAV properly');
        return { success: false, error: '服务器响应成功但可能不支持WebDAV协议，请检查URL是否正确' };
      }
    } else {
      let errorMsg = `Connection test failed with status: ${response.status} ${response.statusText}`;
      if (response.status === 401) errorMsg += ' - 认证失败，请检查用户名和密码';
      else if (response.status === 403) errorMsg += ' - 访问被拒绝，请检查账户权限';
      else if (response.status === 404) errorMsg += ' - WebDAV路径不存在，请检查URL';
      else if (response.status === 405) errorMsg += ' - 服务器不支持WebDAV';
      bgLog('WARN', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error: any) {
    let errorMsg = error.message;
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) errorMsg = '网络连接失败，请检查网络连接和服务器地址';
    else if (errorMsg.includes('CORS')) errorMsg = 'CORS错误，可能是服务器配置问题';
    bgLog('ERROR', 'WebDAV connection test failed.', { error: errorMsg, originalError: error.message, url: (await getSettings()).webdav.url });
    return { success: false, error: errorMsg };
  }
}

async function testWebDAVConnectionWithConfig(config: { url: string; username: string; password: string }): Promise<{ success: boolean; error?: string }> {
  bgLog('INFO', 'Testing WebDAV connection with temporary config.');
  
  if (!config.url || !config.username || !config.password) {
    const errorMsg = 'WebDAV connection details are not fully configured.';
    bgLog('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  
  try {
    let url = config.url;
    if (!url.endsWith('/')) url += '/';
    bgLog('INFO', `Testing connection to: ${url}`);
    
    const headers: Record<string, string> = {
      Authorization: 'Basic ' + btoa(`${config.username}:${config.password}`),
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'JavDB-Extension/1.0',
    };
    
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>\n<D:propfind xmlns:D="DAV:">\n    <D:prop>\n        <D:resourcetype/>\n        <D:getcontentlength/>\n        <D:getlastmodified/>\n    </D:prop>\n</D:propfind>`;
    
    const response = await fetch(url, { method: 'PROPFIND', headers, body: xmlBody });
    bgLog('INFO', `Test response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseText = await response.text();
      bgLog('DEBUG', 'Test response content:', { length: responseText.length, preview: responseText.substring(0, 200) });
      
      if (responseText.includes('<?xml') || responseText.includes('<multistatus') || responseText.includes('<response')) {
        bgLog('INFO', 'WebDAV connection test successful - server supports WebDAV protocol');
        return { success: true };
      } else {
        bgLog('WARN', 'Server responded but may not support WebDAV properly');
        return { success: false, error: '服务器响应成功但可能不支持WebDAV协议，请检查URL是否正确' };
      }
    } else {
      let errorMsg = `Connection test failed with status: ${response.status} ${response.statusText}`;
      if (response.status === 401) errorMsg += ' - 认证失败，请检查用户名和密码';
      else if (response.status === 403) errorMsg += ' - 访问被拒绝，请检查账户权限';
      else if (response.status === 404) errorMsg += ' - WebDAV路径不存在，请检查URL';
      else if (response.status === 405) errorMsg += ' - 服务器不支持WebDAV';
      bgLog('WARN', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error: any) {
    let errorMsg = error.message;
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) errorMsg = '网络连接失败，请检查网络连接和服务器地址';
    else if (errorMsg.includes('CORS')) errorMsg = 'CORS错误，可能是服务器配置问题';
    bgLog('ERROR', 'WebDAV connection test failed.', { error: errorMsg, originalError: error.message, url: config.url });
    return { success: false, error: errorMsg };
  }
}

async function diagnoseWebDAVConnection(): Promise<{ success: boolean; error?: string; diagnostic?: DiagnosticResult }> {
  bgLog('INFO', 'Starting WebDAV diagnostic.');
  const settings = await getSettings();
  if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
    const errorMsg = 'WebDAV connection details are not fully configured.';
    bgLog('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const diagnostic = await quickDiagnose({
      url: settings.webdav.url,
      username: settings.webdav.username,
      password: settings.webdav.password,
    });
    bgLog('INFO', 'WebDAV diagnostic completed', diagnostic);
    return { success: true, diagnostic };
  } catch (error: any) {
    bgLog('ERROR', 'WebDAV diagnostic failed.', { error: error.message });
    return { success: false, error: error.message };
  }
}

export function registerWebDAVRouter(): void {
  try {
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      switch (message.type) {
        case 'webdav-list-files':
          listFiles().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'WEB_DAV:RESTORE_PREVIEW': {
          const { filename } = message;
          previewBackup(filename).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'WEB_DAV:RESTORE_UNIFIED': {
          const { filename, options } = message;
          performRestoreUnified(filename, options).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'webdav-restore': {
          const { filename, options, preview } = message;
          const restoreOptions = { ...options, preview: preview || false };
          performRestore(filename, restoreOptions).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'webdav-test':
          testWebDAVConnection().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-test-temp':
          // 使用临时配置测试连接
          testWebDAVConnectionWithConfig(message.config).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-diagnose':
          diagnoseWebDAVConnection().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        case 'webdav-upload':
          performUpload().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        default:
          return false;
      }
    });
  } catch {}
}
