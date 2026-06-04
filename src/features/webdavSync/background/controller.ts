// src/features/webdavSync/background/controller.ts
// WebDAV 后台装配层。

import { getSettings, saveSettings } from '../../../utils/storage';
import {
  getClientFilePath,
  normalizeWebDavBaseUrl,
} from '../domain/paths';
import type {
  WebDAVClientProfile,
  WebDAVFile,
} from '../domain/types';
import {
  ensureWebDAVClientIdentity as ensureWebDAVClientIdentityCore,
  getWebDAVClientProfile,
  sanitizeDeviceLabel,
} from '../application/clientIdentity';
import {
  listWebDAVClientProfiles,
  readWebDAVClientProfile,
  updateWebDAVClientRegistry,
} from '../application/clientRegistry';
import {
  ensureWebDAVSupportDirs,
  webDavWriteJsonFile,
} from '../infrastructure/webdavClient';
import {
  collectBackupData as collectWebDAVBackupData,
} from '../application/backupCollector';
import { listWebDAVFiles } from '../application/cleanupService';
import { performWebDAVUpload } from '../application/uploadService';
import {
  downloadBackupFileAsBase64 as downloadBackupFileAsBase64Core,
  previewBackup as previewBackupCore,
} from '../application/restorePreview';
import {
  applyImportDataDirect as applyImportDataDirectCore,
  performRestoreUnified as performRestoreUnifiedCore,
} from '../application/restoreService';
import {
  diagnoseWebDAVConnection as diagnoseWebDAVConnectionCore,
  testWebDAVConnection as testWebDAVConnectionCore,
  testWebDAVConnectionWithConfig as testWebDAVConnectionWithConfigCore,
} from '../application/diagnostics';
import { registerWebDAVRouterListener } from './router';

export {
  buildUploadId,
  joinWebDavUrl,
  normalizeWebDavBaseUrl,
} from '../domain/paths';
export { sanitizeDeviceLabel } from '../application/clientIdentity';
export { isUserBackupFile, parseWebDAVResponse } from '../infrastructure/propfindParser';
export { byteSizeOf, omitLocalOnlyStorageKeys } from '../application/backupCollector';
export { buildNextWebDAVUploadIndex } from '../application/uploadIndex';
export { sanitizeImportedSettings } from '../application/importSanitizer';
export { buildBackupPreview } from '../application/restorePreview';
export { chunk, toArrayFromObjMap } from '../application/restoreStorage';
export { buildWebDAVDiagnosticConfig } from '../application/diagnostics';

function bgLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): void {
  try { chrome.runtime.sendMessage({ type: 'log-message', payload: { level, message, data } }); } catch {}
}

let webdavAutoUploadInProgress = false;

async function ensureWebDAVClientIdentity(): Promise<any> {
  return ensureWebDAVClientIdentityCore({ getSettings, saveSettings });
}

async function listWebDAVClients(): Promise<{ success: boolean; clients?: WebDAVClientProfile[]; error?: string }> {
  const settings = await ensureWebDAVClientIdentity();
  const webdav = settings.webdav || {};
  if (!webdav.enabled || !webdav.url || !webdav.username || !webdav.password) {
    return { success: false, error: 'WebDAV connection details are not fully configured.' };
  }

  const baseUrl = normalizeWebDavBaseUrl(webdav.url);
  try {
    const clients = await listWebDAVClientProfiles(baseUrl, { username: webdav.username, password: webdav.password });
    return { success: true, clients };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to list WebDAV clients.' };
  }
}

async function getCurrentWebDAVClientProfile(): Promise<{ success: boolean; profile?: WebDAVClientProfile; error?: string }> {
  try {
    const settings = await ensureWebDAVClientIdentity();
    let profile = getWebDAVClientProfile(settings);
    const webdav = settings.webdav || {};

    const canReadCloudProfile = webdav.enabled && webdav.url && webdav.username && webdav.password;
    if (canReadCloudProfile) {
      try {
        const cloudProfile = await readWebDAVClientProfile(
          normalizeWebDavBaseUrl(webdav.url),
          { username: webdav.username, password: webdav.password },
          profile.clientId,
        );
        if (cloudProfile) {
          const mergedDeviceLabel = String(cloudProfile.deviceLabel || profile.deviceLabel || '').trim() || profile.deviceLabel;
          const mergedLastSeenAt = profile.lastSeenAt || cloudProfile.lastSeenAt;
          const mergedLastSyncAt = profile.lastSyncAt || cloudProfile.lastSyncAt;
          const mergedLastSyncStatus = profile.lastSyncStatus || cloudProfile.lastSyncStatus;
          const mergedLastUploadId = profile.lastUploadId || cloudProfile.lastUploadId;

          profile = {
            ...profile,
            deviceLabel: mergedDeviceLabel,
            lastSeenAt: mergedLastSeenAt,
            lastSyncAt: mergedLastSyncAt,
            lastSyncStatus: mergedLastSyncStatus,
            lastUploadId: mergedLastUploadId,
          };

          const shouldPersistDeviceLabel = mergedDeviceLabel && mergedDeviceLabel !== settings.webdav?.deviceLabel;
          const shouldPersistLastSeenAt = !!mergedLastSeenAt && mergedLastSeenAt !== settings.webdav?.clientLastSeenAt;
          const shouldPersistLastSyncAt = !!mergedLastSyncAt && mergedLastSyncAt !== settings.webdav?.clientLastSyncAt;
          const shouldPersistLastSyncStatus = !!mergedLastSyncStatus && mergedLastSyncStatus !== settings.webdav?.clientLastSyncStatus;
          const shouldPersistLastUploadId = !!mergedLastUploadId && mergedLastUploadId !== settings.webdav?.clientLastUploadId;

          if (shouldPersistDeviceLabel || shouldPersistLastSeenAt || shouldPersistLastSyncAt || shouldPersistLastSyncStatus || shouldPersistLastUploadId) {
            const nextSettings = {
              ...settings,
              webdav: {
                ...(settings.webdav || {}),
                deviceLabel: mergedDeviceLabel || settings.webdav?.deviceLabel || '',
                clientLastSeenAt: mergedLastSeenAt || settings.webdav?.clientLastSeenAt || '',
                clientLastSyncAt: mergedLastSyncAt || settings.webdav?.clientLastSyncAt || '',
                clientLastSyncStatus: mergedLastSyncStatus || settings.webdav?.clientLastSyncStatus || '',
                clientLastUploadId: mergedLastUploadId || settings.webdav?.clientLastUploadId || '',
              },
            } as any;
            await saveSettings(nextSettings);
          }
        }
      } catch {}
    }

    return { success: true, profile };
  } catch (error: any) {
    return { success: false, error: error?.message || '获取当前客户端信息失败。' };
  }
}

async function updateCurrentWebDAVDeviceLabel(deviceLabel: string): Promise<{ success: boolean; profile?: WebDAVClientProfile; error?: string }> {
  try {
    const trimmedLabel = String(deviceLabel || '').trim();
    if (!trimmedLabel) return { success: false, error: '设备名称不能为空。' };

    const settings = await ensureWebDAVClientIdentity();
    const nextSettings = { ...settings, webdav: { ...(settings.webdav || {}), deviceLabel: trimmedLabel } } as any;
    await saveSettings(nextSettings);

    const profile = getWebDAVClientProfile(nextSettings, {
      deviceLabel: trimmedLabel,
      lastSeenAt: new Date().toISOString(),
    });

    const webdav = nextSettings.webdav || {};
    if (webdav.enabled && webdav.url && webdav.username && webdav.password) {
      try {
        const baseUrl = normalizeWebDavBaseUrl(webdav.url);
        await ensureWebDAVSupportDirs(baseUrl, webdav.username, webdav.password, { logger: bgLog });
        await updateWebDAVClientRegistry(baseUrl, { username: webdav.username, password: webdav.password }, profile);
      } catch (error: any) {
        bgLog('WARN', 'Failed to sync device label to WebDAV client registry', { error: error?.message });
      }
    }

    return { success: true, profile };
  } catch (error: any) {
    return { success: false, error: error?.message || '更新设备名称失败。' };
  }
}

async function updateWebDAVClientDeviceLabel(clientId: string, deviceLabel: string): Promise<{ success: boolean; profile?: WebDAVClientProfile; error?: string }> {
  try {
    const trimmedClientId = String(clientId || '').trim();
    const trimmedLabel = String(deviceLabel || '').trim();
    if (!trimmedClientId) return { success: false, error: '设备 ID 不能为空。' };
    if (!trimmedLabel) return { success: false, error: '设备名称不能为空。' };

    const settings = await ensureWebDAVClientIdentity();
    const webdav = settings.webdav || {};
    if (!webdav.enabled || !webdav.url || !webdav.username || !webdav.password) {
      return { success: false, error: 'WebDAV 连接尚未配置完整。' };
    }

    const baseUrl = normalizeWebDavBaseUrl(webdav.url);
    const auth = { username: webdav.username, password: webdav.password };
    const filePath = getClientFilePath(trimmedClientId);
    const existing = await readWebDAVClientProfile(baseUrl, auth, trimmedClientId);
    if (!existing) return { success: false, error: '未找到对应的云端设备记录。' };

    const nextProfile: WebDAVClientProfile = {
      ...existing,
      clientId: trimmedClientId,
      deviceLabel: trimmedLabel,
    };
    await webDavWriteJsonFile(baseUrl, auth, filePath, nextProfile);

    const currentClientId = String(settings.webdav?.clientId || '').trim();
    if (currentClientId && currentClientId === trimmedClientId) {
      const nextSettings = { ...settings, webdav: { ...(settings.webdav || {}), deviceLabel: trimmedLabel } } as any;
      await saveSettings(nextSettings);
    }

    return { success: true, profile: nextProfile };
  } catch (error: any) {
    return { success: false, error: error?.message || '更新云端设备名称失败。' };
  }
}

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

async function previewBackup(filename: string): Promise<{ success: boolean; error?: string; preview?: any; raw?: any }> {
  return previewBackupCore(filename, { getSettings });
}

async function collectBackupData(): Promise<any> {
  return collectWebDAVBackupData({ logger: bgLog });
}

async function performUpload(): Promise<{ success: boolean; error?: string }> {
  return performWebDAVUpload({ getSettings, saveSettings, logger: bgLog });
}

async function applyImportDataDirect(importData: any, options?: Parameters<typeof applyImportDataDirectCore>[1]): Promise<{ success: boolean; error?: string; summary?: any }> {
  return applyImportDataDirectCore(importData, options, { logger: bgLog });
}

async function performRestoreUnified(filename: string, options?: Parameters<typeof performRestoreUnifiedCore>[1]): Promise<{ success: boolean; error?: string; summary?: any }> {
  return performRestoreUnifiedCore(filename, options, { logger: bgLog });
}

async function listFiles(): Promise<{ success: boolean; error?: string; files?: WebDAVFile[] }> {
  return listWebDAVFiles({ getSettings, logger: bgLog });
}

async function testWebDAVConnection(): Promise<{ success: boolean; error?: string }> {
  return testWebDAVConnectionCore({ getSettings, logger: bgLog });
}

async function testWebDAVConnectionWithConfig(config: { url: string; username: string; password: string }): Promise<{ success: boolean; error?: string }> {
  return testWebDAVConnectionWithConfigCore(config, { getSettings, logger: bgLog });
}

async function diagnoseWebDAVConnection(): Promise<any> {
  return diagnoseWebDAVConnectionCore({ getSettings, logger: bgLog });
}

async function downloadBackupFileAsBase64(filename: string): Promise<{ success: boolean; base64?: string; filename?: string; error?: string }> {
  return downloadBackupFileAsBase64Core(filename, { getSettings });
}

export function registerWebDAVRouter(): void {
  registerWebDAVRouterListener({
    listFiles,
    previewBackup,
    performRestoreUnified,
    testWebDAVConnection,
    testWebDAVConnectionWithConfig,
    diagnoseWebDAVConnection,
    performUpload,
    getCurrentWebDAVClientProfile,
    listWebDAVClients,
    updateCurrentWebDAVDeviceLabel,
    updateWebDAVClientDeviceLabel,
    collectBackupData,
    downloadBackupFileAsBase64,
    applyImportDataDirect,
  });
}
