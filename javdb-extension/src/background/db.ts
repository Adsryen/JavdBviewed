// src/background/db.ts
// IndexedDB 封装（使用 idb），为大体量数据（如 viewed 番号库）提供高效持久化

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { VideoRecord, ActorRecord, LogEntry } from '../types';
import type { NewWorkRecord } from '../services/newWorks/types';
import { getSettings, getValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { ViewsDaily, ReportMonthly } from '../types/insights';

// 日志持久化存储结构（扩展原 LogEntry，增加数值时间戳与自增键）
export interface PersistedLogEntry extends LogEntry {
  id?: number;            // 自增主键
  timestampMs: number;    // 数值时间戳，便于索引排序
  timestampISO?: string;  // 兼容保留
}

// ----- daily trends (records/actors/newWorks) -----

type DateMode = 'cumulative' | 'daily';

function fmtDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function eachDate(startDate: string, endDate: string): { date: string; startMs: number; endMs: number }[] {
  const res: { date: string; startMs: number; endMs: number }[] = [];
  const [sY, sM, sD] = startDate.split('-').map(n => Number(n));
  const [eY, eM, eD] = endDate.split('-').map(n => Number(n));
  let cur = new Date(sY, (sM || 1) - 1, sD || 1);
  const end = new Date(eY, (eM || 1) - 1, eD || 1);
  while (cur.getTime() <= end.getTime()) {
    const dStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0, 0).getTime();
    const dEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999).getTime();
    res.push({ date: fmtDateYMD(cur), startMs: dStart, endMs: dEnd });
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return res;
}

export interface RecordsTrendPoint { date: string; total: number; viewed: number; browsed: number; want: number; }
export async function trendsRecordsRange(startDate: string, endDate: string, mode: DateMode = 'cumulative'): Promise<RecordsTrendPoint[]> {
  const db = await initDB();
  const idxCreated = db.transaction('viewedRecords').store.index('by_createdAt');
  const idxStatusCreated = db.transaction('viewedRecords').store.index('by_status_createdAt');
  const items: RecordsTrendPoint[] = [];
  for (const d of eachDate(startDate, endDate)) {
    let total = 0, viewed = 0, browsed = 0, want = 0;
    try {
      if (mode === 'daily') {
        // @ts-ignore
        total = await idxCreated.count(IDBKeyRange.bound(d.startMs, d.endMs));
        // @ts-ignore
        viewed = await idxStatusCreated.count(IDBKeyRange.bound(['viewed', d.startMs], ['viewed', d.endMs]));
        // @ts-ignore
        browsed = await idxStatusCreated.count(IDBKeyRange.bound(['browsed', d.startMs], ['browsed', d.endMs]));
        // @ts-ignore
        want = await idxStatusCreated.count(IDBKeyRange.bound(['want', d.startMs], ['want', d.endMs]));
      } else {
        // @ts-ignore
        total = await idxCreated.count(IDBKeyRange.upperBound(d.endMs));
        // @ts-ignore
        viewed = await idxStatusCreated.count(IDBKeyRange.bound(['viewed', 0], ['viewed', d.endMs]));
        // @ts-ignore
        browsed = await idxStatusCreated.count(IDBKeyRange.bound(['browsed', 0], ['browsed', d.endMs]));
        // @ts-ignore
        want = await idxStatusCreated.count(IDBKeyRange.bound(['want', 0], ['want', d.endMs]));
      }
    } catch {}
    items.push({ date: d.date, total, viewed, browsed, want });
  }
  return items;
}

export interface ActorsTrendPoint { date: string; total: number; female: number; male: number; blacklisted: number; }
export async function trendsActorsRange(startDate: string, endDate: string, mode: DateMode = 'cumulative'): Promise<ActorsTrendPoint[]> {
  const db = await initDB();
  const all = await db.getAll('actors');
  const days = eachDate(startDate, endDate);
  const points: ActorsTrendPoint[] = [];
  for (const d of days) {
    let total = 0, female = 0, male = 0, blacklisted = 0;
    for (const a of all) {
      const ts = typeof (a as any)?.createdAt === 'number' ? (a as any).createdAt : (typeof (a as any)?.updatedAt === 'number' ? (a as any).updatedAt : 0);
      if (ts <= 0) continue;
      const inDay = (mode === 'daily') ? (ts >= d.startMs && ts <= d.endMs) : (ts <= d.endMs);
      if (!inDay) continue;
      total++;
      const g = (a as any)?.gender;
      if (g === 'female') female++;
      else if (g === 'male') male++;
      if ((a as any)?.blacklisted) blacklisted++;
    }
    points.push({ date: d.date, total, female, male, blacklisted });
  }
  return points;
}

export interface NewWorksTrendPoint { date: string; total: number; subscriptions: number; }
export async function trendsNewWorksRange(startDate: string, endDate: string, mode: DateMode = 'cumulative'): Promise<NewWorksTrendPoint[]> {
  const db = await initDB();
  const idxDisc = db.transaction('newWorks').store.index('by_discoveredAt');
  // 订阅数据来自 chrome.storage 本地
  let subsMap: Record<string, any> = {};
  try { subsMap = await getValue<Record<string, any>>(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {} as any); } catch { subsMap = {}; }
  const subs: Array<{ enabled: boolean; subscribedAt: number }> = Object.values(subsMap || {}).map((s: any) => ({ enabled: !!s?.enabled, subscribedAt: Number(s?.subscribedAt || 0) || 0 }));
  const points: NewWorksTrendPoint[] = [];
  for (const d of eachDate(startDate, endDate)) {
    let total = 0, subscriptions = 0;
    try {
      if (mode === 'daily') {
        // @ts-ignore
        total = await idxDisc.count(IDBKeyRange.bound(d.startMs, d.endMs));
      } else {
        // @ts-ignore
        total = await idxDisc.count(IDBKeyRange.upperBound(d.endMs));
      }
    } catch {}
    try {
      if (mode === 'daily') {
        subscriptions = subs.filter(s => s.enabled && s.subscribedAt >= d.startMs && s.subscribedAt <= d.endMs).length;
      } else {
        subscriptions = subs.filter(s => s.enabled && s.subscribedAt > 0 && s.subscribedAt <= d.endMs).length;
      }
    } catch {}
    points.push({ date: d.date, total, subscriptions });
  }
  return points;
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

export async function viewedQuery(params: ViewedQueryParams): Promise<{ items: VideoRecord[]; total: number }> {
  const { search = '', status = 'all', tags = [], orderBy = 'updatedAt', order = 'desc', offset = 0, limit = 50 } = params || {} as any;
  const db = await initDB();
  const tx = db.transaction('viewedRecords');
  const store = tx.store;

  // 选用较优的游标来源
  let source: any = store;
  let range: IDBKeyRange | undefined = undefined;
  const dir = order === 'asc' ? 'next' : 'prev';
  if (orderBy === 'updatedAt' || orderBy === 'createdAt') {
    if (status && status !== 'all') {
      const idxName = orderBy === 'createdAt' ? 'by_status_createdAt' : 'by_status_updatedAt';
      source = store.index(idxName as any);
      // @ts-ignore
      range = IDBKeyRange.bound([status, 0], [status, Number.MAX_SAFE_INTEGER]);
    } else {
      const idxName = orderBy === 'createdAt' ? 'by_createdAt' : 'by_updatedAt';
      source = store.index(idxName as any);
    }
  } else if (status && status !== 'all') {
    source = store.index('by_status');
    // @ts-ignore
    range = IDBKeyRange.only(status);
  }

  const lower = String(search || '').trim().toLowerCase();
  const needTags = Array.isArray(tags) && tags.length > 0;
  const adv = Array.isArray(params?.adv) ? params!.adv! : [];

  const list: VideoRecord[] = [];
  for (let cursor = await source.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
    const r = cursor.value as VideoRecord;
    if (!r) continue;
    if (status && status !== 'all' && r.status !== status) continue;
    if (lower) {
      const idS = (r.id || '').toLowerCase();
      const titleS = (r.title || '').toLowerCase();
      const tagsArr = Array.isArray(r.tags) ? r.tags : [];
      const inTags = tagsArr.some(t => String(t || '').toLowerCase().includes(lower));
      if (!idS.includes(lower) && !titleS.includes(lower) && !inTags) continue;
    }
    if (needTags) {
      const arr = Array.isArray(r.tags) ? r.tags : [];
      const arrLower = arr.map(s => String(s).toLowerCase());
      const queryLower = tags.map(s => String(s).toLowerCase());
      // 每个查询标签需要与记录的任意一个 tag 子串匹配（AND，忽略大小写）
      if (!queryLower.every(qt => arrLower.some(t => t.includes(qt)))) continue;
    }
    if (adv.length > 0 && !matchAdvBasic(r, adv)) continue;
    list.push(r);
  }

  // 需要时进行二次排序
  if (orderBy === 'id' || orderBy === 'title') {
    list.sort((a, b) => {
      const av = String((orderBy === 'id' ? a.id : a.title) || '');
      const bv = String((orderBy === 'id' ? b.id : b.title) || '');
      return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const total = list.length;
  const items = list.slice(offset, offset + limit);
  return { items, total };
}

function matchAdvBasic(r: VideoRecord, adv: Array<{ field: string; op: string; value?: string }>): boolean {
  const get = (k: string): any => {
    switch (k) {
      case 'id': return r.id || '';
      case 'title': return r.title || '';
      case 'status': return r.status || '';
      case 'tags': return Array.isArray(r.tags) ? r.tags : [];
      case 'releaseDate': return r.releaseDate || '';
      case 'createdAt': return r.createdAt;
      case 'updatedAt': return r.updatedAt;
      case 'javdbUrl': return r.javdbUrl || '';
      case 'javdbImage': return r.javdbImage || '';
      default: return undefined;
    }
  };
  for (const c of adv) {
    const v = get(c.field);
    const op = c.op;
    const val = c.value ?? '';
    if (op === 'empty') { if (!(v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === ''))) return false; continue; }
    if (op === 'not_empty') { if (v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '')) return false; continue; }

    // 文本比较：与前端一致，忽略大小写
    if (op === 'contains' || op === 'equals' || op === 'starts_with' || op === 'ends_with') {
      const sv = String(v ?? '').toLowerCase();
      const cv = String(val ?? '').toLowerCase();
      if (op === 'contains' && !sv.includes(cv)) return false;
      if (op === 'equals' && !(sv === cv)) return false;
      if (op === 'starts_with' && !sv.startsWith(cv)) return false;
      if (op === 'ends_with' && !sv.endsWith(cv)) return false;
      continue;
    }

    // tags 比较
    if (op === 'includes' || op === 'includes_all' || op === 'includes_any') {
      const arr: string[] = Array.isArray(v) ? v : [];
      if (op === 'includes') {
        if (!arr.includes(String(val))) return false; // 精确匹配
        continue;
      }
      const arrLower = arr.map(s => String(s).toLowerCase());
      const tokens = String(val || '').split(/[，,;；\s]+/).map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase());
      if (tokens.length === 0) return false;
      if (op === 'includes_all') { if (!tokens.every(tok => arrLower.some(tag => tag.includes(tok)))) return false; continue; }
      if (op === 'includes_any') { if (!tokens.some(tok => arrLower.some(tag => tag.includes(tok)))) return false; continue; }
    }
    // 数组长度比较（如 tags 长度）
    if (op === 'length_eq' || op === 'length_gt' || op === 'length_gte' || op === 'length_lt') {
      const arr = Array.isArray(v) ? v : [];
      const cmp = Number(val);
      if (Number.isNaN(cmp)) return false;
      if (op === 'length_eq' && !(arr.length === cmp)) return false;
      if (op === 'length_gt' && !(arr.length > cmp)) return false;
      if (op === 'length_gte' && !(arr.length >= cmp)) return false;
      if (op === 'length_lt' && !(arr.length < cmp)) return false;
      continue;
    }
    // 数值比较
    const num = Number(v);
    const cmp = Number(val);
    if (!Number.isNaN(num) && !Number.isNaN(cmp)) {
      if (op === 'gt' && !(num > cmp)) return false;
      if (op === 'gte' && !(num >= cmp)) return false;
      if (op === 'lt' && !(num < cmp)) return false;
      if (op === 'lte' && !(num <= cmp)) return false;
      if (op === 'eq' && !(num === cmp)) return false;
    }
  }
  return true;
}
// 磁链缓存记录
export interface MagnetCacheRecord {
  key: string;           // 复合键：videoId|source|hash
  videoId: string;
  source: string;        // Sukebei/BTdig/BTSOW/Torrentz2/JavDB
  name: string;
  magnet: string;
  size?: string;
  sizeBytes?: number;
  date?: string;
  seeders?: number;
  leechers?: number;
  hasSubtitle?: boolean;
  quality?: string;
  createdAt: number;     // 记录创建时间
  expireAt?: number;     // 过期时间（用于 TTL 清理）
}

interface JavdbDB extends DBSchema {
  viewedRecords: {
    key: string; // video id
    value: VideoRecord;
    indexes: {
      by_status: string;
      by_updatedAt: number;
      by_createdAt: number;
      by_status_updatedAt: [string, number];
      by_status_createdAt: [string, number];
    };
  };
  logs: {
    key: number; // autoIncrement id
    value: PersistedLogEntry;
    indexes: {
      by_timestamp: number;
      by_level: string;
    };
  };
  actors: {
    key: string; // actor id
    value: ActorRecord;
    indexes: {
      by_name: string;
      by_updatedAt: number;
    };
  };
  newWorks: {
    key: string; // work id（暂定）
    value: NewWorkRecord;
    indexes: {
      by_actorId: string;
      by_discoveredAt: number;
      by_status: string;
    };
  };
  magnets: {
    key: string; // composite key
    value: MagnetCacheRecord;
    indexes: {
      by_videoId: string;
      by_source: string;
      by_createdAt: number;
      by_expireAt: number;
    };
  };
  insightsViews: {
    key: string; // date YYYY-MM-DD
    value: ViewsDaily;
    indexes: {
      by_date: string;
    };
  };
  insightsReports: {
    key: string; // month YYYY-MM
    value: ReportMonthly;
    indexes: {
      by_month: string;
      by_createdAt: number;
    };
  };
}

const DB_NAME = 'javdb_v1';
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<JavdbDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<JavdbDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JavdbDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<JavdbDB>, oldVersion: number, _newVersion: number, tx: any) {
        // v1 -> 初始化 viewedRecords
        if (oldVersion < 1) {
          const store = db.createObjectStore('viewedRecords', { keyPath: 'id' });
          store.createIndex('by_status', 'status');
          store.createIndex('by_updatedAt', 'updatedAt');
          store.createIndex('by_createdAt', 'createdAt');
        }
        // v2 -> 新增 logs / actors / newWorks / magnets
        if (oldVersion < 2) {
          // logs
          const logs = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
          logs.createIndex('by_timestamp', 'timestampMs');
          logs.createIndex('by_level', 'level');

          // actors
          const actors = db.createObjectStore('actors', { keyPath: 'id' });
          actors.createIndex('by_name', 'name');
          actors.createIndex('by_updatedAt', 'updatedAt');

          // newWorks
          const nw = db.createObjectStore('newWorks', { keyPath: 'id' });
          nw.createIndex('by_actorId', 'actorId');
          nw.createIndex('by_discoveredAt', 'discoveredAt');
          nw.createIndex('by_status', 'status');

          // magnets
          const mg = db.createObjectStore('magnets', { keyPath: 'key' });
          mg.createIndex('by_videoId', 'videoId');
          mg.createIndex('by_source', 'source');
          mg.createIndex('by_createdAt', 'createdAt');
          mg.createIndex('by_expireAt', 'expireAt');
        }
        // v3 -> 为 viewedRecords 增加复合索引：status+updatedAt / status+createdAt
        if (oldVersion < 3) {
          try {
            const store = tx.objectStore('viewedRecords');
            try { store.createIndex('by_status_updatedAt', ['status', 'updatedAt']); } catch {}
            try { store.createIndex('by_status_createdAt', ['status', 'createdAt']); } catch {}
          } catch {}
        }
        // v4 -> 新增 insightsViews / insightsReports
        if (oldVersion < 4) {
          try {
            const iv = db.createObjectStore('insightsViews', { keyPath: 'date' });
            iv.createIndex('by_date', 'date');
          } catch {}
          try {
            const ir = db.createObjectStore('insightsReports', { keyPath: 'month' });
            ir.createIndex('by_month', 'month');
            ir.createIndex('by_createdAt', 'createdAt');
          } catch {}
        }
      }
    });
  }
  return dbPromise;
}

// ----- viewedRecords API -----

export async function viewedPut(record: VideoRecord): Promise<void> {
  const db = await initDB();
  await db.put('viewedRecords', record);
}

export async function viewedBulkPut(records: VideoRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('viewedRecords', 'readwrite');
  try {
    for (const r of records) {
      await tx.store.put(r);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function viewedGet(videoId: string): Promise<VideoRecord | undefined> {
  const db = await initDB();
  return db.get('viewedRecords', videoId);
}

export async function viewedDelete(videoId: string): Promise<void> {
  const db = await initDB();
  await db.delete('viewedRecords', videoId);
}

export async function viewedBulkDelete(videoIds: string[]): Promise<void> {
  if (!videoIds || videoIds.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('viewedRecords', 'readwrite');
  try {
    for (const id of videoIds) {
      await tx.store.delete(id);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function viewedCount(): Promise<number> {
  const db = await initDB();
  return db.count('viewedRecords');
}

export async function viewedGetAll(): Promise<VideoRecord[]> {
  const db = await initDB();
  return db.getAll('viewedRecords');
}

export async function viewedCountByStatus(status?: VideoRecord['status']): Promise<number> {
  const db = await initDB();
  if (!status) return db.count('viewedRecords');
  const idx = db.transaction('viewedRecords').store.index('by_status');
  // @ts-ignore
  return idx.count(IDBKeyRange.only(status));
}

export interface ViewedPageParams {
  offset: number;
  limit: number;
  status?: VideoRecord['status'];
  orderBy?: 'updatedAt' | 'createdAt';
  order?: 'asc' | 'desc';
}

export async function viewedPage(params: ViewedPageParams): Promise<{ items: VideoRecord[]; total: number; }> {
  const { offset = 0, limit = 50, status, orderBy = 'updatedAt', order = 'desc' } = params || {} as any;
  const db = await initDB();
  let items: VideoRecord[] = [];
  let total = 0;
  if (status) {
    // 使用复合索引高效分页
    const indexName = orderBy === 'createdAt' ? 'by_status_createdAt' : 'by_status_updatedAt';
    const dir = order === 'asc' ? 'next' : 'prev';
    const tx = db.transaction('viewedRecords');
    const idx = tx.store.index(indexName as any);
    const lower: [string, number] = [status as any, 0];
    const upper: [string, number] = [status as any, Number.MAX_SAFE_INTEGER];
    // @ts-ignore
    const range = IDBKeyRange.bound(lower as any, upper as any);
    // total（按范围计数）
    try {
      // @ts-ignore
      total = await idx.count(range as any);
    } catch { total = 0; }

    let skipped = 0;
    let collected = 0;
    items = [];
    // @ts-ignore
    for (let cursor = await idx.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
      if (skipped < offset) { skipped++; continue; }
      items.push(cursor.value as VideoRecord);
      collected++;
      if (collected >= limit) break;
    }
  } else {
    // 直接用时间索引分页
    const indexName = orderBy === 'createdAt' ? 'by_createdAt' : 'by_updatedAt';
    const dir = order === 'asc' ? 'next' : 'prev';
    const tx = db.transaction('viewedRecords');
    const idx = tx.store.index(indexName);
    let skipped = 0;
    let collected = 0;
    items = [];
    for (let cursor = await idx.openCursor(undefined, dir); cursor; cursor = await cursor.continue()) {
      if (skipped < offset) { skipped++; continue; }
      items.push(cursor.value as VideoRecord);
      collected++;
      if (collected >= limit) break;
    }
    total = await tx.store.count();
  }
  return { items, total };
}

// ----- viewed stats -----
export interface ViewedStats {
  total: number;
  byStatus: Record<string, number>;
  last7Days: number;
  last30Days: number;
}

export async function viewedStats(): Promise<ViewedStats> {
  const db = await initDB();
  const tx = db.transaction('viewedRecords');
  const store = tx.store;
  const idxStatus = store.index('by_status');
  const idxCreated = store.index('by_createdAt');

  const total = await store.count();

  let viewed = 0, browsed = 0, want = 0;
  try { /* @ts-ignore */ viewed = await idxStatus.count(IDBKeyRange.only('viewed')); } catch {}
  try { /* @ts-ignore */ browsed = await idxStatus.count(IDBKeyRange.only('browsed')); } catch {}
  try { /* @ts-ignore */ want = await idxStatus.count(IDBKeyRange.only('want')); } catch {}

  const now = Date.now();
  const last7 = now - 7 * 24 * 60 * 60 * 1000;
  const last30 = now - 30 * 24 * 60 * 60 * 1000;
  let last7Days = 0;
  let last30Days = 0;
  try { /* @ts-ignore */ last7Days = await idxCreated.count(IDBKeyRange.lowerBound(last7)); } catch {}
  try { /* @ts-ignore */ last30Days = await idxCreated.count(IDBKeyRange.lowerBound(last30)); } catch {}

  return {
    total,
    byStatus: { viewed, browsed, want },
    last7Days,
    last30Days,
  };
}

// ----- logs API -----

function normalizeLog(entry: LogEntry): PersistedLogEntry {
  const timestampISO = entry.timestamp || new Date().toISOString();
  const ms = Date.parse(timestampISO) || Date.now();
  return {
    ...entry,
    timestamp: timestampISO,
    timestampISO,
    timestampMs: ms,
  } as PersistedLogEntry;
}

export async function logsAdd(entry: LogEntry): Promise<number> {
  const db = await initDB();
  const v = normalizeLog(entry);
  // @ts-ignore id will be auto generated
  const id = await db.add('logs', v as any);
  try { await logsEnforceRetention(); } catch {}
  return id as number;
}

export async function logsBulkAdd(entries: LogEntry[]): Promise<void> {
  if (!entries || entries.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('logs', 'readwrite');
  try {
    for (const e of entries) {
      const v = normalizeLog(e);
      await tx.store.add(v as any);
    }
    await tx.done;
    try { await logsEnforceRetention(); } catch {}
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

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

export async function logsQuery(params: LogsQueryParams): Promise<{ items: PersistedLogEntry[]; total: number; }> {
  const { level, minLevel, fromMs, toMs, offset = 0, limit = 100, order = 'desc', query = '', hasDataOnly = false, source = 'ALL' } = params || {} as any;
  const db = await initDB();
  const idx = db.transaction('logs').store.index('by_timestamp');
  let range: IDBKeyRange | undefined = undefined;
  if (fromMs != null && toMs != null) range = IDBKeyRange.bound(fromMs, toMs);
  else if (fromMs != null) range = IDBKeyRange.lowerBound(fromMs);
  else if (toMs != null) range = IDBKeyRange.upperBound(toMs);
  const dir = order === 'asc' ? 'next' : 'prev';

  const items: PersistedLogEntry[] = [];
  let skipped = 0;
  let collected = 0;
  const q = String(query || '').trim().toLowerCase();
  const deriveSource = (msg: string): 'DRIVE115' | 'GENERAL' => {
    const m = String(msg || '');
    if (/\b115\b|Drive115/i.test(m)) return 'DRIVE115';
    return 'GENERAL';
  };
  const rank = (lv: LogEntry['level']) => {
    switch (lv) {
      case 'DEBUG': return 0;
      case 'INFO': return 1;
      case 'WARN': return 2;
      case 'ERROR': return 3;
      default: return 0;
    }
  };
  const minRank = ((): number | null => {
    if (!minLevel) return null;
    if (minLevel === 'OFF') return Infinity; // OFF: 不显示任何
    return rank(minLevel as LogEntry['level']);
  })();

  let total = 0; // 过滤后的总数
  for (let cursor = await idx.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
    const v = cursor.value as PersistedLogEntry;
    if (level && v.level !== level) continue;
    if (minRank != null && minRank !== Infinity && rank(v.level as any) < minRank) continue;
    if (minRank === Infinity) continue; // OFF
    if (hasDataOnly && !v.data) continue;
    if (q) {
      const inMsg = String(v.message || '').toLowerCase().includes(q);
      let inData = false;
      try { inData = v.data ? JSON.stringify(v.data).toLowerCase().includes(q) : false; } catch { inData = false; }
      if (!inMsg && !inData) continue;
    }
    if (source && source !== 'ALL') {
      const s = deriveSource(String(v.message || ''));
      if (s !== source) continue;
    }
    // 通过过滤
    total++;
    if (skipped < offset) { skipped++; continue; }
    if (collected < limit) {
      items.push(v);
      collected++;
    }
  }
  return { items, total };
}

export async function logsClear(beforeMs?: number): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('logs', 'readwrite');
  const idx = tx.store.index('by_timestamp');
  if (beforeMs == null) {
    await tx.store.clear();
  } else {
    for (let cursor = await idx.openCursor(IDBKeyRange.upperBound(beforeMs)); cursor; cursor = await cursor.continue()) {
      await cursor.delete();
    }
  }
  await tx.done;
}

export async function logsGetAll(): Promise<PersistedLogEntry[]> {
  const db = await initDB();
  return db.getAll('logs');
}

// 保留策略：按天数与按数量
async function logsEnforceRetention(): Promise<void> {
  try {
    const settings = await getSettings();
    const logging: any = (settings as any)?.logging || {};
    let maxEntries = Number(logging.maxLogEntries ?? logging.maxEntries ?? 1500);
    if (!Number.isFinite(maxEntries) || maxEntries <= 0) maxEntries = 1500;
    const retentionDaysRaw = (logging as any).retentionDays;
    const retentionDays = Number(retentionDaysRaw);
    const hasRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0;

    const db = await initDB();

    // 先按时间清理（如果配置了天数）
    if (hasRetentionDays) {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      const tx = db.transaction('logs', 'readwrite');
      const idx = tx.store.index('by_timestamp');
      for (let cursor = await idx.openCursor(IDBKeyRange.upperBound(cutoff)); cursor; cursor = await cursor.continue()) {
        await cursor.delete();
      }
      await tx.done;
    }

    // 再按数量限制
    const total = await db.count('logs');
    if (total > maxEntries) {
      const toRemove = total - maxEntries;
      const tx2 = db.transaction('logs', 'readwrite');
      const idx2 = tx2.store.index('by_timestamp');
      let removed = 0;
      for (let cursor = await idx2.openCursor(undefined, 'next'); cursor && removed < toRemove; cursor = await cursor.continue()) {
        await cursor.delete();
        removed++;
      }
      await tx2.done;
    }
  } catch {
    // 忽略保留清理错误，避免阻断日志写入
  }
}

// ----- export helpers -----

export async function viewedExportJSON(): Promise<string> {
  const list = await viewedGetAll();
  return JSON.stringify(list);
}

export async function logsExportJSON(): Promise<string> {
  const list = await logsGetAll();
  return JSON.stringify(list);
}

// ----- magnets API -----

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

export async function magnetsUpsertMany(records: MagnetCacheRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('magnets', 'readwrite');
  try {
    for (const r of records) {
      await tx.store.put(r);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function magnetsQuery(params: MagnetsQueryParams): Promise<{ items: MagnetCacheRecord[]; total: number; }> {
  const { videoId, sources, hasSubtitle, minSizeBytes, offset = 0, limit = 200, orderBy = 'createdAt', order = 'desc' } = params || {} as any;
  if (!videoId) return { items: [], total: 0 };
  const db = await initDB();
  const idx = db.transaction('magnets').store.index('by_videoId');
  // @ts-ignore
  const allByVideo: MagnetCacheRecord[] = await idx.getAll(IDBKeyRange.only(videoId));

  const now = Date.now();
  // 简单过滤（排除过期）
  let filtered = allByVideo.filter((it) => {
    if (typeof it.expireAt === 'number' && it.expireAt > 0 && it.expireAt <= now) return false;
    if (sources && sources.length > 0 && !sources.includes(String(it.source))) return false;
    if (hasSubtitle === true && it.hasSubtitle !== true) return false;
    if (typeof minSizeBytes === 'number' && (it.sizeBytes || 0) < minSizeBytes) return false;
    return true;
  });

  // 排序（内存）
  const cmp = (a: MagnetCacheRecord, b: MagnetCacheRecord) => {
    let av: any;
    let bv: any;
    switch (orderBy) {
      case 'sizeBytes':
        av = a.sizeBytes || 0; bv = b.sizeBytes || 0; break;
      case 'date':
        av = Date.parse(a.date || '') || 0; bv = Date.parse(b.date || '') || 0; break;
      case 'createdAt':
      default:
        av = a.createdAt || 0; bv = b.createdAt || 0; break;
    }
    return order === 'asc' ? (av - bv) : (bv - av);
  };
  filtered.sort(cmp);

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  return { items, total };
}

export async function magnetsClearAll(): Promise<void> {
  const db = await initDB();
  await db.clear('magnets');
}

export async function magnetsClearExpired(beforeMs?: number): Promise<number> {
  const db = await initDB();
  const tx = db.transaction('magnets', 'readwrite');
  const idx = tx.store.index('by_expireAt');
  const now = typeof beforeMs === 'number' ? beforeMs : Date.now();
  let removed = 0;
  for (let cursor = await idx.openCursor(IDBKeyRange.upperBound(now)); cursor; cursor = await cursor.continue()) {
    await cursor.delete();
    removed++;
  }
  await tx.done;
  return removed;
}

// ----- insights (views / reports) API -----

export async function insViewsPut(view: ViewsDaily): Promise<void> {
  const db = await initDB();
  await db.put('insightsViews', view);
}

export async function insViewsBulkPut(views: ViewsDaily[]): Promise<void> {
  if (!views || views.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('insightsViews', 'readwrite');
  try {
    for (const v of views) {
      await tx.store.put(v as any);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function insViewsRange(startDate: string, endDate: string): Promise<ViewsDaily[]> {
  const db = await initDB();
  const idx = db.transaction('insightsViews').store.index('by_date');
  // 字符串范围 YYYY-MM-DD 可按字典序比较
  // @ts-ignore
  const range = IDBKeyRange.bound(startDate, endDate);
  const list: ViewsDaily[] = [];
  for (let cursor = await idx.openCursor(range as any); cursor; cursor = await cursor.continue()) {
    list.push(cursor.value as ViewsDaily);
  }
  return list;
}

export async function insReportsPut(report: ReportMonthly): Promise<void> {
  const db = await initDB();
  await db.put('insightsReports', report);
}

export async function insReportsGet(month: string): Promise<ReportMonthly | undefined> {
  const db = await initDB();
  return db.get('insightsReports', month);
}

export async function insReportsList(limit = 24): Promise<ReportMonthly[]> {
  const db = await initDB();
  const idx = db.transaction('insightsReports').store.index('by_createdAt');
  const list: ReportMonthly[] = [];
  // 最新在前
  for (let cursor = await idx.openCursor(undefined, 'prev'); cursor; cursor = await cursor.continue()) {
    list.push(cursor.value as ReportMonthly);
    if (list.length >= limit) break;
  }
  return list;
}

export async function insReportsDelete(month: string): Promise<void> {
  const db = await initDB();
  await db.delete('insightsReports', month);
}

export async function insReportsExportJSON(): Promise<string> {
  const db = await initDB();
  const all = await db.getAll('insightsReports');
  return JSON.stringify(all || []);
}

export async function insReportsImportJSON(json: string): Promise<number> {
  const db = await initDB();
  const arr = JSON.parse(json || '[]');
  if (!Array.isArray(arr)) return 0;
  const tx = db.transaction('insightsReports', 'readwrite');
  let cnt = 0;
  try {
    for (const r of arr) {
      if (!r || typeof r !== 'object') continue;
      const month = (r as any)?.month;
      const period = (r as any)?.period || {};
      const stats = (r as any)?.stats || {};
      const html = (r as any)?.html;
      const createdAt = (r as any)?.createdAt;
      const status = (r as any)?.status;
      const origin = (r as any)?.origin;
      // basic validation
      if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) continue;
      if (typeof period?.start !== 'string' || typeof period?.end !== 'string') continue;
      if (typeof html !== 'string' || html.length === 0) continue;
      if (typeof createdAt !== 'number') continue;
      if (status !== 'final' && status !== 'draft') continue;
      if (origin !== 'auto' && origin !== 'manual') continue;
      // stats shape (soft check)
      const okStats = stats && Array.isArray(stats.tagsTop) && Array.isArray(stats.trend) && stats.changes && Array.isArray(stats.changes.newTags);
      if (!okStats) continue;
      await tx.store.put({ ...r, month } as any);
      cnt++;
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
  return cnt;
}

// ----- actors API -----

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

export async function actorsPut(record: ActorRecord): Promise<void> {
  const db = await initDB();
  await db.put('actors', record);
}

export async function actorsBulkPut(records: ActorRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('actors', 'readwrite');
  try {
    for (const r of records) {
      await tx.store.put(r);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function actorsGet(id: string): Promise<ActorRecord | undefined> {
  const db = await initDB();
  return db.get('actors', id);
}

export async function actorsDelete(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('actors', id);
}

export async function actorsQuery(params: ActorsQueryParams): Promise<{ items: ActorRecord[]; total: number; }> {
  const { query = '', gender, category, blacklist = 'all', sortBy = 'name', order = 'asc', offset = 0, limit = 20 } = params || {} as any;
  const db = await initDB();
  const all = await db.getAll('actors');
  const q = (query || '').trim().toLowerCase();
  let filtered = all.filter((a) => {
    if (q) {
      const inName = (a.name || '').toLowerCase().includes(q);
      const inAliases = Array.isArray(a.aliases) && a.aliases.some(s => (s || '').toLowerCase().includes(q));
      if (!inName && !inAliases) return false;
    }
    if (gender && a.gender !== gender) return false;
    if (category && a.category !== category) return false;
    if (blacklist === 'exclude' && a.blacklisted) return false;
    if (blacklist === 'only' && !a.blacklisted) return false;
    return true;
  });

  filtered.sort((a, b) => {
    let av: any; let bv: any;
    switch (sortBy) {
      case 'updatedAt':
        av = a.updatedAt || 0; bv = b.updatedAt || 0; break;
      case 'worksCount':
        av = a.details?.worksCount || 0; bv = b.details?.worksCount || 0; break;
      case 'name':
      default:
        av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase();
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      const cmp = av.localeCompare(bv);
      return order === 'asc' ? cmp : -cmp;
    }
    return order === 'asc' ? (av - bv) : (bv - av);
  });

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  return { items, total };
}

export async function actorsStats(): Promise<{ total: number; byGender: Record<string, number>; byCategory: Record<string, number>; blacklisted: number; recentlyAdded: number; recentlyUpdated: number; }> {
  const db = await initDB();
  const all = await db.getAll('actors');
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const byGender: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let blacklisted = 0;
  let recentlyAdded = 0;
  let recentlyUpdated = 0;
  for (const a of all) {
    byGender[a.gender] = (byGender[a.gender] || 0) + 1;
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    if (a.blacklisted) blacklisted++;
    if ((a.createdAt || 0) > weekAgo) recentlyAdded++;
    if ((a.updatedAt || 0) > weekAgo) recentlyUpdated++;
  }
  return { total: all.length, byGender, byCategory, blacklisted, recentlyAdded, recentlyUpdated };
}

export async function actorsExportJSON(): Promise<string> {
  const db = await initDB();
  const list = await db.getAll('actors');
  return JSON.stringify(list);
}

// ----- newWorks API -----

export interface NewWorksQueryParams {
  search?: string;
  filter?: 'all' | 'unread' | 'today' | 'week';
  sort?: 'discoveredAt' | 'releaseDate' | 'actorName';
  order?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export async function newWorksPut(record: NewWorkRecord): Promise<void> {
  const db = await initDB();
  await db.put('newWorks', record);
}

export async function newWorksBulkPut(records: NewWorkRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('newWorks', 'readwrite');
  try {
    for (const r of records) {
      await tx.store.put(r);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function newWorksDelete(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('newWorks', id);
}

export async function newWorksGetAll(): Promise<NewWorkRecord[]> {
  const db = await initDB();
  return db.getAll('newWorks');
}

export async function newWorksGet(id: string): Promise<NewWorkRecord | undefined> {
  const db = await initDB();
  return db.get('newWorks', id);
}

export async function newWorksQuery(params: NewWorksQueryParams): Promise<{ items: NewWorkRecord[]; total: number; }> {
  const { search = '', filter = 'all', sort = 'discoveredAt', order = 'desc', offset = 0, limit = 20 } = params || {} as any;
  const db = await initDB();
  let items = await db.getAll('newWorks');

  const q = (search || '').trim().toLowerCase();
  if (q) {
    items = items.filter(w => (w.title || '').toLowerCase().includes(q) || (w.actorName || '').toLowerCase().includes(q) || (w.id || '').toLowerCase().includes(q));
  }

  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  if (filter === 'unread') items = items.filter(w => !w.isRead);
  else if (filter === 'today') items = items.filter(w => (w.discoveredAt || 0) >= todayStart);
  else if (filter === 'week') items = items.filter(w => (w.discoveredAt || 0) >= weekStart);

  items.sort((a, b) => {
    let av: any; let bv: any;
    switch (sort) {
      case 'releaseDate':
        av = a.releaseDate || ''; bv = b.releaseDate || ''; break;
      case 'actorName':
        av = (a.actorName || '').toLowerCase(); bv = (b.actorName || '').toLowerCase(); break;
      case 'discoveredAt':
      default:
        av = a.discoveredAt || 0; bv = b.discoveredAt || 0; break;
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      const cmp = av.localeCompare(bv);
      return order === 'asc' ? cmp : -cmp;
    }
    return order === 'asc' ? (av - bv) : (bv - av);
  });

  const total = items.length;
  const pageItems = items.slice(offset, offset + limit);
  return { items: pageItems, total };
}

export async function newWorksStats(): Promise<{ total: number; unread: number; today: number; week: number; }> {
  const db = await initDB();
  const items = await db.getAll('newWorks');
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const total = items.length;
  const unread = items.filter(w => !w.isRead).length;
  const today = items.filter(w => (w.discoveredAt || 0) >= todayStart).length;
  const week = items.filter(w => (w.discoveredAt || 0) >= weekStart).length;
  return { total, unread, today, week };
}

export async function newWorksExportJSON(): Promise<string> {
  const db = await initDB();
  const list = await db.getAll('newWorks');
  return JSON.stringify(list);
}
