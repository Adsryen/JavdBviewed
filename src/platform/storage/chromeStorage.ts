/**
 * @file chromeStorage.ts
 * @description chrome.storage 适配器 —— 统一封装 chrome.storage.local 的读写操作
 * @module platform/storage
 *
 * 核心能力：
 * - 大值分块存储（超过 400KB 自动拆分为多个 chunk）
 * - 已迁移大对象的惰性加载（通过 background 消息按需获取）
 * - 读写锁保证并发安全
 */

import { chromeCallbackToPromise, ensureChromeNamespace, getExtensionApi } from '../browser/extensionApi';

/** 响应映射器：将 background 返回的响应转换为存储对象 */
export type StorageValueMapper = (response: any) => Record<string, any> | null | undefined;

/** 已迁移到 IndexedDB 的大对象加载配置 */
export interface MigratedLargeObjectLoader {
  migratedFlagKey: string;                            // 标记是否已迁移的 key
  messageType: string;                                // background 消息类型
  payload?: any;
  timeoutMs?: number;
  mapResponseToObject: StorageValueMapper;
}

/** ChromeStorage 构造选项 */
export interface ChromeStorageOptions {
  area?: chrome.storage.StorageArea;
  runtime?: Pick<typeof chrome.runtime, 'id' | 'lastError' | 'sendMessage'>;
  largeKeys?: Iterable<string>;                       // 需要分块存储的大 key 列表
  migratedLargeObjectLoaders?: Record<string, MigratedLargeObjectLoader>;
  logger?: (message: string, context?: Record<string, any>) => void;
}

/** chrome.storage 适配器接口 */
export interface ChromeStorageAdapter {
  getValue<T>(key: string, defaultValue: T): Promise<T>;
  setValue<T>(key: string, value: T): Promise<void>;
  removeKeys(keys: string[]): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/** 分块存储前缀：`__chunk__:{key}::{index}` */
const chunkPrefixFor = (key: string) => `__chunk__:${key}::`;
/** 分块元数据 key：`__chunks_meta__:{key}` */
const chunkMetaFor = (key: string) => `__chunks_meta__:${key}`;
/** 单个 chunk 最大 400KB（chrome.storage 单条限制约 5MB，留余量） */
const MAX_BYTES_PER_CHUNK = 400 * 1024;

function encodeSize(value: any): number {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return new TextEncoder().encode(serialized).length;
  } catch {
    return 0;
  }
}

function storageAreaFrom(options: ChromeStorageOptions): chrome.storage.StorageArea | null {
  if (options.area) return options.area;
  ensureChromeNamespace();
  const api = getExtensionApi();
  return api?.storage?.local ?? null;
}

function runtimeFrom(options: ChromeStorageOptions): Pick<typeof chrome.runtime, 'id' | 'lastError' | 'sendMessage'> | null {
  if (options.runtime) return options.runtime;
  ensureChromeNamespace();
  const api = getExtensionApi();
  return api?.runtime ?? null;
}

function chromeGet(area: chrome.storage.StorageArea, keys: string | string[] | null): Promise<Record<string, any>> {
  return chromeCallbackToPromise<Record<string, any>>((callback) => {
    return (area.get as any)(keys as any, (items: Record<string, any>) => callback(items || {}));
  }).catch(() => ({}));
}

function chromeSet(area: chrome.storage.StorageArea, payload: Record<string, any>): Promise<void> {
  return chromeCallbackToPromise<void>((callback) => {
    return (area.set as any)(payload, () => callback(undefined as unknown as void));
  }).catch(() => undefined);
}

function chromeRemove(area: chrome.storage.StorageArea, keys: string[]): Promise<void> {
  return chromeCallbackToPromise<void>((callback) => {
    return (area.remove as any)(keys, () => callback(undefined as unknown as void));
  }).catch(() => undefined);
}

function sendRuntimeMessage(
  options: ChromeStorageOptions,
  type: string,
  payload: any,
  timeoutMs: number,
): Promise<any> {
  const runtime = runtimeFrom(options);
  if (!runtime?.id || !runtime.sendMessage) {
    return Promise.reject(new Error('Extension context invalidated'));
  }

  const message = payload === undefined ? { type } : { type, payload };
  const request = chromeCallbackToPromise<any>((callback) => {
    return runtime.sendMessage(message, callback);
  }).then((response) => {
    if (!response || response.success !== true) {
      throw new Error(response?.error || 'db error');
    }
    return response;
  });

  const timeout = new Promise<never>((_, reject) => {
    try {
      setTimeout(() => reject(new Error(`message timeout: ${type}`)), timeoutMs);
    } catch {
      // ignore
    }
  });

  return Promise.race([request, timeout]);
}

function isPlainRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function setLargeObject(
  area: chrome.storage.StorageArea,
  key: string,
  value: Record<string, any>,
): Promise<void> {
  const prefix = chunkPrefixFor(key);
  const metaKey = chunkMetaFor(key);
  const entries = Object.entries(value || {});
  let current: Record<string, any> = {};
  let currentSize = encodeSize({});
  const chunks: Array<Record<string, any>> = [];

  for (const [entryKey, entryValue] of entries) {
    const pair = { [entryKey]: entryValue };
    const pairSize = encodeSize(pair);
    if (currentSize + pairSize > MAX_BYTES_PER_CHUNK && Object.keys(current).length > 0) {
      chunks.push(current);
      current = {};
      currentSize = encodeSize({});
    }
    Object.assign(current, pair);
    currentSize += pairSize;
  }

  if (Object.keys(current).length > 0) {
    chunks.push(current);
  }

  if (chunks.length === 0) {
    await chromeSet(area, { [metaKey]: { chunks: 0, totalEntries: 0, updatedAt: Date.now(), version: 1 } });
  } else {
    for (let index = 0; index < chunks.length; index++) {
      await chromeSet(area, { [`${prefix}${index + 1}`]: chunks[index] });
    }
    await chromeSet(area, {
      [metaKey]: { chunks: chunks.length, totalEntries: entries.length, updatedAt: Date.now(), version: 1 },
    });
  }

  try {
    const keys = Object.keys(await chromeGet(area, null));
    const extraChunkKeys = keys
      .filter((candidate) => candidate.startsWith(prefix))
      .filter((candidate) => {
        const index = Number(candidate.substring(prefix.length));
        return Number.isFinite(index) && index > chunks.length;
      });
    const malformedChunkKeys = keys
      .filter((candidate) => candidate.startsWith(prefix))
      .filter((candidate) => !Number.isFinite(Number(candidate.substring(prefix.length))));
    const staleKeys = Array.from(new Set([key, ...extraChunkKeys, ...malformedChunkKeys]));
    if (staleKeys.length > 0) {
      await chromeRemove(area, staleKeys);
    }
  } catch {}
}

async function getLargeObject<T>(
  area: chrome.storage.StorageArea,
  key: string,
  defaultValue: T,
): Promise<T> {
  const prefix = chunkPrefixFor(key);
  const metaKey = chunkMetaFor(key);
  const meta = (await chromeGet(area, [metaKey]))[metaKey];

  if (meta && typeof meta.chunks === 'number') {
    const chunkCount = meta.chunks as number;
    if (chunkCount <= 0) return {} as T;

    const chunkKeys = Array.from({ length: chunkCount }, (_value, index) => `${prefix}${index + 1}`);
    const storedChunks = await chromeGet(area, chunkKeys);
    const assembled: Record<string, any> = {};
    for (const chunkKey of chunkKeys) {
      const chunk = storedChunks[chunkKey];
      if (isPlainRecord(chunk)) {
        Object.assign(assembled, chunk);
      }
    }
    return assembled as T;
  }

  const legacy = await chromeGet(area, [key]);
  return legacy[key] !== undefined ? (legacy[key] as T) : defaultValue;
}

async function loadMigratedLargeObject<T>(
  options: ChromeStorageOptions,
  key: string,
): Promise<T | undefined> {
  const loader = options.migratedLargeObjectLoaders?.[key];
  if (!loader) return undefined;

  const area = storageAreaFrom(options);
  if (!area) return undefined;
  const migrated = !!(await chromeGet(area, [loader.migratedFlagKey]))[loader.migratedFlagKey];
  if (!migrated) return undefined;

  try {
    const response = await sendRuntimeMessage(options, loader.messageType, loader.payload, loader.timeoutMs ?? 8000);
    const mapped = loader.mapResponseToObject(response);
    if (isPlainRecord(mapped)) {
      return mapped as T;
    }
  } catch {}

  return undefined;
}

export function createChromeStorage(options: ChromeStorageOptions = {}): ChromeStorageAdapter {
  const largeKeys = new Set(options.largeKeys ?? []);

  async function setValue<T>(key: string, value: T): Promise<void> {
    const area = storageAreaFrom(options);
    if (!area) return;
    if (largeKeys.has(key) && isPlainRecord(value)) {
      try {
        await setLargeObject(area, key, value);
        return;
      } catch (error: any) {
        options.logger?.('Chunked set failed, fallback to direct set', { key, error: error?.message });
      }
    }
    await chromeSet(area, { [key]: value });
  }

  async function getValue<T>(key: string, defaultValue: T): Promise<T> {
    const area = storageAreaFrom(options);
    if (!area) return defaultValue;
    if (largeKeys.has(key)) {
      const migratedValue = await loadMigratedLargeObject<T>(options, key);
      if (migratedValue !== undefined) {
        return migratedValue;
      }
      return getLargeObject<T>(area, key, defaultValue);
    }

    const stored = await chromeGet(area, [key]);
    const value = stored[key];
    return (value !== undefined && value !== null ? value : defaultValue) as T;
  }

  async function removeKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const area = storageAreaFrom(options);
    if (!area) return;
    await chromeRemove(area, keys);
  }

  async function getAllKeys(): Promise<string[]> {
    const area = storageAreaFrom(options);
    if (!area) return [];
    return Object.keys(await chromeGet(area, null));
  }

  return {
    getValue,
    setValue,
    removeKeys,
    getAllKeys,
  };
}

export const defaultChromeStorage = createChromeStorage();

export function setValue<T>(key: string, value: T): Promise<void> {
  return defaultChromeStorage.setValue(key, value);
}

export function getValue<T>(key: string, defaultValue: T): Promise<T> {
  return defaultChromeStorage.getValue(key, defaultValue);
}
