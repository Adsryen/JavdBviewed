/**
 * @file cloudSettingsStorage.ts
 * @description Cloud 连接配置（baseUrl / 设备名）本地持久化
 * @module features/cloudSync
 */

export const CLOUD_SETTINGS_STORAGE_KEY = 'cloud_sync_settings_v1';

export type CloudConnectionSettings = {
  /** Cloud 根地址，如 http://127.0.0.1:8080 */
  baseUrl: string;
  /** 本机设备显示名 */
  deviceLabel: string;
  /** 稳定设备 id（本机生成一次） */
  deviceId: string;
  updatedAt: number;
};

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultCloudSettings(): CloudConnectionSettings {
  return {
    baseUrl: 'http://127.0.0.1:8080',
    deviceLabel: '浏览器扩展',
    deviceId: randomId(),
    updatedAt: Date.now(),
  };
}

export async function loadCloudSettings(): Promise<CloudConnectionSettings> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([CLOUD_SETTINGS_STORAGE_KEY], (res) => {
        const v = res?.[CLOUD_SETTINGS_STORAGE_KEY] as Partial<CloudConnectionSettings> | undefined;
        const defaults = createDefaultCloudSettings();
        if (!v || typeof v !== 'object') {
          resolve(defaults);
          return;
        }
        resolve({
          baseUrl: typeof v.baseUrl === 'string' && v.baseUrl.trim() ? v.baseUrl.trim() : defaults.baseUrl,
          deviceLabel:
            typeof v.deviceLabel === 'string' && v.deviceLabel.trim()
              ? v.deviceLabel.trim()
              : defaults.deviceLabel,
          deviceId:
            typeof v.deviceId === 'string' && v.deviceId.trim() ? v.deviceId.trim() : defaults.deviceId,
          updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : Date.now(),
        });
      });
    } catch {
      resolve(createDefaultCloudSettings());
    }
  });
}

export async function saveCloudSettings(
  patch: Partial<CloudConnectionSettings>,
): Promise<CloudConnectionSettings> {
  const current = await loadCloudSettings();
  const next: CloudConnectionSettings = {
    ...current,
    ...patch,
    baseUrl: (patch.baseUrl ?? current.baseUrl).trim().replace(/\/+$/, ''),
    deviceLabel: (patch.deviceLabel ?? current.deviceLabel).trim() || current.deviceLabel,
    deviceId: (patch.deviceId ?? current.deviceId).trim() || current.deviceId,
    updatedAt: Date.now(),
  };
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [CLOUD_SETTINGS_STORAGE_KEY]: next }, () => resolve(next));
    } catch {
      resolve(next);
    }
  });
}

/** 规范化用户输入的 base URL */
export function normalizeCloudBaseUrl(input: string): string {
  const t = input.trim();
  if (!t) return '';
  try {
    const u = new URL(t.includes('://') ? t : `http://${t}`);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}` || `${u.protocol}//${u.host}`;
  } catch {
    return t.replace(/\/+$/, '');
  }
}
