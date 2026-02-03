// storage.ts
// 封装 chrome.storage，兼容 GM_setValue/GM_getValue

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './config';
import type { ExtensionSettings } from '../types';
import { log } from './logController';

// --- Large object chunked storage helpers ---
// 说明：当单个键（如 'viewed'）对象过大时，写入 chrome.storage.local 可能触发
// Resource::kQuotaBytes quota exceeded。这里为特定键启用分片存储：
// - 写入时将大对象拆分为多个 chunk 键：__chunk__:<key>::<index>
// - 记录一个元信息键：__chunks_meta__:<key> => { chunks, totalEntries, updatedAt, version }
// - 读取时优先按 meta 组装；若 meta 不存在则回退至旧的单键结构

const LARGE_KEYS = new Set<string>(['viewed']);
const chunkPrefixFor = (key: string) => `__chunk__:${key}::`;
const chunkMetaFor = (key: string) => `__chunks_meta__:${key}`;

function encodeSize(obj: any): number {
  try {
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return new TextEncoder().encode(s).length;
  } catch {
    return 0;
  }
}

async function removeKeys(keys: string[]): Promise<void> {
  if (!keys || keys.length === 0) return;
  await new Promise<void>((resolve) => {
    chrome.storage.local.remove(keys, () => resolve());
  });
}

async function getAllKeys(): Promise<string[]> {
  return new Promise<string[]>((resolve) => {
    chrome.storage.local.get(null, (all) => resolve(Object.keys(all || {})));
  });
}

// 简易消息发送封装：用于在任何上下文（CS/BG/Options）向 BG 路由 DB 请求
function sendMessage<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: any;
    try {
      timer = setTimeout(() => reject(new Error(`message timeout: ${type}`)), timeoutMs);
    } catch {}
    
    // 检查 runtime 是否可用
    if (!chrome?.runtime?.id) {
      if (timer) clearTimeout(timer);
      reject(new Error('Extension context invalidated'));
      return;
    }
    
    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        if (timer) clearTimeout(timer);
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          // 静默处理连接错误，避免控制台报错
          reject(new Error(lastErr.message || 'runtime error'));
          return;
        }
        if (!resp || resp.success !== true) {
          reject(new Error(resp?.error || 'db error'));
          return;
        }
        resolve(resp as T);
      });
    } catch (e: any) {
      if (timer) clearTimeout(timer);
      reject(e);
    }
  });
}

async function setLargeObject(key: string, value: Record<string, any>): Promise<void> {
  const prefix = chunkPrefixFor(key);
  const metaKey = chunkMetaFor(key);

  // 空对象：只写 meta，后续清理旧数据
  const entries = Object.entries(value || {});

  // 采用保守上限，尽量避免触发配额（按 JSON 字节估算）
  const MAX_BYTES_PER_CHUNK = 400 * 1024; // 约 400KB
  let current: Record<string, any> = {};
  let currentSize = encodeSize({});
  const chunks: Array<Record<string, any>> = [];

  for (const [k, v] of entries) {
    const pair = { [k]: v } as Record<string, any>;
    const pairSize = encodeSize(pair);
    if (currentSize + pairSize > MAX_BYTES_PER_CHUNK && Object.keys(current).length > 0) {
      chunks.push(current);
      current = {};
      currentSize = encodeSize({});
    }
    Object.assign(current, pair);
    currentSize += pairSize;
  }
  if (Object.keys(current).length > 0) chunks.push(current);

  // 第一阶段：写入新分片与 meta（不删除旧数据，避免失败时丢失）
  if (chunks.length === 0) {
    await chrome.storage.local.set({ [metaKey]: { chunks: 0, totalEntries: 0, updatedAt: Date.now(), version: 1 } });
  } else {
    let i = 0;
    for (const chunk of chunks) {
      i++;
      await chrome.storage.local.set({ [`${prefix}${i}`]: chunk });
    }
    await chrome.storage.local.set({ [metaKey]: { chunks: chunks.length, totalEntries: entries.length, updatedAt: Date.now(), version: 1 } });
  }

  // 第二阶段：清理旧结构与多余分片（在新数据可用后进行）
  try {
    const keys = await getAllKeys();
    const stray = keys.filter(k => k === key || (k.startsWith(prefix) && !/__chunk__:[^:]+::\d+$/.test(k)));
    // 还需清理比新 chunks 数量更多的旧分片
    const extraChunkKeys = keys
      .filter(k => k.startsWith(prefix))
      .filter(k => {
        const num = Number(k.substring(prefix.length));
        return Number.isFinite(num) && num > chunks.length;
      });
    const toRemove = Array.from(new Set([...stray, ...extraChunkKeys]));
    if (toRemove.length) await removeKeys(toRemove);
  } catch {}
}

async function getLargeObject<T>(key: string, defaultValue: T): Promise<T> {
  const prefix = chunkPrefixFor(key);
  const metaKey = chunkMetaFor(key);

  // 先读 meta
  const meta = await new Promise<any>((resolve) => {
    chrome.storage.local.get([metaKey], (res) => resolve(res?.[metaKey]));
  });

  if (meta && typeof meta.chunks === 'number') {
    const n = meta.chunks as number;
    if (n <= 0) return {} as unknown as T;

    const chunkKeys = Array.from({ length: n }, (_v, idx) => `${prefix}${idx + 1}`);
    const data = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get(chunkKeys, (res) => resolve(res || {}));
    });
    const assembled: Record<string, any> = {};
    for (const ck of chunkKeys) {
      const part = data[ck];
      if (part && typeof part === 'object') Object.assign(assembled, part);
    }
    return assembled as unknown as T;
  }

  // 没有 meta，尝试读取旧的单键结构
  return new Promise<T>((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] !== undefined ? (result[key] as T) : defaultValue);
    });
  });
}

export async function setValue<T>(key: string, value: T): Promise<void> {
  if (LARGE_KEYS.has(key) && value && typeof value === 'object') {
    // 对大对象键启用分片写入
    try {
      await setLargeObject(key, value as any);
      return;
    } catch (e) {
      // 兜底：失败则退回到普通写入（可能再次触发配额错误）
      log.storage?.('Chunked set failed, fallback to direct set', { key, error: (e as any)?.message });
    }
  }
  return chrome.storage.local.set({ [key]: value });
}

export function getValue<T>(key: string, defaultValue: T): Promise<T> {
  if (LARGE_KEYS.has(key)) {
    // 优先尝试从 IndexedDB 读取（若已迁移），失败则回退至分片结构
    return new Promise<T>(async (resolve) => {
      try {
        const migrated = await new Promise<boolean>((res) => {
          chrome.storage.local.get([STORAGE_KEYS.IDB_MIGRATED], (r) => res(!!r[STORAGE_KEYS.IDB_MIGRATED]));
        });
        if (migrated) {
          try {
            const resp = await sendMessage<{ success: true; records: any[] }>('DB:VIEWED_GET_ALL');
            const obj: Record<string, any> = Object.create(null);
            const list = (resp as any).records as any[];
            if (Array.isArray(list)) {
              for (const r of list) {
                if (r && r.id) obj[r.id] = r;
              }
            }
            resolve(obj as unknown as T);
            return;
          } catch {}
        }
      } catch {}
      // 回退：从分片结构读取
      const v = await getLargeObject<T>(key, defaultValue);
      resolve(v);
    });
  }
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      const value = result[key];
      resolve((value !== undefined && value !== null ? value : defaultValue) as T);
    });
  });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const storedSettings = await getValue<Partial<ExtensionSettings>>(STORAGE_KEYS.SETTINGS, {});

  log.storage('Loading settings from storage', {
    key: STORAGE_KEYS.SETTINGS,
    hasStoredSettings: !!storedSettings,
    hasPrivacy: !!storedSettings.privacy
  });

  const mergedSettings: ExtensionSettings = {
    ...DEFAULT_SETTINGS,
    ...storedSettings,
    actorLibrary: {
      ...DEFAULT_SETTINGS.actorLibrary,
      ...(storedSettings.actorLibrary || {}),
      blacklist: {
        ...DEFAULT_SETTINGS.actorLibrary.blacklist,
        ...(storedSettings.actorLibrary?.blacklist || {}),
      },
    },
    display: {
      ...DEFAULT_SETTINGS.display,
      ...(storedSettings.display || {}),
    },
    webdav: {
      ...DEFAULT_SETTINGS.webdav,
      ...(storedSettings.webdav || {}),
    },
    dataSync: {
      ...DEFAULT_SETTINGS.dataSync,
      ...(storedSettings.dataSync || {}),
      urls: {
        ...DEFAULT_SETTINGS.dataSync.urls,
        ...(storedSettings.dataSync?.urls || {}),
      },
    },
    dataEnhancement: {
      ...DEFAULT_SETTINGS.dataEnhancement,
      ...(storedSettings.dataEnhancement || {}),
    },
    translation: {
      ...DEFAULT_SETTINGS.translation,
      ...(storedSettings.translation || {}),
      traditional: {
        ...DEFAULT_SETTINGS.translation.traditional,
        ...(storedSettings.translation?.traditional || {}),
      },
      ai: {
        ...DEFAULT_SETTINGS.translation.ai,
        ...(storedSettings.translation?.ai || {}),
      },
    },
    videoEnhancement: {
      ...DEFAULT_SETTINGS.videoEnhancement,
      ...((storedSettings as any).videoEnhancement || {}),
    },
    userExperience: {
      ...DEFAULT_SETTINGS.userExperience,
      ...(storedSettings.userExperience || {}),
    },
    contentFilter: {
      ...DEFAULT_SETTINGS.contentFilter,
      ...(storedSettings.contentFilter || {}),
    },
    drive115: {
      ...DEFAULT_SETTINGS.drive115,
      ...(storedSettings.drive115 || {}),
    },
    actorSync: {
      ...DEFAULT_SETTINGS.actorSync,
      ...(storedSettings.actorSync || {}),
      urls: {
        ...DEFAULT_SETTINGS.actorSync.urls,
        ...(storedSettings.actorSync?.urls || {}),
      },
    },
    privacy: {
      ...DEFAULT_SETTINGS.privacy,
      ...(storedSettings.privacy || {}),
      screenshotMode: {
        ...DEFAULT_SETTINGS.privacy.screenshotMode,
        ...(storedSettings.privacy?.screenshotMode || {}),
      },
      privateMode: {
        ...DEFAULT_SETTINGS.privacy.privateMode,
        ...(storedSettings.privacy?.privateMode || {}),
      },
      passwordRecovery: {
        ...DEFAULT_SETTINGS.privacy.passwordRecovery,
        ...(storedSettings.privacy?.passwordRecovery || {}),
      },
    },
    ai: {
      ...DEFAULT_SETTINGS.ai,
      ...(storedSettings.ai || {}),
    },
    insights: {
      ...DEFAULT_SETTINGS.insights,
      ...((storedSettings as any).insights || {}),
    },
    emby: {
      ...DEFAULT_SETTINGS.emby,
      ...(storedSettings.emby || {}),
      highlightStyle: {
        ...DEFAULT_SETTINGS.emby.highlightStyle,
        ...(storedSettings.emby?.highlightStyle || {}),
      },
    },
  };

  log.storage('Merged settings privacy config', mergedSettings.privacy);
  return mergedSettings;
}

export function saveSettings(settings: ExtensionSettings): Promise<void> {
  log.storage('Saving settings to storage', {
    key: STORAGE_KEYS.SETTINGS,
    hasPrivacy: !!settings.privacy,
    screenshotModeEnabled: settings.privacy?.screenshotMode?.enabled,
    protectedElementsCount: settings.privacy?.screenshotMode?.protectedElements?.length
  });
  return setValue(STORAGE_KEYS.SETTINGS, settings);
}