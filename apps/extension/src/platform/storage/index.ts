/**
 * @file index.ts
 * @description 存储子系统统一导出（chrome.storage 适配器、IndexedDB、迁移、缓存）
 */
export {
  createChromeStorage,
  defaultChromeStorage,
  getValue,
  setValue,
  type ChromeStorageAdapter,
  type ChromeStorageOptions,
  type MigratedLargeObjectLoader,
  type StorageValueMapper,
} from './chromeStorage';

export * from './indexedDb';
export * from './migrations';
export * from './trendUtils';
export * from './cache';
export {
  dbLogsAdd,
  dbMagnetPushLogsAdd,
  dbMagnetsClear,
  dbMagnetsClearExpired,
  dbMagnetsQuery,
  dbMagnetsUpsert,
  dbViewedBulkPut,
  dbViewedGet,
  dbViewedGetAll,
  dbViewedPut,
  type LogEntry as DbRuntimeLogEntry,
  type MagnetCacheRecord as DbRuntimeMagnetCacheRecord,
  type MagnetsQueryParams as DbRuntimeMagnetsQueryParams,
} from './dbRuntimeClient';
