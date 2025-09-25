// src/background/webdav.ts
// 抽离 WebDAV 相关功能与消息路由

import JSZip from 'jszip';
import { getSettings, setValue, getValue, saveSettings } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import { quickDiagnose, type DiagnosticResult } from '../utils/webdavDiagnostic';

// 背景日志封装：转发到 background 的 log-message 处理
function bgLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): void {
  try { chrome.runtime.sendMessage({ type: 'log-message', payload: { level, message, data } }); } catch {}
}

interface WebDAVFile {
  name: string;
  path: string;
  lastModified: string;
  isDirectory: boolean;
  size?: number;
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
    const recordsToSync = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
    const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
    const actorRecords = await getValue(STORAGE_KEYS.ACTOR_RECORDS, {});
    const logs = await getValue(STORAGE_KEYS.LOGS, []);
    const importStats = await getValue(STORAGE_KEYS.LAST_IMPORT_STATS, null);

    const dataToExport = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      settings: settings,
      data: recordsToSync,
      userProfile: userProfile,
      actorRecords: actorRecords,
      logs: logs,
      importStats: importStats,
      newWorks: {
        subscriptions: await getValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {}),
        records: await getValue(STORAGE_KEYS.NEW_WORKS_RECORDS, {}),
        config: await getValue(STORAGE_KEYS.NEW_WORKS_CONFIG, {}),
      },
    };

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
    fileUrl += filename.startsWith('/') ? filename.substring(1) : filename;

    const zip = new JSZip();
    zip.file('backup.json', JSON.stringify(dataToExport, null, 2));
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });

    bgLog('INFO', `Uploading to ${fileUrl}`);
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

async function performRestore(filename: string, options = {
  restoreSettings: true,
  restoreRecords: true,
  restoreUserProfile: true,
  restoreActorRecords: true,
  restoreLogs: false,
  restoreImportStats: false,
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
      await setValue(STORAGE_KEYS.LOGS, importData.logs);
      bgLog('INFO', 'Restored logs', { logCount: Array.isArray(importData.logs) ? importData.logs.length : 0 });
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
        case 'webdav-restore': {
          const { filename, options, preview } = message;
          const restoreOptions = { ...options, preview: preview || false };
          performRestore(filename, restoreOptions).then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
          return true;
        }
        case 'webdav-test':
          testWebDAVConnection().then(sendResponse).catch((e) => sendResponse({ success: false, error: e?.message }));
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
