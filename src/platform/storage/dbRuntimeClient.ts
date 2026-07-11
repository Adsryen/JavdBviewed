/**
 * @file dbRuntimeClient.ts
 * @description DB 运行时客户端 —— content script 通过 runtime 消息操作 background IndexedDB
 * @module platform/storage
 *
 * 所有数据库操作都通过消息代理在 background 执行，content 端只发消息不直接操作 IDB。
 */

import type { VideoRecord } from '../../types';
import { sendRuntimeMessage } from '../browser/runtimeMessages';

function log(...args: any[]): void {
  try {
    console.log('[JavDB Ext]', ...args);
  } catch {}
}

function sendMessage<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
  const requestId = `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  log('[DBClient] send:start', { type, requestId, timeoutMs, payload });

  const timeoutPromise = new Promise<never>((_, reject) => {
    try {
      window.setTimeout(() => {
        log('[DBClient] send:timeout', { type, requestId, timeoutMs });
        reject(new Error(`DB message timeout: ${type}`));
      }, timeoutMs);
    } catch {
      // ignore timer failures
    }
  });

  const message = payload === undefined ? { type } : { type, payload };
  const requestPromise = sendRuntimeMessage<T>(message)
    .then((resp) => {
      if (!resp || (resp as any).success !== true) {
        log('[DBClient] send:failure', { type, requestId, response: resp });
        throw new Error((resp as any)?.error || 'unknown db error');
      }
      log('[DBClient] send:done', { type, requestId });
      return resp;
    })
    .catch((error: any) => {
      log('[DBClient] send:exception', { type, requestId, error: error?.message || String(error) });
      throw error;
    });

  return Promise.race([requestPromise, timeoutPromise]);
}

export interface ViewedPutResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
}

export function dbViewedPut(record: VideoRecord): Promise<ViewedPutResult> {
  log('[DBClient] viewedPut:request', { id: record?.id, status: record?.status, title: record?.title });
  return sendMessage<ViewedPutResult>('DB:VIEWED_PUT', { record }).then((result) => {
    log('[DBClient] viewedPut:done', { id: record?.id, skipped: result?.skipped });
    return result;
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
