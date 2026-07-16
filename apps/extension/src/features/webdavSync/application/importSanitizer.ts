/**
 * @file importSanitizer.ts
 * @description importSanitizer
 * @module features/webdavSync
 */
import type { WebDAVClientProfile, WebDAVKnownDevice } from '../domain/types';
import { mergeKnownDevices } from './deviceRegistry';

export function sanitizeImportedSettings(importedSettings: any, currentSettings: any): any {
  if (!importedSettings || typeof importedSettings !== 'object') return importedSettings;
  const next = { ...importedSettings, webdav: { ...(importedSettings.webdav || {}) } };
  const currentWebdav = currentSettings?.webdav || {};
  next.webdav.clientId = currentWebdav.clientId || next.webdav.clientId || '';
  next.webdav.deviceLabel = currentWebdav.deviceLabel || next.webdav.deviceLabel || '';
  next.webdav.browserName = currentWebdav.browserName || next.webdav.browserName || '';
  next.webdav.clientInstalledAt = currentWebdav.clientInstalledAt || next.webdav.clientInstalledAt || '';
  const now = Date.now();
  next.webdav.knownDevices = mergeKnownDevices(
    [
      ...readKnownDevices(currentWebdav.knownDevices),
      ...readKnownDevices(importedSettings.webdav?.knownDevices),
    ],
    [],
    {
      currentProfile: buildCurrentProfile(next.webdav),
      now,
    },
  );
  return next;
}

function readKnownDevices(value: unknown): WebDAVKnownDevice[] {
  return Array.isArray(value) ? value as WebDAVKnownDevice[] : [];
}

function buildCurrentProfile(webdav: any): WebDAVClientProfile | undefined {
  const clientId = String(webdav?.clientId || '').trim();
  if (!clientId) return undefined;

  return {
    clientId,
    deviceLabel: String(webdav?.deviceLabel || clientId).trim() || clientId,
    browserName: String(webdav?.browserName || 'Unknown Chromium').trim() || 'Unknown Chromium',
    installedAt: String(webdav?.clientInstalledAt || '').trim() || undefined,
    lastSeenAt: String(webdav?.clientLastSeenAt || '').trim() || undefined,
    lastSyncAt: String(webdav?.clientLastSyncAt || '').trim() || undefined,
    lastSyncStatus: webdav?.clientLastSyncStatus || undefined,
    lastUploadId: String(webdav?.clientLastUploadId || '').trim() || undefined,
  };
}
