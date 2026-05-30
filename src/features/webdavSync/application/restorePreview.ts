import JSZip from 'jszip';
import { byteSizeOf } from './backupCollector';

export interface WebDAVRestorePreviewOptions {
  getSettings: () => Promise<any>;
}

export function resolveWebDavUrl(filename: string, webdavBaseUrl: string): string {
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  if (filename.startsWith('/')) {
    const origin = new URL(webdavBaseUrl).origin;
    return new URL(filename, origin).href;
  }
  let base = webdavBaseUrl;
  if (!base.endsWith('/')) base += '/';
  return new URL(filename, base).href;
}

export async function parseBackupFromUrl(finalUrl: string, auth: { username: string; password: string }): Promise<any> {
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
  }
  const fileContents = await response.text();
  return JSON.parse(fileContents);
}

export function buildBackupPreview(importData: any): any {
  const stats = (importData && importData.stats) || {};
  return {
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
}

export async function previewBackup(filename: string, options: WebDAVRestorePreviewOptions): Promise<{ success: boolean; error?: string; preview?: any; raw?: any }> {
  try {
    const settings = await options.getSettings();
    const finalUrl = resolveWebDavUrl(filename, settings.webdav.url);
    const importData = await parseBackupFromUrl(finalUrl, { username: settings.webdav.username, password: settings.webdav.password });
    const preview = buildBackupPreview(importData);
    return { success: true, preview, raw: importData };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

export async function downloadBackupFileAsBase64(filename: string, options: WebDAVRestorePreviewOptions): Promise<{ success: boolean; base64?: string; filename?: string; error?: string }> {
  try {
    const settings = await options.getSettings();
    const url = resolveWebDavUrl(filename, settings.webdav.url);
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`) },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return { success: true, base64, filename };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}
