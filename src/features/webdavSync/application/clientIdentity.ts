/**
 * @file clientIdentity.ts
 * @description clientIdentity
 * @module features/webdavSync
 */
import type { WebDAVClientProfile } from '../domain/types';

export interface WebDAVSettingsAdapter {
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
}

const UUID_BYTE_LENGTH = 16;

export function createUuidLike(): string {
  try {
    const cryptoProvider = globalThis.crypto;
    if (typeof cryptoProvider?.randomUUID === 'function') {
      return cryptoProvider.randomUUID();
    }
  } catch {}

  return formatUuidFromBytes(getRandomUuidBytes());
}

function getRandomUuidBytes(): Uint8Array {
  try {
    const cryptoProvider = globalThis.crypto;
    if (typeof cryptoProvider?.getRandomValues === 'function') {
      const bytes = new Uint8Array(UUID_BYTE_LENGTH);
      cryptoProvider.getRandomValues(bytes);
      return bytes;
    }
  } catch {}

  const bytes = new Uint8Array(UUID_BYTE_LENGTH);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function formatUuidFromBytes(sourceBytes: Uint8Array): string {
  const bytes = new Uint8Array(sourceBytes.slice(0, UUID_BYTE_LENGTH));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export function detectBrowserName(): string {
  try {
    const ua = navigator.userAgent || '';
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\//i.test(ua)) return 'Opera';
    if (/Brave\//i.test(ua)) return 'Brave';
    if (/Chrome\//i.test(ua)) return 'Chrome';
  } catch {}
  return 'Unknown Chromium';
}

export function getPlatformName(): string {
  try {
    const platform = navigator.platform || '';
    return platform || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getExtensionVersion(): string {
  try {
    return chrome.runtime.getManifest()?.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function sanitizeDeviceLabel(value: string): string {
  const trimmed = String(value || '').trim();
  return trimmed || detectBrowserName();
}

export async function ensureWebDAVClientIdentity(adapter: WebDAVSettingsAdapter): Promise<any> {
  const settings = await adapter.getSettings();
  const nextSettings = { ...settings, webdav: { ...(settings.webdav || {}) } } as any;
  let changed = false;

  if (!nextSettings.webdav.clientId) {
    nextSettings.webdav.clientId = createUuidLike();
    changed = true;
  }
  if (!nextSettings.webdav.clientInstalledAt) {
    nextSettings.webdav.clientInstalledAt = new Date().toISOString();
    changed = true;
  }

  const detectedBrowser = detectBrowserName();
  if (!nextSettings.webdav.browserName) {
    nextSettings.webdav.browserName = detectedBrowser;
    changed = true;
  }

  if (!nextSettings.webdav.deviceLabel) {
    nextSettings.webdav.deviceLabel = detectedBrowser;
    changed = true;
  }

  if (changed) {
    await adapter.saveSettings(nextSettings);
    return nextSettings;
  }
  return settings;
}

export function getWebDAVClientProfile(settings: any, overrides?: Partial<WebDAVClientProfile>): WebDAVClientProfile {
  const webdav = settings?.webdav || {};
  const resolvedClientId = String(overrides?.clientId || webdav.clientId || createUuidLike()).trim();
  return {
    clientId: resolvedClientId,
    deviceLabel: sanitizeDeviceLabel(String(overrides?.deviceLabel || webdav.deviceLabel || '')),
    browserName: String(overrides?.browserName || webdav.browserName || detectBrowserName()).trim() || 'Unknown Chromium',
    platform: String(overrides?.platform || getPlatformName()).trim(),
    extensionVersion: String(overrides?.extensionVersion || getExtensionVersion()).trim(),
    installedAt: String(overrides?.installedAt || webdav.clientInstalledAt || new Date().toISOString()),
    lastSeenAt: String(overrides?.lastSeenAt || webdav.clientLastSeenAt || '').trim() || undefined,
    lastSyncAt: String(overrides?.lastSyncAt || webdav.clientLastSyncAt || '').trim() || undefined,
    lastSyncStatus: (overrides?.lastSyncStatus || webdav.clientLastSyncStatus || undefined) as any,
    lastUploadId: String(overrides?.lastUploadId || webdav.clientLastUploadId || '').trim() || undefined,
    disabled: overrides?.disabled || false,
  };
}
