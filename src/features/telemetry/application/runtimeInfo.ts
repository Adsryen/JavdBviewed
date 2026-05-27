import type { TelemetryRuntimeInfo } from '../domain/types';

export function getTelemetryRuntimeInfo(): TelemetryRuntimeInfo {
  const manifest = getManifest();
  const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
  const userAgent = getUserAgent();

  return {
    version: String(env.VITE_APP_VERSION || manifest?.version || 'unknown'),
    build: toBuildNumber(env.VITE_APP_BUILD_NUMBER),
    browser: detectBrowserName(userAgent),
    browserVersion: detectBrowserVersion(userAgent),
    platform: detectPlatform(),
    locale: getLocale(),
    timezone: getTimezone(),
  };
}

function getManifest(): chrome.runtime.Manifest | undefined {
  try {
    return chrome.runtime.getManifest();
  } catch {
    return undefined;
  }
}

function getUserAgent(): string {
  try {
    return navigator.userAgent || '';
  } catch {
    return '';
  }
}

function detectBrowserName(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/Brave\//i.test(userAgent)) return 'Brave';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  return 'Unknown';
}

function detectBrowserVersion(userAgent: string): string | undefined {
  const match = userAgent.match(/(?:Chrome|Edg|OPR|Firefox)\/([\d.]+)/i);
  return match?.[1];
}

function detectPlatform(): string {
  try {
    const platform = String((navigator as any).userAgentData?.platform || navigator.platform || '').toLowerCase();
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'macos';
    if (platform.includes('linux')) return 'linux';
    if (platform.includes('android')) return 'android';
    if (platform.includes('iphone') || platform.includes('ipad') || platform.includes('ios')) return 'ios';
    return platform || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getLocale(): string | undefined {
  try {
    return navigator.language || undefined;
  } catch {
    return undefined;
  }
}

function getTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function toBuildNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}
