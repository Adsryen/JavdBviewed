// src/background/db.ts
// IndexedDB 封装（使用 idb），为大体量数据（如 viewed 番号库）提供高效持久化

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { VideoRecord, ActorRecord, LogEntry } from '../types';
import type { NewWorkRecord } from '../services/newWorks/types';

// 日志持久化存储结构（扩展原 LogEntry，增加数值时间戳与自增键）
export interface PersistedLogEntry extends LogEntry {
  id?: number;            // 自增主键
  timestampMs: number;    // 数值时间戳，便于索引排序
  timestampISO?: string;  // 兼容保留
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
}

const DB_NAME = 'javdb_v1';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<JavdbDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<JavdbDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JavdbDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<JavdbDB>, oldVersion: number) {
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
    // 先按状态取全量，再内存排序与分页（简单可用，后续可加复合索引优化）
    const idx = db.transaction('viewedRecords').store.index('by_status');
    // @ts-ignore
    const all = await idx.getAll(IDBKeyRange.only(status));
    total = all.length;
    all.sort((a, b) => order === 'asc' ? (a[orderBy] - b[orderBy]) : (b[orderBy] - a[orderBy]));
    items = all.slice(offset, offset + limit);
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
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export interface LogsQueryParams {
  level?: LogEntry['level'];
  fromMs?: number;
  toMs?: number;
  offset?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function logsQuery(params: LogsQueryParams): Promise<{ items: PersistedLogEntry[]; total: number; }> {
  const { level, fromMs, toMs, offset = 0, limit = 100, order = 'desc' } = params || {} as any;
  const db = await initDB();
  const idx = db.transaction('logs').store.index('by_timestamp');
  let range: IDBKeyRange | undefined = undefined;
  if (fromMs != null && toMs != null) range = IDBKeyRange.bound(fromMs, toMs);
  else if (fromMs != null) range = IDBKeyRange.lowerBound(fromMs);
  else if (toMs != null) range = IDBKeyRange.upperBound(toMs);
  const dir = order === 'asc' ? 'next' : 'prev';

  // total（按范围计数）
  let total = 0;
  try {
    // @ts-ignore
    total = await idx.count(range as any);
  } catch {
    total = 0;
  }

  const items: PersistedLogEntry[] = [];
  let skipped = 0;
  let collected = 0;
  for (let cursor = await idx.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
    const v = cursor.value as PersistedLogEntry;
    if (level && v.level !== level) continue;
    if (skipped < offset) { skipped++; continue; }
    items.push(v);
    collected++;
    if (collected >= limit) break;
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
