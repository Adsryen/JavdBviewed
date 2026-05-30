import type { WebDAVClientProfile } from '../domain/types';

export interface WebDAVSettingsAdapter {
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
}

export function createUuidLike(): string {
  try {
    return crypto.randomUUID();
  } catch {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `wd-${Date.now().toString(36)}-${randomPart}`;
  }
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
