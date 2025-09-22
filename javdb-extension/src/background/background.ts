// src/background/background.ts
// ================= 115 v2 后台代理（解决内容脚本 CORS） =================
try {
  // 避免重复注册
  // @ts-ignore
  const __drive115_v2_proxy_flag = (globalThis as any).__drive115_v2_proxy_flag;
  if (!__drive115_v2_proxy_flag && typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    // @ts-ignore
    (globalThis as any).__drive115_v2_proxy_flag = true;
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      if (message.type === 'drive115.add_task_urls_v2') {
        const payload = message.payload || {};
        const accessToken = String(payload.accessToken || '').trim();
        const urls = String(payload.urls || '');
        const wp_path_id = payload.wp_path_id;
        const base = String(payload.baseUrl || 'https://proapi.115.com').replace(/\/$/, '');
        if (!accessToken || !urls) {
          sendResponse({ success: false, message: '缺少 accessToken 或 urls' });
          return true;
        }
        
        const fd = new FormData();
        fd.set('urls', urls);
        if (wp_path_id !== undefined) fd.set('wp_path_id', String(wp_path_id));

        fetch(`${base}/open/offline/add_task_urls`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          body: fd,
        })
          .then(async (res) => {
            const raw = await res.json().catch(() => ({} as any));
            const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
            const data = (raw && (raw.data || raw.result)) || undefined;
            sendResponse({ success: ok, message: raw?.message || raw?.error, raw, data });
          })
          .catch((err) => {
            sendResponse({ success: false, message: err?.message || '后台请求失败' });
          });
        return true; // 异步响应
      } else if (message.type === 'drive115.refresh_token_v2') {
        try {
          const rt = String(message?.payload?.refreshToken || '').trim();
          const refreshBase = 'https://passportapi.115.com';
          if (!rt) {
            sendResponse({ success: false, message: '缺少 refresh_token' });
            return true;
          }
          const fd = new URLSearchParams();
          fd.set('refresh_token', rt);
          fetch(`${refreshBase}/open/refreshToken`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
            body: fd.toString(),
          })
            .then(async (res) => {
              const raw = await res.json().catch(() => ({} as any));
              const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
              sendResponse({ success: ok, raw });
            })
            .catch((err) => {
              sendResponse({ success: false, message: err?.message || '后台刷新请求失败' });
            });
          return true; // 异步响应
        } catch (e: any) {
          sendResponse({ success: false, message: e?.message || '后台刷新异常' });
          return true;
        }
      } else if (message.type === 'drive115.get_quota_info_v2') {
        try {
          const accessToken = String(message?.payload?.accessToken || '').trim();
          const base = String(message?.payload?.baseUrl || 'https://proapi.115.com').replace(/\/$/, '');
          if (!accessToken) {
            sendResponse({ success: false, message: '缺少 access_token' });
            return true;
          }
          fetch(`${base}/open/offline/get_quota_info`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
          }).then(async (res) => {
            const raw = await res.json().catch(() => ({} as any));
            const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
            sendResponse({ success: ok, raw });
          }).catch((err) => {
            sendResponse({ success: false, message: err?.message || '后台配额请求失败' });
          });
          return true; // 异步响应
        } catch (e: any) {
          sendResponse({ success: false, message: e?.message || '后台配额异常' });
          return true;
        }
      }
      // 未匹配任何 115 v2 消息类型
      return false;
    });
  }
} catch (e) {
  // 静默
}


import { getValue, setValue, getSettings, saveSettings } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { LogEntry, LogLevel } from '../types';
import { refreshRecordById } from './sync';
import { quickDiagnose, type DiagnosticResult } from '../utils/webdavDiagnostic';
import { newWorksScheduler } from '../services/newWorks';
import { installConsoleProxy } from '../utils/consoleProxy';
import JSZip from 'jszip';
import { initDB, viewedPut as idbViewedPut, viewedBulkPut as idbViewedBulkPut, viewedCount as idbViewedCount, viewedPage as idbViewedPage, viewedCountByStatus as idbViewedCountByStatus, logsAdd as idbLogsAdd, logsBulkAdd as idbLogsBulkAdd, logsQuery as idbLogsQuery, logsClear as idbLogsClear, viewedExportJSON as idbViewedExportJSON, logsExportJSON as idbLogsExportJSON, magnetsUpsertMany as idbMagnetsUpsertMany, magnetsQuery as idbMagnetsQuery, magnetsClearAll as idbMagnetsClearAll, magnetsClearExpired as idbMagnetsClearExpired, actorsPut as idbActorsPut, actorsBulkPut as idbActorsBulkPut, actorsGet as idbActorsGet, actorsDelete as idbActorsDelete, actorsQuery as idbActorsQuery, actorsStats as idbActorsStats, actorsExportJSON as idbActorsExportJSON, newWorksPut as idbNewWorksPut, newWorksBulkPut as idbNewWorksBulkPut, newWorksDelete as idbNewWorksDelete, newWorksGet as idbNewWorksGet, newWorksGetAll as idbNewWorksGetAll, newWorksQuery as idbNewWorksQuery, newWorksStats as idbNewWorksStats, newWorksExportJSON as idbNewWorksExportJSON } from './db';

// console.log('[Background] Service Worker starting up or waking up.');

// 安装统一控制台代理（仅控制显示层，不改变入库逻辑）
installConsoleProxy({
  level: 'DEBUG',
  format: { showTimestamp: true, timestampStyle: 'hms', timeZone: 'Asia/Shanghai', showSource: true, color: true },
  categories: {
    general: { enabled: true, match: () => true, label: 'BG', color: '#2c3e50' },
  },
});

// 将设置中的控制台显示配置应用到代理
async function applyConsoleSettingsFromStorage() {
  try {
    const settings = await getSettings();
    const logging = settings.logging || {} as any;
    const ctrl: any = (globalThis as any).__JDB_CONSOLE__;
    if (!ctrl) return;
    if (logging.consoleLevel) ctrl.setLevel(logging.consoleLevel);
    if (logging.consoleFormat) {
      ctrl.setFormat({
        showTimestamp: logging.consoleFormat.showTimestamp ?? true,
        showSource: logging.consoleFormat.showSource ?? true,
        color: logging.consoleFormat.color ?? true,
        timeZone: logging.consoleFormat.timeZone || 'Asia/Shanghai',
      });
    }
    if (logging.consoleCategories) {
      const cfg = ctrl.getConfig();
      const allKeys = Object.keys(cfg?.categories || {});
      for (const key of allKeys) {
        const flag = logging.consoleCategories[key];
        if (flag === false) ctrl.disable(key);
        else if (flag === true) ctrl.enable(key);
      }
    }
  } catch (e) {
    console.warn('[ConsoleProxy] Failed to apply settings in BG:', e);
  }
}

applyConsoleSettingsFromStorage();

try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEYS.SETTINGS]) {
      applyConsoleSettingsFromStorage();
    }
  });
} catch {}

// ---------------- IndexedDB Migration & DB message routing ----------------

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

// fire-and-forget on startup/wakeup
ensureIDBMigrated();

// Best-effort: 清理过期的磁链缓存
try { idbMagnetsClearExpired(Date.now()).catch(() => {}); } catch {}

try {
  chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
    if (!message || typeof message !== 'object') return false;
    // DB message routing
    if (message.type === 'DB:VIEWED_PUT') {
      const record = message?.payload?.record;
      idbViewedPut(record).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'idb put failed' }));
      return true; // async
    }
    if (message.type === 'DB:VIEWED_BULK_PUT') {
      const records = message?.payload?.records || [];
      idbViewedBulkPut(records).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'idb bulkPut failed' }));
      return true; // async
    }
    if (message.type === 'DB:VIEWED_GET_ALL') {
      import('./db').then(m => m.viewedGetAll()).then((records) => {
        sendResponse({ success: true, records });
      }).catch((e) => sendResponse({ success: false, error: e?.message || 'idb getAll failed' }));
      return true; // async
    }
    if (message.type === 'DB:VIEWED_COUNT') {
      const status = message?.payload?.status as any;
      const p = status ? idbViewedCountByStatus(status) : idbViewedCount();
      p.then((total) => sendResponse({ success: true, total }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'idb count failed' }));
      return true;
    }
    if (message.type === 'DB:VIEWED_PAGE') {
      const payload = message?.payload || {};
      idbViewedPage(payload).then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'idb page failed' }));
      return true;
    }
    if (message.type === 'DB:VIEWED_EXPORT') {
      idbViewedExportJSON().then((json) => sendResponse({ success: true, json }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'idb viewed export failed' }));
      return true;
    }
    if (message.type === 'DB:LOGS_ADD') {
      const entry = message?.payload?.entry;
      idbLogsAdd(entry).then((id) => sendResponse({ success: true, id }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'logs add failed' }));
      return true;
    }
    if (message.type === 'DB:LOGS_BULK') {
      const entries = message?.payload?.entries || [];
      idbLogsBulkAdd(entries).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'logs bulk failed' }));
      return true;
    }
    if (message.type === 'DB:LOGS_QUERY') {
      const payload = message?.payload || {};
      idbLogsQuery(payload).then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'logs query failed' }));
      return true;
    }
    if (message.type === 'DB:LOGS_CLEAR') {
      const beforeMs = message?.payload?.beforeMs;
      idbLogsClear(beforeMs).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'logs clear failed' }));
      return true;
    }
    if (message.type === 'DB:LOGS_EXPORT') {
      idbLogsExportJSON().then((json) => sendResponse({ success: true, json }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'logs export failed' }));
      return true;
    }
    // actors
    if (message.type === 'DB:ACTORS_PUT') {
      const record = message?.payload?.record;
      idbActorsPut(record).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors put failed' }));
      return true;
    }
    if (message.type === 'DB:ACTORS_BULK_PUT') {
      const records = message?.payload?.records || [];
      idbActorsBulkPut(records).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors bulkPut failed' }));
      return true;
    }
    if (message.type === 'DB:ACTORS_GET') {
      const id = message?.payload?.id;
      idbActorsGet(id).then((record) => sendResponse({ success: true, record }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors get failed' }));
      return true;
    }
    if (message.type === 'DB:ACTORS_DELETE') {
      const id = message?.payload?.id;
      idbActorsDelete(id).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors delete failed' }));
      return true;
    }
    if (message.type === 'DB:ACTORS_QUERY') {
      const params = message?.payload || {};
      idbActorsQuery(params).then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors query failed' }));
      return true;
    }
    if (message.type === 'DB:ACTORS_STATS') {
      idbActorsStats().then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors stats failed' }));
      return true;
    }
    if (message.type === 'DB:ACTORS_EXPORT') {
      idbActorsExportJSON().then((json) => sendResponse({ success: true, json }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'actors export failed' }));
      return true;
    }
    // newWorks
    if (message.type === 'DB:NEWWORKS_PUT') {
      const record = message?.payload?.record;
      idbNewWorksPut(record).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks put failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_BULK_PUT') {
      const records = message?.payload?.records || [];
      idbNewWorksBulkPut(records).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks bulkPut failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_DELETE') {
      const id = message?.payload?.id;
      idbNewWorksDelete(id).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks delete failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_GET') {
      const id = message?.payload?.id;
      idbNewWorksGet(id).then((record) => sendResponse({ success: true, record }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks get failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_GET_ALL') {
      idbNewWorksGetAll().then((records) => sendResponse({ success: true, records }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks getAll failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_QUERY') {
      const params = message?.payload || {};
      idbNewWorksQuery(params).then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks query failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_STATS') {
      idbNewWorksStats().then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks stats failed' }));
      return true;
    }
    if (message.type === 'DB:NEWWORKS_EXPORT') {
      idbNewWorksExportJSON().then((json) => sendResponse({ success: true, json }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks export failed' }));
      return true;
    }
    // magnets
    if (message.type === 'DB:MAGNETS_UPSERT') {
      const records = message?.payload?.records || [];
      idbMagnetsUpsertMany(records).then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets upsert failed' }));
      return true;
    }
    if (message.type === 'DB:MAGNETS_QUERY') {
      const params = message?.payload || {};
      idbMagnetsQuery(params).then((data) => sendResponse({ success: true, ...data }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets query failed' }));
      return true;
    }
    if (message.type === 'DB:MAGNETS_CLEAR') {
      idbMagnetsClearAll().then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets clear failed' }));
      return true;
    }
    if (message.type === 'DB:MAGNETS_CLEAR_EXPIRED') {
      const beforeMs = message?.payload?.beforeMs;
      idbMagnetsClearExpired(beforeMs).then((removed) => sendResponse({ success: true, removed }))
        .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets clear expired failed' }));
      return true;
    }
  });
} catch {}

const consoleMap: Record<LogLevel, (message?: any, ...optionalParams: any[]) => void> = {
  INFO: console.info,
  WARN: console.warn,
  ERROR: console.error,
  DEBUG: console.debug,
};

async function log(level: LogLevel, message: string, data?: any) {
  const logFunction = consoleMap[level] || console.log;
  // 只在有数据时才输出数据，避免输出 undefined
  if (data !== undefined) {
    logFunction(message, data);
  } else {
    logFunction(message);
  }

  try {
        const [logs, settings] = await Promise.all([
            getValue<LogEntry[]>(STORAGE_KEYS.LOGS, []),
            getSettings()
        ]);
        
        const newLogEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data, // No longer attempting a deep copy that fails on circular references
        };

        logs.push(newLogEntry);

        // Use the max entries from settings (configured in LoggingSettings)
        const maxEntries = (settings.logging as any)?.maxEntries ?? settings.logging?.maxLogEntries ?? 1500;
        if (logs.length > maxEntries) {
            logs.splice(0, logs.length - maxEntries);
        }

        await setValue(STORAGE_KEYS.LOGS, logs);
        // 异步双写到 IndexedDB 日志库
        try { idbLogsAdd(newLogEntry).catch(() => {}); } catch {}
    } catch (e) {
        console.error("Failed to write to persistent log:", e);
    }
}

const logger = {
    info: (message: string, data?: any) => log('INFO', message, data),
    warn: (message: string, data?: any) => log('WARN', message, data),
    error: (message: string, data?: any) => log('ERROR', message, data),
    debug: (message: string, data?: any) => log('DEBUG', message, data),
};

interface WebDAVFile {
    name: string;
    path: string;
    lastModified: string;
    isDirectory: boolean;
    size?: number;
}

async function performUpload(): Promise<{ success: boolean; error?: string }> {
    await logger.info('Attempting to perform WebDAV upload.');
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        // 获取所有需要同步的数据
        const recordsToSync = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
        const actorRecords = await getValue(STORAGE_KEYS.ACTOR_RECORDS, {});
        const logs = await getValue(STORAGE_KEYS.LOGS, []);
        const importStats = await getValue(STORAGE_KEYS.LAST_IMPORT_STATS, null);

        const dataToExport = {
            version: '2.0', // 添加版本号以支持向后兼容
            timestamp: new Date().toISOString(),
            settings: settings,
            data: recordsToSync,
            userProfile: userProfile,
            actorRecords: actorRecords, // 演员库数据（包含 blacklisted）
            logs: logs, // 持久化日志
            importStats: importStats, // 导入统计
            newWorks: { // 新增：新作品数据
                subscriptions: await getValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {}),
                records: await getValue(STORAGE_KEYS.NEW_WORKS_RECORDS, {}),
                config: await getValue(STORAGE_KEYS.NEW_WORKS_CONFIG, {})
            }
        };
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        const second = now.getSeconds().toString().padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        const filename = `javdb-extension-backup-${date}-${hour}-${minute}-${second}.zip`;
        
        let fileUrl = settings.webdav.url;
        if (!fileUrl.endsWith('/')) fileUrl += '/';
        fileUrl += filename.startsWith('/') ? filename.substring(1) : filename;
        
        // 生成ZIP
        const zip = new JSZip();
        zip.file('backup.json', JSON.stringify(dataToExport, null, 2));
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });

        await logger.info(`Uploading to ${fileUrl}`);

        const response = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
                'Content-Type': 'application/zip'
            },
            body: zipBlob
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        // Update last sync time and cleanup old backups according to retention
        const updatedSettings = await getSettings();
        updatedSettings.webdav.lastSync = new Date().toISOString();
        await saveSettings(updatedSettings);
        await logger.info('WebDAV upload successful, updated last sync time.');

        try {
            const retentionDays = Number(updatedSettings.webdav.retentionDays ?? 7);
            if (!isNaN(retentionDays) && retentionDays > 0) {
                await cleanupOldBackups(retentionDays);
            }
        } catch (e) {
            await logger.warn('Failed to cleanup old WebDAV backups', { error: (e as Error).message });
        }

        return { success: true };
    } catch (error: any) {
        await logger.error('WebDAV upload failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

async function performRestore(filename: string, options = {
    restoreSettings: true,
    restoreRecords: true,
    restoreUserProfile: true,
    restoreActorRecords: true, // 新增：恢复演员库
    restoreLogs: false, // 新增：恢复日志（默认关闭）
    restoreImportStats: false, // 新增：恢复导入统计（默认关闭）
    preview: false // 新增：预览模式
}): Promise<{ success: boolean; error?: string; data?: any }> {
    await logger.info(`Attempting to restore from WebDAV.`, { filename, options });
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        let finalUrl: string;
        const webdavBaseUrl = settings.webdav.url;

        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            finalUrl = filename;
        } else if (filename.startsWith('/')) {
            const origin = new URL(webdavBaseUrl).origin;
            finalUrl = new URL(filename, origin).href;
        } else {
            let base = webdavBaseUrl;
            if (!base.endsWith('/')) base += '/';
            finalUrl = new URL(filename, base).href;
        }

        await logger.info(`Attempting to restore from WebDAV URL: ${finalUrl}`);
        
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`)
            }
        });

        if (!response.ok) {
            throw new Error(`Download failed with status: ${response.status}`);
        }

        const isZip = /\.zip$/i.test(finalUrl);
        let importData: any;
        if (isZip) {
            const arrayBuf = await response.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuf);
            // 优先尝试 backup.json
            const jsonFile = zip.file('backup.json') || zip.file(/\.json$/i)[0];
            if (!jsonFile) {
                throw new Error('ZIP 中未找到 JSON 备份文件');
            }
            const jsonText = await jsonFile.async('text');
            importData = JSON.parse(jsonText);
        } else {
            const fileContents = await response.text();
            importData = JSON.parse(fileContents);
        }

        await logger.info('Parsed backup data', {
            hasSettings: !!importData.settings,
            hasData: !!importData.data,
            hasUserProfile: !!importData.userProfile,
            hasActorRecords: !!importData.actorRecords,
            hasLogs: !!importData.logs,
            hasImportStats: !!importData.importStats,
            hasNewWorks: !!importData.newWorks,
            version: importData.version || '1.0',
            preview: options.preview
        });

        // 如果是预览模式，返回完整数据用于差异分析
        if (options.preview) {
            return {
                success: true,
                data: {
                    version: importData.version || '1.0',
                    timestamp: importData.timestamp,
                    settings: importData.settings || null,
                    data: importData.data || importData.viewed || null, // 兼容旧格式
                    viewed: importData.viewed || null, // 向后兼容
                    userProfile: importData.userProfile || null,
                    actorRecords: importData.actorRecords || null,
                    logs: importData.logs || null,
                    importStats: importData.importStats || null,
                    newWorks: importData.newWorks || null
                }
            };
        }

        // 恢复扩展设置
        if (importData.settings && options.restoreSettings) {
            await saveSettings(importData.settings);
            await logger.info('Restored settings');
        }

        // 恢复视频记录
        if (importData.data && options.restoreRecords) {
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
            await logger.info('Restored video records');
        } else if (options.restoreRecords) {
            // 向后兼容：旧版本的备份格式
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
            await logger.info('Restored video records (legacy format)');
        }

        // 恢复用户配置
        if (importData.userProfile && options.restoreUserProfile) {
            await setValue(STORAGE_KEYS.USER_PROFILE, importData.userProfile);
            await logger.info('Restored user profile');
        }

        // 恢复演员库数据（包含 blacklisted）
        if (importData.actorRecords && options.restoreActorRecords) {
            await setValue(STORAGE_KEYS.ACTOR_RECORDS, importData.actorRecords);
            await logger.info('Restored actor records', {
                actorCount: Object.keys(importData.actorRecords).length
            });
        }

        // 恢复日志（可选）
        if (importData.logs && options.restoreLogs) {
            await setValue(STORAGE_KEYS.LOGS, importData.logs);
            await logger.info('Restored logs', {
                logCount: Array.isArray(importData.logs) ? importData.logs.length : 0
            });
        }

        // 恢复导入统计（可选）
        if (importData.importStats && options.restoreImportStats) {
            await setValue(STORAGE_KEYS.LAST_IMPORT_STATS, importData.importStats);
            await logger.info('Restored import statistics');
        }

        // 新增：恢复新作品数据
        if (importData.newWorks) {
            if (importData.newWorks.subscriptions) {
                await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, importData.newWorks.subscriptions);
            }
            if (importData.newWorks.records) {
                await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, importData.newWorks.records);
            }
            if (importData.newWorks.config) {
                await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, importData.newWorks.config);
            }
            await logger.info('Restored new works data');
        }

        return { success: true };
    } catch (error: any) {
        await logger.error('Failed to restore from WebDAV.', { error: error.message, filename });
        return { success: false, error: error.message };
    }
}

async function listFiles(): Promise<{ success: boolean; error?: string; files?: WebDAVFile[] }> {
    await logger.info('Attempting to list files from WebDAV.');
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        let url = settings.webdav.url;
        if (!url.endsWith('/')) url += '/';

        await logger.info(`Sending PROPFIND request to: ${url}`);

        // 增强的请求头，支持更多WebDAV服务器
        const headers: Record<string, string> = {
            'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
            'Depth': '1',
            'Content-Type': 'application/xml; charset=utf-8',
            'User-Agent': 'JavDB-Extension/1.0'
        };

        // 对于某些服务器，可能需要发送XML body
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
    <D:allprop/>
</D:propfind>`;

        const response = await fetch(url, {
            method: 'PROPFIND',
            headers: headers,
            body: xmlBody
        });

        await logger.info(`WebDAV response status: ${response.status} ${response.statusText}`);
        const __headersObj: Record<string, string> = {};
        try {
            response.headers.forEach((value, key) => { __headersObj[key] = value; });
        } catch {}
        await logger.debug(`WebDAV response headers:`, __headersObj);

        if (!response.ok) {
            // 提供更详细的错误信息
            let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
            if (response.status === 401) {
                errorDetail += ' - 认证失败，请检查用户名和密码';
            } else if (response.status === 403) {
                errorDetail += ' - 访问被拒绝，请检查权限设置';
            } else if (response.status === 404) {
                errorDetail += ' - 路径不存在，请检查WebDAV URL';
            } else if (response.status === 405) {
                errorDetail += ' - 服务器不支持PROPFIND方法';
            } else if (response.status >= 500) {
                errorDetail += ' - 服务器内部错误';
            }

            throw new Error(errorDetail);
        }

        const text = await response.text();
        await logger.debug("Received WebDAV PROPFIND response:", {
            responseLength: text.length,
            responsePreview: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        });

        if (!text || text.trim().length === 0) {
            throw new Error('服务器返回空响应');
        }

        const files = parseWebDAVResponse(text);
        await logger.info(`Successfully parsed ${files.length} files from WebDAV response`);
        await logger.debug("Parsed WebDAV files:", { files });

        if (files.length === 0) {
            await logger.warn('No backup files found in WebDAV response. This might be normal if no backups exist yet.');
        }

        return { success: true, files: files };
    } catch (error: any) {
        await logger.error('Failed to list WebDAV files.', {
            error: error.message,
            url: settings.webdav.url,
            username: settings.webdav.username ? '[CONFIGURED]' : '[NOT SET]'
        });
        return { success: false, error: error.message };
    }
}

/**
 * 清理超过保留天数的备份文件
 */
async function cleanupOldBackups(retentionDays: number): Promise<void> {
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        return;
    }

    try {
        const result = await listFiles();
        if (!result.success || !result.files || result.files.length === 0) {
            return;
        }

        const files = result.files
            .filter(f => f.name.includes('javdb-extension-backup-') && (f.name.endsWith('.json') || f.name.endsWith('.zip')))
            // 按名称中的时间排序，较新的在前（名称格式：javdb-extension-backup-YYYY-MM-DD-HH-MM-SS.json 或 -YYYY-MM-DD.json）
            .sort((a, b) => a.name > b.name ? -1 : 1);

        const nowMs = Date.now();
        const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

        for (const file of files) {
            // 如果服务器返回了 lastModified，优先使用它
            let fileTime = 0;
            if (file.lastModified && file.lastModified !== 'N/A') {
                const parsed = Date.parse(file.lastModified);
                if (!isNaN(parsed)) fileTime = parsed;
            }

            // 如果无法从 lastModified 得到时间，则从文件名解析
            if (!fileTime) {
                // 支持两种命名：YYYY-MM-DD-HH-MM-SS 和 YYYY-MM-DD
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

            if (!fileTime) {
                continue;
            }

            const ageMs = nowMs - fileTime;
            if (ageMs > maxAgeMs) {
                try {
                    // 构造完整 URL 进行删除
                    let base = settings.webdav.url;
                    if (!base.endsWith('/')) base += '/';
                    const fileUrl = new URL(file.path.startsWith('/') ? file.path.substring(1) : file.path, base).href;
                    await fetch(fileUrl, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
                            'User-Agent': 'JavDB-Extension/1.0'
                        }
                    });
                    await logger.info('Deleted expired WebDAV backup', { name: file.name, url: fileUrl });
                } catch (e) {
                    await logger.warn('Failed to delete expired WebDAV backup', { name: file.name, error: (e as Error).message });
                }
            }
        }
    } catch (e) {
        await logger.warn('cleanupOldBackups encountered an error', { error: (e as Error).message });
    }
}

function parseWebDAVResponse(xmlString: string): WebDAVFile[] {
    const files: WebDAVFile[] = [];

    // 更强大的XML命名空间处理，支持多种WebDAV服务器
    let simplifiedXml = xmlString;

    // 移除所有XML命名空间前缀，支持更多服务器格式
    simplifiedXml = simplifiedXml.replace(/<(\/)?\w+:/g, '<$1');
    simplifiedXml = simplifiedXml.replace(/\s+xmlns[^=]*="[^"]*"/g, '');

    // 多种response标签格式支持
    const responsePatterns = [
        /<response>(.*?)<\/response>/gs,
        /<multistatus[^>]*>(.*?)<\/multistatus>/gs,
        /<propstat[^>]*>(.*?)<\/propstat>/gs
    ];

    // 多种href标签格式支持
    const hrefPatterns = [
        /<href[^>]*>(.*?)<\/href>/i,
        /<displayname[^>]*>(.*?)<\/displayname>/i,
        /<name[^>]*>(.*?)<\/name>/i
    ];

    // 多种时间格式支持
    const timePatterns = [
        /<getlastmodified[^>]*>(.*?)<\/getlastmodified>/i,
        /<lastmodified[^>]*>(.*?)<\/lastmodified>/i,
        /<modificationtime[^>]*>(.*?)<\/modificationtime>/i,
        /<creationdate[^>]*>(.*?)<\/creationdate>/i
    ];

    // 多种大小格式支持
    const sizePatterns = [
        /<getcontentlength[^>]*>(.*?)<\/getcontentlength>/i,
        /<contentlength[^>]*>(.*?)<\/contentlength>/i,
        /<size[^>]*>(.*?)<\/size>/i
    ];

    // 多种目录检测格式支持
    const collectionPatterns = [
        /<resourcetype[^>]*>.*?<collection[^>]*\/>.*?<\/resourcetype>/i,
        /<resourcetype[^>]*>.*?<collection[^>]*>.*?<\/collection>.*?<\/resourcetype>/i,
        /<getcontenttype[^>]*>.*?directory.*?<\/getcontenttype>/i,
        /<iscollection[^>]*>true<\/iscollection>/i
    ];

    // 尝试不同的response模式
    for (const responsePattern of responsePatterns) {
        let match;
        responsePattern.lastIndex = 0; // 重置正则表达式状态

        while ((match = responsePattern.exec(simplifiedXml)) !== null) {
            const responseXml = match[1];

            // 尝试提取href/文件名
            let href = '';
            let displayName = '';

            for (const hrefPattern of hrefPatterns) {
                const hrefMatch = responseXml.match(hrefPattern);
                if (hrefMatch && hrefMatch[1]) {
                    href = hrefMatch[1].trim();
                    // 从href中提取文件名
                    if (href.includes('/')) {
                        displayName = decodeURIComponent(href.split('/').filter(Boolean).pop() || '');
                    } else {
                        displayName = decodeURIComponent(href);
                    }
                    break;
                }
            }

            if (!href || !displayName) continue;

            // 检查是否为目录
            let isDirectory = false;
            for (const collectionPattern of collectionPatterns) {
                if (collectionPattern.test(responseXml)) {
                    isDirectory = true;
                    break;
                }
            }

            // 如果是目录或者href以/结尾，跳过
            if (isDirectory || href.endsWith('/')) {
                continue;
            }

            // 只处理包含备份文件名的文件
            if (displayName.includes('javdb-extension-backup')) {
                // 尝试提取最后修改时间
                let lastModified = 'N/A';
                for (const timePattern of timePatterns) {
                    const timeMatch = responseXml.match(timePattern);
                    if (timeMatch && timeMatch[1]) {
                        try {
                            lastModified = new Date(timeMatch[1]).toLocaleString();
                            break;
                        } catch (e) {
                            // 如果日期解析失败，继续尝试其他格式
                            continue;
                        }
                    }
                }

                // 尝试提取文件大小
                let size: number | undefined;
                for (const sizePattern of sizePatterns) {
                    const sizeMatch = responseXml.match(sizePattern);
                    if (sizeMatch && sizeMatch[1]) {
                        const parsedSize = parseInt(sizeMatch[1], 10);
                        if (!isNaN(parsedSize)) {
                            size = parsedSize;
                            break;
                        }
                    }
                }

                files.push({
                    name: displayName,
                    path: href,
                    lastModified: lastModified,
                    isDirectory: false,
                    size: size,
                });
            }
        }

        // 如果找到了文件，就不需要尝试其他模式了
        if (files.length > 0) {
            break;
        }
    }

    return files;
}

async function testWebDAVConnection(): Promise<{ success: boolean; error?: string }> {
    await logger.info('Testing WebDAV connection.');
    const settings = await getSettings();
    if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
        const errorMsg = "WebDAV connection details are not fully configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        let url = settings.webdav.url;
        if (!url.endsWith('/')) url += '/';

        await logger.info(`Testing connection to: ${url}`);

        // 增强的请求头
        const headers: Record<string, string> = {
            'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
            'Depth': '0',
            'Content-Type': 'application/xml; charset=utf-8',
            'User-Agent': 'JavDB-Extension/1.0'
        };

        // 简单的XML body用于测试
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
    <D:prop>
        <D:resourcetype/>
        <D:getcontentlength/>
        <D:getlastmodified/>
    </D:prop>
</D:propfind>`;

        const response = await fetch(url, {
            method: 'PROPFIND',
            headers: headers,
            body: xmlBody
        });

        await logger.info(`Test response: ${response.status} ${response.statusText}`);

        if (response.ok) {
            // 尝试读取响应内容以验证服务器是否正确支持WebDAV
            const responseText = await response.text();
            await logger.debug('Test response content:', {
                length: responseText.length,
                preview: responseText.substring(0, 200)
            });

            // 检查响应是否包含WebDAV相关内容
            if (responseText.includes('<?xml') || responseText.includes('<multistatus') || responseText.includes('<response')) {
                await logger.info('WebDAV connection test successful - server supports WebDAV protocol');
                return { success: true };
            } else {
                await logger.warn('Server responded but may not support WebDAV properly');
                return {
                    success: false,
                    error: '服务器响应成功但可能不支持WebDAV协议，请检查URL是否正确'
                };
            }
        } else {
            let errorMsg = `Connection test failed with status: ${response.status} ${response.statusText}`;

            // 提供针对性的错误提示
            if (response.status === 401) {
                errorMsg += ' - 认证失败，请检查用户名和密码';
            } else if (response.status === 403) {
                errorMsg += ' - 访问被拒绝，请检查账户权限';
            } else if (response.status === 404) {
                errorMsg += ' - WebDAV路径不存在，请检查URL';
            } else if (response.status === 405) {
                errorMsg += ' - 服务器不支持WebDAV';
            }

            await logger.warn(errorMsg);
            return { success: false, error: errorMsg };
        }
    } catch (error: any) {
        let errorMsg = error.message;

        // 网络错误的友好提示
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
            errorMsg = '网络连接失败，请检查网络连接和服务器地址';
        } else if (errorMsg.includes('CORS')) {
            errorMsg = 'CORS错误，可能是服务器配置问题';
        }

        await logger.error('WebDAV connection test failed.', {
            error: errorMsg,
            originalError: error.message,
            url: settings.webdav.url
        });
        return { success: false, error: errorMsg };
    }
}

async function diagnoseWebDAVConnection(): Promise<{ success: boolean; error?: string; diagnostic?: DiagnosticResult }> {
    await logger.info('Starting WebDAV diagnostic.');
    const settings = await getSettings();

    if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
        const errorMsg = "WebDAV connection details are not fully configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const diagnostic = await quickDiagnose({
            url: settings.webdav.url,
            username: settings.webdav.username,
            password: settings.webdav.password
        });

        await logger.info('WebDAV diagnostic completed', diagnostic);

        return {
            success: true,
            diagnostic: diagnostic
        };
    } catch (error: any) {
        await logger.error('WebDAV diagnostic failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse): boolean | void => {

    // console.log(`[Background] onMessage listener triggered. Received message:`, message);
    // console.log(`[Background] Message type: ${message.type}`);

    try {
        switch (message.type) {
            // ... (rest of the code remains the same)
            case 'ping':
            case 'ping-background':
                // console.log('[Background] Ping received, sending pong.');
                sendResponse({ success: true, message: 'pong' });
                return true;
            case 'get-logs':
                // console.log('[Background] Processing get-logs request.');
                getValue(STORAGE_KEYS.LOGS, [])
                    .then(logs => {
                        // console.log(`[Background] Retrieved ${logs.length} log entries.`);
                        sendResponse({ success: true, logs });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to get logs:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'log-message':
                // console.log('[Background] Processing log-message request.');
                const { payload } = message;
                if (payload && payload.level && payload.message) {
                    log(payload.level, payload.message, payload.data)
                        .then(() => {
                            sendResponse({ success: true });
                        })
                        .catch(error => {
                            console.error('[Background] Failed to log message:', error);
                            sendResponse({ success: false, error: error.message });
                        });
                } else {
                    sendResponse({ success: false, error: 'Invalid log message payload' });
                }
                return true;
            case 'webdav-list-files':
                console.log('[Background] Processing webdav-list-files request.');
                listFiles()
                    .then(result => {
                        console.log(`[Background] WebDAV list files result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to list WebDAV files:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-restore':
                console.log('[Background] Processing webdav-restore request.');
                const { filename, options, preview } = message;
                const restoreOptions = { ...options, preview: preview || false };
                performRestore(filename, restoreOptions)
                    .then(result => {
                        console.log(`[Background] WebDAV restore result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to restore from WebDAV:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-test':
                console.log('[Background] Processing webdav-test request.');
                testWebDAVConnection()
                    .then(result => {
                        console.log(`[Background] WebDAV test result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to test WebDAV connection:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-diagnose':
                console.log('[Background] Processing webdav-diagnose request.');
                diagnoseWebDAVConnection()
                    .then(result => {
                        console.log(`[Background] WebDAV diagnose result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to diagnose WebDAV connection:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-upload':
                console.log('[Background] Processing webdav-upload request.');
                performUpload()
                    .then(result => {
                        console.log(`[Background] WebDAV upload result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to upload to WebDAV:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'clear-all-records':
                console.log('[Background] Processing clear-all-records request.');
                setValue(STORAGE_KEYS.VIEWED_RECORDS, {})
                    .then(() => {
                        console.log('[Background] All records cleared successfully.');
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to clear all records:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'refresh-record':
                const { videoId } = message;
                console.log(`[Background] Processing refresh-record for videoId: ${videoId}`);

                if (!videoId) {
                    console.error('[Background] Refresh request missing videoId. Sending error response.');
                    sendResponse({ success: false, error: 'No videoId provided.' });
                    return true;
                }

                console.log(`[Background] About to call refreshRecordById for: ${videoId}`);

                refreshRecordById(videoId)
                    .then(updatedRecord => {
                        console.log(`[Background] refreshRecordById successful for ${videoId}. Sending success response.`);
                        console.log(`[Background] Updated record:`, updatedRecord);
                        sendResponse({ success: true, record: updatedRecord });
                    })
                    .catch(error => {
                        console.error(`[Background] refreshRecordById failed for ${videoId}:`, error);
                        console.error(`[Background] Error stack:`, error.stack);
                        sendResponse({ success: false, error: error.message });
                    });

                // Return true to indicate that the response will be sent asynchronously.
                return true;
            case 'fetch-user-profile':
                console.log('[Background] Processing fetch-user-profile request.');
                fetchUserProfileFromJavDB()
                    .then((profile: any) => {
                        console.log('[Background] User profile fetch result:', profile);
                        sendResponse({ success: true, profile });
                    })
                    .catch((error: any) => {
                        console.error('[Background] Failed to fetch user profile:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'setup-alarms':
                console.log('[Background] Processing setup-alarms request.');
                setupAlarms()
                    .then(() => {
                        console.log('[Background] Alarms setup completed.');
                        sendResponse({ success: true });
                    })
                    .catch((error: any) => {
                        console.error('[Background] Failed to setup alarms:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'new-works-manual-check':
                console.log('[Background] Processing new-works-manual-check request.');
                newWorksScheduler.triggerManualCheck()
                    .then(result => {
                        console.log('[Background] Manual new works check completed:', result);
                        sendResponse({ success: true, result });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to perform manual new works check:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'new-works-scheduler-restart':
                console.log('[Background] Processing new-works-scheduler-restart request.');
                newWorksScheduler.restart()
                    .then(() => {
                        console.log('[Background] New works scheduler restarted.');
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to restart new works scheduler:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'new-works-scheduler-status':
                console.log('[Background] Processing new-works-scheduler-status request.');
                try {
                    const status = newWorksScheduler.getStatus();
                    sendResponse({ success: true, status });
                } catch (error: any) {
                    console.error('[Background] Failed to get new works scheduler status:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            case 'fetch-external-data':
                console.log('[Background] Processing fetch-external-data request.');
                handleExternalDataFetch(message, sendResponse);
                return true;
            case 'DRIVE115_PUSH':
                console.log('[Background] Processing DRIVE115_PUSH request.');
                handleDrive115Push(message, sendResponse);
                return true;
            case 'DRIVE115_VERIFY':
                console.log('[Background] Processing DRIVE115_VERIFY request.');
                handleDrive115Verify(message, sendResponse);
                return true;
            case 'DRIVE115_HEARTBEAT':
                console.log('[Background] Received heartbeat from 115 content script');
                sendResponse({ type: 'DRIVE115_HEARTBEAT_RESPONSE', success: true });
                return true;
            case 'UPDATE_WATCHED_STATUS':
                console.log('[Background] Processing UPDATE_WATCHED_STATUS request.');
                handleUpdateWatchedStatus(message, sendResponse);
                return true; // 保持消息通道开放
            case 'OPEN_TAB_BACKGROUND':
                console.log('[Background] Processing OPEN_TAB_BACKGROUND request.');
                handleOpenTabBackground(message, sendResponse);
                return true;
            case 'CHECK_VIDEO_URL':
                console.log('[Background] Processing CHECK_VIDEO_URL request.');
                handleCheckVideoUrl(message, sendResponse);
                return true;
            case 'FETCH_JAVSPYL_PREVIEW':
                console.log('[Background] Processing FETCH_JAVSPYL_PREVIEW request.');
                handleFetchJavSpylPreview(message, sendResponse);
                return true;
            case 'FETCH_AVPREVIEW_PREVIEW':
                console.log('[Background] Processing FETCH_AVPREVIEW_PREVIEW request.');
                handleFetchAVPreviewPreview(message, sendResponse);
                return true;
            case 'FETCH_JAVDB_PREVIEW':
                console.log('[Background] Processing FETCH_JAVDB_PREVIEW request.');
                handleFetchJavDBPreview(message, sendResponse);
                return true;
            case 'drive115.refresh_token_v2':
                // 兜底处理：避免部分环境未注册 v2 代理监听器时出现未知消息类型
                try {
                    const rt = String(message?.payload?.refreshToken || '').trim();
                    const refreshBase = 'https://passportapi.115.com';
                    if (!rt) {
                        sendResponse({ success: false, message: '缺少 refresh_token' });
                        return true;
                    }
                    const fd = new URLSearchParams();
                    fd.set('refresh_token', rt);
                    fetch(`${refreshBase}/open/refreshToken`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
                        body: fd.toString(),
                    })
                        .then(async (res) => {
                            const raw = await res.json().catch(() => ({} as any));
                            const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
                            sendResponse({ success: ok, raw });
                        })
                        .catch((err) => {
                            sendResponse({ success: false, message: err?.message || '后台刷新请求失败' });
                        });
                    return true; // 异步响应
                } catch (e: any) {
                    sendResponse({ success: false, message: e?.message || '后台刷新异常' });
                    return true;
                }
            default:
                console.warn(`[Background] Received unknown message type: ${message.type}. Ignoring.`);
                return false;
        }
    } catch (error: any) {
        console.error(`[Background] Error in message handler:`, error);
        sendResponse({ success: false, error: 'Internal error in background script' });
        return true;
    }
// ... (其他代码保持不变)
});

// ===== Helper functions (模块作用域) =====

// 从 JavDB 页面提取预览视频
async function handleFetchJavDBPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url } = message || {};
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }
        const res = await fetch(url);
        if (!res.ok) {
            sendResponse({ success: false, error: `Failed to fetch JavDB page: ${res.status}` });
            return;
        }
        const html = await res.text();
        const m = html.match(/id=\"preview-video\"[\s\S]*?<source[^>]*src=[\"']([^\"']+)[\"']/i);
        if (m && m[1]) {
            sendResponse({ success: true, videoUrl: m[1] });
        } else {
            sendResponse({ success: false, error: 'Preview video not found' });
        }
    } catch (error: any) {
        console.error('[Background] Failed to fetch JavDB preview:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 115 跨页推送
async function handleDrive115Push(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
        if (!tabs.length) {
            sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: '未找到 115.com 标签页' });
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
            if (chrome.runtime.lastError) {
                sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse(response);
            }
        });
    } catch (error: any) {
        console.error('[Background] Failed to handle DRIVE115_PUSH:', error);
        sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: error.message });
    }
}

// 115 环境验证
async function handleDrive115Verify(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
        if (!tabs.length) {
            sendResponse({ success: false, error: '未找到 115.com 标签页' });
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse(response ?? { success: true });
            }
        });
    } catch (error: any) {
        console.error('[Background] Failed to handle DRIVE115_VERIFY:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 更新已看状态
async function handleUpdateWatchedStatus(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const videoId = message?.videoId;
        if (!videoId) {
            sendResponse({ success: false, error: 'No videoId provided' });
            return;
        }
        const record: any = {
            id: videoId,
            title: '',
            status: 'viewed',
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await idbViewedPut(record);
        sendResponse({ success: true, record });
    } catch (error: any) {
        console.error('[Background] Failed to update watched status:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 外部拉取数据（简化版）
async function handleExternalDataFetch(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const url = message?.url;
        const options = message?.options || {};
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }
        const response = await fetch(url, options as RequestInit);
        const responseType = options.responseType || 'text';
        let data: any;
        if (responseType === 'json') data = await response.json().catch(() => null);
        else if (responseType === 'blob') data = await response.blob();
        else data = await response.text();
        const headersObj: Record<string, string> = {};
        try { response.headers.forEach((v, k) => { headersObj[k] = v; }); } catch {}
        sendResponse({ success: true, data, status: response.status, headers: headersObj });
    } catch (error: any) {
        console.error('[Background] Failed to fetch external data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 拉取用户资料（占位实现）
async function fetchUserProfileFromJavDB(): Promise<any> {
    try {
        const profile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
        return profile || { isLoggedIn: false };
    } catch {
        return { isLoggedIn: false };
    }
}

// 闹钟与自动同步（占位实现）
async function setupAlarms(): Promise<void> {
    try { /* no-op */ } catch {}
}
async function triggerAutoSync(): Promise<void> {
    try { /* no-op */ } catch {}
}

async function handleOpenTabBackground(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url } = message;
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }

        // 在后台打开新标签页
        const tab = await chrome.tabs.create({
            url: url,
            active: false // 后台打开
        });

        console.log(`[Background] Opened background tab: ${url}`);
        sendResponse({ success: true, tabId: tab.id });
    } catch (error: any) {
        console.error('[Background] Failed to open background tab:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 检查视频URL是否可用
async function handleCheckVideoUrl(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url } = message;
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }

        console.log(`[Background] Checking video URL: ${url}`);

        // 尝试多种方法验证URL
        let available = false;

        // 方法1: 尝试可读的 HEAD 请求（不使用 no-cors，便于读取状态码）
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            available = response.ok; // 必须为可读且 OK
            console.log(`[Background] HEAD check for ${url}: available=${available}, status=${response.status}`);

            if (available) {
                sendResponse({ success: true, available: true });
                return;
            }
        } catch (headError: any) {
            console.log(`[Background] HEAD request failed for ${url}:`, headError?.message);
        }

        // 方法2: 尝试带 Range 的 GET（读取状态码，允许 200/206）
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1023'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            available = response.ok || response.status === 206;
            console.log(`[Background] Range GET check for ${url}: available=${available}, status=${response.status}`);

            if (available) {
                sendResponse({ success: true, available: true });
                return;
            }
        } catch (rangeError: any) {
            console.log(`[Background] Range GET failed for ${url}:`, rangeError?.message);
        }

        // 方法3: 对于视频文件，尝试创建video元素测试
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('.avi')) {
            try {
                // 这个方法在background script中不可用，跳过
                console.log(`[Background] Video URL detected, but cannot test in background: ${url}`);
            } catch (videoError: any) {
                console.log(`[Background] Video test failed for ${url}:`, videoError?.message);
            }
        }

        // 方法4: 基于域名的启发式判断
        const knownBadDomains = [
            'smovie.caribbeancom.com',
            'smovie.1pondo.tv',
            'smovie.10musume.com',
            'fms.pacopacomama.com'
        ];

        const isKnownBad = knownBadDomains.some(domain => url.includes(domain));

        if (isKnownBad) {
            console.log(`[Background] Known problematic domain for ${url}, marking unavailable`);
            available = false;
        } else {
            console.log(`[Background] Unknown or not explicitly allowed domain for ${url}, defaulting to unavailable`);
            available = false; // 保守处理，避免误判
        }

        sendResponse({ success: true, available });
    } catch (error: any) {
        console.error(`[Background] Failed to check video URL ${message.url}:`, error);
        sendResponse({ success: false, available: false });
    }
}

// 从JavSpyl获取预览视频
async function handleFetchJavSpylPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { code } = message;
        if (!code) {
            sendResponse({ success: false, error: 'No code provided' });
            return;
        }

        console.log(`[Background] Fetching JavSpyl preview for: ${code}`);

        const response = await fetch('https://v2.javspyl.tk/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://javspyl.tk',
                'Referer': 'https://javspyl.tk/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({ ID: code })
        });

        console.log(`[Background] JavSpyl API response status: ${response.status}`);

        if (!response.ok) {
            console.log(`[Background] JavSpyl API request failed: ${response.status} ${response.statusText}`);
            sendResponse({ success: false, error: `API request failed: ${response.status}` });
            return;
        }

        const data = await response.json();
        console.log(`[Background] JavSpyl API response data:`, data);

        const videoUrl = data?.info?.url;

        if (!videoUrl) {
            console.log(`[Background] No video URL found in JavSpyl response for ${code}`);
            sendResponse({ success: false, error: 'No video URL found in response' });
            return;
        }

        if (/\.m3u8?$/i.test(videoUrl)) {
            console.log(`[Background] JavSpyl returned m3u8 URL, skipping: ${videoUrl}`);
            sendResponse({ success: false, error: 'M3U8 format not supported' });
            return;
        }

        const finalUrl = videoUrl.includes('//') ? videoUrl : `https://${videoUrl}`;
        console.log(`[Background] JavSpyl final video URL: ${finalUrl}`);

        // 简化验证 - 直接返回URL，让前端处理
        sendResponse({ success: true, videoUrl: finalUrl });
    } catch (error: any) {
        console.error(`[Background] Failed to fetch JavSpyl preview for ${message.code}:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

// 从AVPreview获取预览视频
async function handleFetchAVPreviewPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { code } = message;
        if (!code) {
            sendResponse({ success: false, error: 'No code provided' });
            return;
        }

        // 第一步：搜索视频
        const searchResponse = await fetch(`https://avpreview.com/zh/search?keywords=${code}`);
        if (!searchResponse.ok) {
            sendResponse({ success: false, error: 'Search request failed' });
            return;
        }

        const searchHtml = await searchResponse.text();
        const parser = new DOMParser();
        const searchDoc = parser.parseFromString(searchHtml, 'text/html');

        // 查找匹配的视频
        const videoBoxes = Array.from(searchDoc.querySelectorAll('.container .videobox'));
        const matchedBox = videoBoxes.find(item => {
            const titleElement = item.querySelector('h2 strong');
            return titleElement && titleElement.textContent === code;
        });

        if (!matchedBox) {
            sendResponse({ success: false, error: 'Video not found in search results' });
            return;
        }

        const detailLink = matchedBox.querySelector('a')?.getAttribute('href');
        if (!detailLink) {
            sendResponse({ success: false, error: 'No detail link found' });
            return;
        }

        const contentId = detailLink.split('/').pop();
        if (!contentId) {
            sendResponse({ success: false, error: 'No content ID found' });
            return;
        }

        // 第二步：获取视频详情
        const apiUrl = new URL('https://avpreview.com/API/v1.0/index.php');
        apiUrl.searchParams.set('system', 'videos');
        apiUrl.searchParams.set('action', 'detail');
        apiUrl.searchParams.set('contentid', contentId);
        apiUrl.searchParams.set('sitecode', 'avpreview');
        apiUrl.searchParams.set('ip', '');
        apiUrl.searchParams.set('token', '');

        const apiResponse = await fetch(apiUrl.toString());
        if (!apiResponse.ok) {
            sendResponse({ success: false, error: 'API detail request failed' });
            return;
        }

        const apiData = await apiResponse.json();
        let trailerUrl = apiData?.videos?.trailer;

        if (!trailerUrl) {
            sendResponse({ success: false, error: 'No trailer URL found' });
            return;
        }

        // 转换URL格式
        trailerUrl = trailerUrl.replace('/hlsvideo/', '/litevideo/').replace('/playlist.m3u8', '');
        const finalContentId = trailerUrl.split('/').pop();

        // 尝试不同的视频格式
        const videoUrls = [
            `${trailerUrl}/${finalContentId}_dmb_w.mp4`,
            `${trailerUrl}/${finalContentId}_mhb_w.mp4`,
            `${trailerUrl}/${finalContentId}_dm_w.mp4`,
            `${trailerUrl}/${finalContentId}_sm_w.mp4`,
        ];

        // 检查哪个URL可用
        for (const url of videoUrls) {
            try {
                const checkResponse = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                const available = checkResponse.ok || checkResponse.type === 'opaque';
                if (available) {
                    sendResponse({ success: true, videoUrl: url });
                    return;
                }
            } catch (err) {
                // ignore and try next
            }
        }

        // 所有尝试都失败了
        sendResponse({ success: false, error: 'No accessible video URL found' });
        return;
    } catch (error: any) {
        console.error(`[Background] Failed to fetch AVPreview preview for ${message.code}:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

chrome.runtime.onStartup.addListener(async () => {
    setupAlarms();
    triggerAutoSync();

    // 初始化新作品调度器
    try {
        await newWorksScheduler.initialize();
    } catch (error: any) {
        logger.error('初始化新作品调度器失败:', error);
    }
});