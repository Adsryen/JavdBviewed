// src/platform/storage/dbRuntimeClient.ts
// 内容脚本到后台的 DB 消息封装（IndexedDB 后台持久层）

import type { VideoRecord } from '../../types';

function log(...args: any[]): void {
  try {
    console.log('[JavDB Ext]', ...args);
  } catch {}
}

function sendMessage<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const requestId = `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    let timer: number | undefined;
    try {
      log('[DBClient] send:start', { type, requestId, timeoutMs, payload });
      timer = window.setTimeout(() => {
        log('[DBClient] send:timeout', { type, requestId, timeoutMs });
        reject(new Error(`DB message timeout: ${type}`));
      }, timeoutMs);
    } catch {}

    if (!chrome?.runtime?.id) {
      if (timer) window.clearTimeout(timer);
      log('[DBClient] send:invalid-runtime', { type, requestId });
      reject(new Error('Extension context invalidated'));
      return;
    }

    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        if (timer) window.clearTimeout(timer);
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          log('[DBClient] send:lastError', { type, requestId, error: lastErr.message });
          reject(new Error(lastErr.message || 'runtime error'));
          return;
        }
        if (!resp || resp.success !== true) {
          log('[DBClient] send:failure', { type, requestId, response: resp });
          reject(new Error(resp?.error || 'unknown db error'));
          return;
        }
        log('[DBClient] send:done', { type, requestId });
        resolve(resp as T);
      });
    } catch (e: any) {
      if (timer) window.clearTimeout(timer);
      log('[DBClient] send:exception', { type, requestId, error: e?.message || String(e) });
      reject(e);
    }
  });
}

export function dbViewedPut(record: VideoRecord): Promise<void> {
  log('[DBClient] viewedPut:request', { id: record?.id, status: record?.status, title: record?.title });
  return sendMessage('DB:VIEWED_PUT', { record }).then(() => {
    log('[DBClient] viewedPut:done', { id: record?.id });
  });
}

export async function dbViewedGet(videoId: string): Promise<VideoRecord | undefined> {
  log('[DBClient] viewedGet:request', { videoId });
  const resp = await sendMessage<{ success: true; record?: VideoRecord }>('DB:VIEWED_GET', { id: videoId });
  log('[DBClient] viewedGet:done', { videoId, found: !!resp.record });
  return resp.record;
}

export function dbViewedBulkPut(records: VideoRecord[]): Promise<void> {
  log('[DBClient] viewedBulkPut:request', { count: records.length });
  return sendMessage('DB:VIEWED_BULK_PUT', { records }).then(() => {
    log('[DBClient] viewedBulkPut:done', { count: records.length });
  });
}

export async function dbViewedGetAll(): Promise<VideoRecord[]> {
  log('[DBClient] viewedGetAll:request');
  const resp = await sendMessage<{ success: true; records: VideoRecord[] }>('DB:VIEWED_GET_ALL');
  log('[DBClient] viewedGetAll:done', { count: resp.records?.length || 0 });
  return resp.records || [];
}

export interface MagnetsQueryParams {
  videoId: string;
  sources?: string[];
  hasSubtitle?: boolean;
  minSizeBytes?: number;
  offset?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'sizeBytes' | 'date';
  order?: 'asc' | 'desc';
}

export interface MagnetCacheRecord {
  key: string;
  videoId: string;
  source: string;
  name: string;
  magnet: string;
  size?: string;
  sizeBytes?: number;
  date?: string;
  seeders?: number;
  leechers?: number;
  hasSubtitle?: boolean;
  quality?: string;
  createdAt: number;
  expireAt?: number;
}

export async function dbMagnetsQuery(params: MagnetsQueryParams): Promise<{ items: MagnetCacheRecord[]; total: number }>{
  const resp = await sendMessage<{ success: true; items: MagnetCacheRecord[]; total: number }>('DB:MAGNETS_QUERY', params);
  return { items: resp.items || [], total: resp.total || 0 };
}

export async function dbMagnetsUpsert(records: MagnetCacheRecord[]): Promise<void> {
  await sendMessage('DB:MAGNETS_UPSERT', { records });
}

export async function dbMagnetsClear(): Promise<void> {
  await sendMessage('DB:MAGNETS_CLEAR');
}

export async function dbMagnetsClearExpired(beforeMs?: number): Promise<number> {
  const resp = await sendMessage<{ success: true; removed: number }>('DB:MAGNETS_CLEAR_EXPIRED', { beforeMs });
  return Number(resp.removed || 0);
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  data?: any;
}

export async function dbLogsAdd(entry: LogEntry): Promise<void> {
  await sendMessage('DB:LOGS_ADD', { entry });
}

export async function dbMagnetPushLogsAdd(entry: any): Promise<void> {
  await sendMessage('DB:MAGNET_PUSH_LOGS_ADD', { entry });
}
