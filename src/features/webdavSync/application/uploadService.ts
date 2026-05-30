import JSZip from 'jszip';
import { buildUploadId, DEFAULT_UPLOAD_INDEX_LIMIT, normalizeWebDavBaseUrl } from '../domain/paths';
import type { WebDAVUploadIndexItem } from '../domain/types';
import type { WebDAVClientLog } from '../infrastructure/webdavClient';
import { ensureWebDAVSupportDirs } from '../infrastructure/webdavClient';
import { getWebDAVClientProfile } from './clientIdentity';
import { updateWebDAVClientRegistry } from './clientRegistry';
import { byteSizeOf, collectBackupData } from './backupCollector';
import { appendWebDAVUploadIndex } from './uploadIndex';
import { cleanupOldBackups } from './cleanupService';

export interface WebDAVUploadServiceOptions {
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
  logger?: WebDAVClientLog;
}

export async function performWebDAVUpload(options: WebDAVUploadServiceOptions): Promise<{ success: boolean; error?: string }> {
  const logger = options.logger;
  logger?.('INFO', 'Attempting to perform WebDAV upload.');
  const settings = await options.getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) {
    const errorMsg = 'WebDAV is not enabled or URL is not configured.';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const dataToExport = await collectBackupData({ logger });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const filename = `javdb-extension-backup-${date}-${hour}-${minute}-${second}.zip`;

    let fileUrl = normalizeWebDavBaseUrl(settings.webdav.url);
    const baseUrl = fileUrl;
    const auth = { username: settings.webdav.username, password: settings.webdav.password };

    try {
      await ensureWebDAVSupportDirs(fileUrl, settings.webdav.username, settings.webdav.password, { logger });
    } catch (dirError: any) {
      logger?.('WARN', 'Failed to ensure directory exists, will try upload anyway', { error: dirError.message });
    }

    fileUrl += filename.startsWith('/') ? filename.substring(1) : filename;

    const zip = new JSZip();
    const backupJson = JSON.stringify(dataToExport, null, 2);
    const backupJsonBytes = byteSizeOf(backupJson);
    zip.file('backup.json', backupJson);
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    try { logger?.('INFO', 'Backup package prepared', { jsonBytes: backupJsonBytes, zipBytes: (zipBlob as any)?.size }); } catch {}
    try { logger?.('DEBUG', 'Backup stats summary', (dataToExport as any)?.stats || {}); } catch {}

    logger?.('INFO', `Uploading to ${fileUrl}`, { zipBytes: (zipBlob as any)?.size });
    const response = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });
    if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);

    const uploadedAt = new Date().toISOString();
    const clientProfile = getWebDAVClientProfile(settings, {
      lastSeenAt: uploadedAt,
      lastSyncAt: uploadedAt,
      lastSyncStatus: 'success',
    });
    const uploadId = buildUploadId(clientProfile.clientId, uploadedAt);
    clientProfile.lastUploadId = uploadId;

    try {
      await updateWebDAVClientRegistry(baseUrl, auth, clientProfile);
    } catch (registryError: any) {
      logger?.('WARN', 'Failed to update WebDAV client registry', { error: registryError?.message });
    }

    try {
      const uploadIndexItem: WebDAVUploadIndexItem = {
        uploadId,
        uploadedAt,
        clientId: clientProfile.clientId,
        deviceLabel: clientProfile.deviceLabel,
        browserName: clientProfile.browserName,
        type: 'full',
        status: 'success',
        file: filename,
        recordCount: Object.keys((dataToExport as any)?.data || (dataToExport as any)?.viewed || {}).length,
        dataVersion: Number((dataToExport as any)?.version || 1),
      };
      await appendWebDAVUploadIndex(baseUrl, auth, uploadIndexItem, Number(settings.webdav.uploadIndexLimit ?? DEFAULT_UPLOAD_INDEX_LIMIT));
    } catch (indexError: any) {
      logger?.('WARN', 'Failed to update WebDAV upload index', { error: indexError?.message });
    }

    const updatedSettings = await options.getSettings();
    updatedSettings.webdav.lastSync = new Date().toISOString();
    updatedSettings.webdav.clientLastSeenAt = uploadedAt;
    updatedSettings.webdav.clientLastSyncAt = uploadedAt;
    updatedSettings.webdav.clientLastSyncStatus = 'success';
    updatedSettings.webdav.clientLastUploadId = uploadId;

    const activeConfigId = updatedSettings.webdav.activeConfigId;
    if (activeConfigId && updatedSettings.webdav.configs) {
      const configIndex = updatedSettings.webdav.configs.findIndex((c: { id: string }) => c.id === activeConfigId);
      if (configIndex !== -1) {
        updatedSettings.webdav.configs[configIndex].lastSync = updatedSettings.webdav.lastSync;
      }
    }

    await options.saveSettings(updatedSettings);
    logger?.('INFO', 'WebDAV upload successful, updated last sync time.');

    try {
      const retentionCount = Number(updatedSettings.webdav.retentionDays ?? 10);
      if (!isNaN(retentionCount) && retentionCount > 0) {
        await cleanupOldBackups(retentionCount, { getSettings: options.getSettings, logger });
      }
    } catch (e: any) {
      logger?.('WARN', 'Failed to cleanup old WebDAV backups', { error: e?.message });
    }

    return { success: true };
  } catch (error: any) {
    logger?.('ERROR', 'WebDAV upload failed.', { error: error.message });
    return { success: false, error: error.message };
  }
}
