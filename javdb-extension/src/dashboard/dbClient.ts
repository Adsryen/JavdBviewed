// src/dashboard/dbClient.ts
// Dashboard 到后台 Service Worker 的 DB 消息封装

import type { LogEntry, VideoRecord } from '../types';
import type { ActorRecord } from '../types';
import type { NewWorkRecord } from '../services/newWorks/types';

function sendMessage<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
  const tryOnce = (): Promise<T> => new Promise<T>((resolve, reject) => {
    let timer: number | undefined;
    try {
      timer = window.setTimeout(() => {
        reject(new Error(`DB message timeout: ${type}`));
      }, timeoutMs);
    } catch {}

    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        if (timer) window.clearTimeout(timer);
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          reject(new Error(lastErr.message || 'runtime error'));
          return;
        }
        if (!resp || resp.success !== true) {
          reject(new Error(resp?.error || 'unknown db error'));
          return;
        }
        resolve(resp as T);
      });
    } catch (e: any) {
      if (timer) window.clearTimeout(timer);
      reject(e);
    }
  });

  // 针对 Service Worker 冷启动偶发的“Receiving end does not exist”做一次轻量重试
  return tryOnce().catch((err: any) => {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('receiving end does not exist')) {
      return new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          tryOnce().then(resolve).catch(reject);
        }, 200);
      });
    }
    throw err;
  });
}

// ----- Viewed APIs -----
export interface ViewedPageParams {
  offset: number;
  limit: number;
  status?: VideoRecord['status'];
  orderBy?: 'updatedAt' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ViewedStats {
  total: number;
  byStatus: Record<string, number>;
  last7Days: number;
  last30Days: number;
}

export interface ViewedQueryParams {
  search?: string;
  status?: VideoRecord['status'] | 'all';
  tags?: string[];
  orderBy?: 'updatedAt' | 'createdAt' | 'id' | 'title';
  order?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  adv?: Array<{ field: string; op: string; value?: string }>;
}

export async function dbViewedCount(status?: VideoRecord['status']): Promise<number> {
  const resp = await sendMessage<{ success: true; total: number }>('DB:VIEWED_COUNT', { status });
  // @ts-ignore
  return resp.total || 0;
}

export async function dbViewedPage(params: ViewedPageParams): Promise<{ items: VideoRecord[]; total: number }>{
  const resp = await sendMessage<{ success: true; items: VideoRecord[]; total: number }>('DB:VIEWED_PAGE', params);
  // @ts-ignore
  return { items: resp.items || [], total: resp.total || 0 };
}

export async function dbViewedStats(): Promise<ViewedStats> {
  const resp = await sendMessage<{ success: true } & ViewedStats>('DB:VIEWED_STATS');
  // @ts-ignore
  return resp as ViewedStats;
}

export async function dbViewedDelete(id: string): Promise<void> {
  await sendMessage('DB:VIEWED_DELETE', { id });
}

export async function dbViewedBulkDelete(ids: string[]): Promise<void> {
  await sendMessage('DB:VIEWED_BULK_DELETE', { ids });
}

export async function dbViewedQuery(params: ViewedQueryParams): Promise<{ items: VideoRecord[]; total: number }>{
  const resp = await sendMessage<{ success: true; items: VideoRecord[]; total: number }>('DB:VIEWED_QUERY', params);
  // @ts-ignore
  return { items: resp.items || [], total: resp.total || 0 };
}

export async function dbViewedPut(record: VideoRecord): Promise<void> {
  await sendMessage('DB:VIEWED_PUT', { record });
}

export async function dbViewedExport(): Promise<string> {
  const resp = await sendMessage<{ success: true; json: string }>('DB:VIEWED_EXPORT');
  // @ts-ignore
  return resp.json || '[]';
}

// ----- Logs APIs -----
export interface LogsQueryParams {
  level?: LogEntry['level'];
  minLevel?: LogEntry['level'] | 'OFF';
  fromMs?: number;
  toMs?: number;
  offset?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  query?: string;
  hasDataOnly?: boolean;
  source?: 'ALL' | 'GENERAL' | 'DRIVE115';
}

export async function dbLogsQuery(params: LogsQueryParams): Promise<{ items: LogEntry[]; total: number }>{
  const resp = await sendMessage<{ success: true; items: LogEntry[]; total: number }>('DB:LOGS_QUERY', params);
  // @ts-ignore
  return { items: resp.items || [], total: resp.total || 0 };
}

export async function dbLogsClear(beforeMs?: number): Promise<void> {
  await sendMessage('DB:LOGS_CLEAR', { beforeMs });
}

export async function dbLogsExport(): Promise<string> {
  const resp = await sendMessage<{ success: true; json: string }>('DB:LOGS_EXPORT');
  // @ts-ignore
  return resp.json || '[]';
}

// ----- Actors APIs -----

export interface ActorsQueryParams {
  query?: string; // search in name or aliases (substring)
  gender?: 'female' | 'male' | 'unknown';
  category?: 'censored' | 'uncensored' | 'western' | 'unknown';
  blacklist?: 'all' | 'exclude' | 'only';
  sortBy?: 'name' | 'updatedAt' | 'worksCount';
  order?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export async function dbActorsPut(record: ActorRecord): Promise<void> {
  await sendMessage('DB:ACTORS_PUT', { record });
}

export async function dbActorsBulkPut(records: ActorRecord[]): Promise<void> {
  await sendMessage('DB:ACTORS_BULK_PUT', { records });
}

export async function dbActorsGet(id: string): Promise<ActorRecord | undefined> {
  const resp = await sendMessage<{ success: true; record?: ActorRecord }>('DB:ACTORS_GET', { id });
  // @ts-ignore
  return resp.record;
}

export async function dbActorsDelete(id: string): Promise<void> {
  await sendMessage('DB:ACTORS_DELETE', { id });
}

export async function dbActorsQuery(params: ActorsQueryParams): Promise<{ items: ActorRecord[]; total: number }>{
  const resp = await sendMessage<{ success: true; items: ActorRecord[]; total: number }>('DB:ACTORS_QUERY', params);
  // @ts-ignore
  return { items: resp.items || [], total: resp.total || 0 };
}

export async function dbActorsStats(): Promise<{ total: number; byGender: Record<string, number>; byCategory: Record<string, number>; blacklisted: number; recentlyAdded: number; recentlyUpdated: number; }>{
  const resp = await sendMessage<{ success: true; total: number; byGender: Record<string, number>; byCategory: Record<string, number>; blacklisted: number; recentlyAdded: number; recentlyUpdated: number; }>('DB:ACTORS_STATS');
  // @ts-ignore
  return resp;
}

export async function dbActorsExport(): Promise<string> {
  const resp = await sendMessage<{ success: true; json: string }>('DB:ACTORS_EXPORT');
  // @ts-ignore
  return resp.json || '[]';
}

// ----- NewWorks APIs -----

export interface NewWorksQueryParams {
  search?: string;
  filter?: 'all' | 'unread' | 'today' | 'week';
  sort?: 'discoveredAt' | 'releaseDate' | 'actorName';
  order?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export async function dbNewWorksPut(record: NewWorkRecord): Promise<void> {
  await sendMessage('DB:NEWWORKS_PUT', { record });
}

export async function dbNewWorksBulkPut(records: NewWorkRecord[]): Promise<void> {
  await sendMessage('DB:NEWWORKS_BULK_PUT', { records });
}

export async function dbNewWorksDelete(id: string): Promise<void> {
  await sendMessage('DB:NEWWORKS_DELETE', { id });
}

export async function dbNewWorksGet(id: string): Promise<NewWorkRecord | undefined> {
  const resp = await sendMessage<{ success: true; record?: NewWorkRecord }>('DB:NEWWORKS_GET', { id });
  // @ts-ignore
  return resp.record;
}

export async function dbNewWorksGetAll(): Promise<NewWorkRecord[]> {
  const resp = await sendMessage<{ success: true; records: NewWorkRecord[] }>('DB:NEWWORKS_GET_ALL');
  // @ts-ignore
  return resp.records || [];
}

export async function dbNewWorksQuery(params: NewWorksQueryParams): Promise<{ items: NewWorkRecord[]; total: number }>{
  const resp = await sendMessage<{ success: true; items: NewWorkRecord[]; total: number }>('DB:NEWWORKS_QUERY', params);
  // @ts-ignore
  return { items: resp.items || [], total: resp.total || 0 };
}

export async function dbNewWorksStats(): Promise<{ total: number; unread: number; today: number; week: number; }>{
  const resp = await sendMessage<{ success: true; total: number; unread: number; today: number; week: number; }>('DB:NEWWORKS_STATS');
  // @ts-ignore
  return resp;
}

export async function dbNewWorksExport(): Promise<string> {
  const resp = await sendMessage<{ success: true; json: string }>('DB:NEWWORKS_EXPORT');
  // @ts-ignore
  return resp.json || '[]';
}
