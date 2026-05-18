// src/background/db.ts
// IndexedDB 封装（使用 idb），为大体量数据（如 viewed 番号库）提供高效持久化

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { VideoRecord, ActorRecord, LogEntry, ListRecord } from '../types';
import type { NewWorkRecord } from '../services/newWorks/types';
import { buildNewWorksTrendPointsFromDailyMap, mergeNewWorksDailyStatForTrend } from './trendUtils';
import { getSettings } from '../utils/storage';
import type { ViewsDaily, ReportMonthly } from '../types/insights';

// 日志持久化存储结构（扩展原 LogEntry，增加数值时间戳与自增键）
export interface PersistedLogEntry extends LogEntry {
  id?: number;            // 自增主键
  timestampMs: number;    // 数值时间戳，便于索引排序
  timestampISO?: string;  // 兼容保留
  source?: 'GENERAL' | 'DRIVE115';
  category?: string;
}

export interface PersistedMagnetPushLogEntry {
  id?: number;
  type: 'push_start' | 'push_success' | 'push_failed';
  videoId: string;
  message: string;
  timestamp: number;
  timestampMs: number;
  timestampISO?: string;
  source: 'DRIVE115';
  category: 'DRIVE115';
  data?: any;
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
  const store = db.transaction('viewedRecords').store;
  const idxCreated = store.index('by_createdAt');
  const items: RecordsTrendPoint[] = [];
  const dates = eachDate(startDate, endDate);
  
  if (mode === 'daily') {
    // 每日模式：只查询一次所有数据，然后按日期分组
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    // @ts-ignore
    const allRecords = await idxCreated.getAll(IDBKeyRange.bound(firstDate.startMs, lastDate.endMs));
    
    // 按日期分组统计
    for (const d of dates) {
      let total = 0, viewed = 0, browsed = 0, want = 0;
      for (const r of allRecords) {
        const ts = (r as any)?.createdAt || 0;
        if (ts >= d.startMs && ts <= d.endMs) {
          total++;
          const status = (r as any)?.status;
          if (status === 'viewed') viewed++;
          else if (status === 'browsed') browsed++;
          else if (status === 'want') want++;
        }
      }
      items.push({ date: d.date, total, viewed, browsed, want });
    }
  } else {
    // 累计模式：查询一次所有数据，然后累计计算
    const lastDate = dates[dates.length - 1];
    // @ts-ignore
    const allRecords = await idxCreated.getAll(IDBKeyRange.upperBound(lastDate.endMs));
    
    // 按 createdAt 排序
    allRecords.sort((a: any, b: any) => ((a?.createdAt || 0) - (b?.createdAt || 0)));
    
    let recordIndex = 0;
    let cumulativeTotal = 0, cumulativeViewed = 0, cumulativeBrowsed = 0, cumulativeWant = 0;
    
    for (const d of dates) {
      // 累加到当前日期为止的所有记录
      while (recordIndex < allRecords.length && (allRecords[recordIndex] as any)?.createdAt <= d.endMs) {
        const r = allRecords[recordIndex];
        cumulativeTotal++;
        const status = (r as any)?.status;
        if (status === 'viewed') cumulativeViewed++;
        else if (status === 'browsed') cumulativeBrowsed++;
        else if (status === 'want') cumulativeWant++;
        recordIndex++;
      }
      items.push({ date: d.date, total: cumulativeTotal, viewed: cumulativeViewed, browsed: cumulativeBrowsed, want: cumulativeWant });
    }
  }
  
  return items;
}

export interface ActorsTrendPoint { date: string; total: number; female: number; male: number; blacklisted: number; }
export async function trendsActorsRange(startDate: string, endDate: string, mode: DateMode = 'cumulative'): Promise<ActorsTrendPoint[]> {
  const db = await initDB();
  const all = await db.getAll('actors');
  const days = eachDate(startDate, endDate);
  const points: ActorsTrendPoint[] = [];
  
  // 预处理：提取时间戳并排序
  const actorsWithTs = all.map(a => ({
    actor: a,
    ts: typeof (a as any)?.createdAt === 'number' ? (a as any).createdAt : (typeof (a as any)?.updatedAt === 'number' ? (a as any).updatedAt : 0),
    gender: (a as any)?.gender,
    blacklisted: !!(a as any)?.blacklisted
  })).filter(item => item.ts > 0);
  
  if (mode === 'daily') {
    // 每日模式：按日期分组
    for (const d of days) {
      let total = 0, female = 0, male = 0, blacklisted = 0;
      for (const item of actorsWithTs) {
        if (item.ts >= d.startMs && item.ts <= d.endMs) {
          total++;
          if (item.gender === 'female') female++;
          else if (item.gender === 'male') male++;
          if (item.blacklisted) blacklisted++;
        }
      }
      points.push({ date: d.date, total, female, male, blacklisted });
    }
  } else {
    // 累计模式：排序后累加
    actorsWithTs.sort((a, b) => a.ts - b.ts);
    
    let actorIndex = 0;
    let cumulativeTotal = 0, cumulativeFemale = 0, cumulativeMale = 0, cumulativeBlacklisted = 0;
    
    for (const d of days) {
      while (actorIndex < actorsWithTs.length && actorsWithTs[actorIndex].ts <= d.endMs) {
        const item = actorsWithTs[actorIndex];
        cumulativeTotal++;
        if (item.gender === 'female') cumulativeFemale++;
        else if (item.gender === 'male') cumulativeMale++;
        if (item.blacklisted) cumulativeBlacklisted++;
        actorIndex++;
      }
      points.push({ date: d.date, total: cumulativeTotal, female: cumulativeFemale, male: cumulativeMale, blacklisted: cumulativeBlacklisted });
    }
  }
  
  return points;
}

// ----- newWorksDailyStats API -----

export async function newWorksDailyStatGet(date: string): Promise<NewWorksDailyStat | undefined> {
  const db = await initDB();
  return db.get('newWorksDailyStats', date);
}

export async function newWorksDailyStatPut(stat: NewWorksDailyStat): Promise<void> {
  const db = await initDB();
  await db.put('newWorksDailyStats', stat);
}

export async function newWorksDailyStatsRange(startDate: string, endDate: string): Promise<NewWorksDailyStat[]> {
  const db = await initDB();
  const all = await db.getAll('newWorksDailyStats');
  return all.filter(s => s.date >= startDate && s.date <= endDate);
}

/**
 * 更新当日快照：统计 IDB 中今日发现的作品数量（total/unread），
 * 并与已有快照取最大值（防止清理后数值下降）。
 */
export async function newWorksDailyStatRefreshToday(): Promise<void> {
  try {
    const db = await initDB();
    const today = fmtDateYMD(new Date());
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    // 统计今日 IDB 中的数据
    const store = db.transaction('newWorks').store;
    const idxDisc = store.index('by_discoveredAt');
    // @ts-ignore
    const todayRecords = await idxDisc.getAll(IDBKeyRange.bound(dayStart.getTime(), dayEnd.getTime()));
    const liveTotal = todayRecords.length;
    const liveUnread = todayRecords.filter((w: any) => !w.isRead).length;

    // 与已有快照取最大值（已读/清理不会让快照数值下降）
    const existing = await db.get('newWorksDailyStats', today);
    const stat: NewWorksDailyStat = {
      date: today,
      total: Math.max(liveTotal, existing?.total ?? 0),
      unread: Math.max(liveUnread, existing?.unread ?? 0),
    };
    await db.put('newWorksDailyStats', stat);
  } catch {}
}

export interface NewWorksTrendPoint { date: string; total: number; unread: number; }
export async function trendsNewWorksRange(startDate: string, endDate: string, mode: DateMode = 'cumulative'): Promise<NewWorksTrendPoint[]> {
  const db = await initDB();
  const dates = eachDate(startDate, endDate);
  const dailyMap = new Map<string, { total: number; unread: number }>();
  const countDay = (records: any[], d: { startMs: number; endMs: number }) => {
    let total = 0, unread = 0;
    for (const w of records) {
      const ts = (w as any)?.discoveredAt || 0;
      if (ts >= d.startMs && ts <= d.endMs) {
        total++;
        if (!(w as any)?.isRead) unread++;
      }
    }
    return { total, unread };
  };

  // 读取快照数据（key 为 date 字符串，直接范围过滤）
  const snapshots = await db.getAll('newWorksDailyStats');
  const snapMap = new Map<string, NewWorksDailyStat>();
  for (const s of snapshots) {
    if (s.date >= startDate && s.date <= endDate) snapMap.set(s.date, s);
  }

  if (mode === 'daily') {
    // 每日模式：优先用快照，快照没有的日期从 IDB 实时查
    const store = db.transaction('newWorks').store;
    const idxDisc = store.index('by_discoveredAt');
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    // @ts-ignore
    const allRecords = await idxDisc.getAll(IDBKeyRange.bound(firstDate.startMs, lastDate.endMs));

    for (const d of dates) {
      const snap = snapMap.get(d.date);
      dailyMap.set(d.date, mergeNewWorksDailyStatForTrend(snap, countDay(allRecords, d)));
    }
  } else {
    // 累计模式：先用快照补全每日数据，再累加
    // 对于没有快照的日期，从 IDB 实时查
    const store = db.transaction('newWorks').store;
    const idxDisc = store.index('by_discoveredAt');
    const lastDate = dates[dates.length - 1];
    // @ts-ignore
    const allRecords = await idxDisc.getAll(IDBKeyRange.upperBound(lastDate.endMs));
    allRecords.sort((a: any, b: any) => ((a?.discoveredAt || 0) - (b?.discoveredAt || 0)));

    // 构建每日数据（快照优先）
    for (const d of dates) {
      const snap = snapMap.get(d.date);
      dailyMap.set(d.date, mergeNewWorksDailyStatForTrend(snap, countDay(allRecords, d)));
    }

    // 累加
  }

  return buildNewWorksTrendPointsFromDailyMap(dates, dailyMap, mode);
}

export interface ViewedQueryParams {
  search?: string;
  status?: VideoRecord['status'] | 'all';
  tags?: string[];
  listIds?: string[];
  orderBy?: 'updatedAt' | 'createdAt' | 'id' | 'title';
  order?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  adv?: Array<{ field: string; op: string; value?: string }>;
  isFavorite?: boolean;
}

export interface ViewedPageParams {
  offset?: number;
  limit?: number;
  status?: VideoRecord['status'];
  orderBy?: 'updatedAt' | 'createdAt';
  order?: 'asc' | 'desc';
  isFavorite?: boolean;
}

export async function viewedQuery(params: ViewedQueryParams): Promise<{ items: VideoRecord[]; total: number }> {
  const { search = '', status = 'all', tags = [], listIds = [], orderBy = 'updatedAt', order = 'desc', offset = 0, limit = 50, isFavorite } = params || {} as any;
  const lower = String(search || '').trim().toLowerCase();
  const needTags = Array.isArray(tags) && tags.length > 0;
  const needListIds = Array.isArray(listIds) && listIds.length > 0;
  const adv = Array.isArray(params?.adv) ? params!.adv! : [];
  const favoriteOnly = isFavorite === true;

  if (!lower && !needTags && !needListIds && adv.length === 0 && (orderBy === 'updatedAt' || orderBy === 'createdAt')) {
    return viewedPage({
      offset,
      limit,
      status: status !== 'all' ? status as VideoRecord['status'] : undefined,
      orderBy,
      order,
      isFavorite: favoriteOnly,
    });
  }

  const usesCandidateIndexes = needListIds;
  if (usesCandidateIndexes) {
    try {
      const db = await initDB();
      const indexesReady = await ensureViewedSecondaryIndexesReady(db, false, needListIds);
      if (indexesReady) {
        const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList']);
        const viewedStore = tx.objectStore('viewedRecords');
        const listCandidates = await getVideoIdsForListFilter(tx.objectStore('viewedByList'), listIds);
        const shouldFallbackToScan = listCandidates == null;
        if (!shouldFallbackToScan) {
          if (listCandidates.size === 0) {
            return { items: [], total: 0 };
          }
          const list: VideoRecord[] = [];
          const ids = Array.from(listCandidates);
          for (const videoId of ids) {
        const r = await viewedStore.get(videoId) as VideoRecord | undefined;
        if (!r) continue;
        if (status && status !== 'all' && r.status !== status) continue;
        if (favoriteOnly && r.isFavorite !== true) continue;
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
          if (!queryLower.every(qt => arrLower.some(t => t.includes(qt)))) continue;
        }
        if (needListIds) {
          const recListIds = Array.isArray((r as any).listIds) ? ((r as any).listIds as string[]) : [];
          if (recListIds.length === 0) continue;
          if (!listIds.some((id) => recListIds.includes(String(id)))) continue;
        }
        if (adv.length > 0 && !matchAdvBasic(r, adv)) continue;
        list.push(r);
      }

      if (orderBy === 'id' || orderBy === 'title') {
        list.sort((a, b) => {
          const av = String((orderBy === 'id' ? a.id : a.title) || '');
          const bv = String((orderBy === 'id' ? b.id : b.title) || '');
          return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      } else {
        list.sort((a, b) => {
          const aVal = orderBy === 'createdAt' ? (a.createdAt || 0) : (a.updatedAt || 0);
          const bVal = orderBy === 'createdAt' ? (b.createdAt || 0) : (b.updatedAt || 0);
          return order === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

          const total = list.length;
          const items = list.slice(offset, offset + limit);
          return { items, total };
        }
      }
    } catch {}
  }

  const db = await initDB();
  const tx = db.transaction('viewedRecords');
  const store = tx.store;

  let source: any = store;
  let range: IDBKeyRange | undefined = undefined;
  const dir = order === 'asc' ? 'next' : 'prev';
  if (orderBy === 'updatedAt' || orderBy === 'createdAt') {
    try {
      const selected = buildViewedTimeCursorSource(store, {
        status: status !== 'all' ? status as VideoRecord['status'] : undefined,
        orderBy,
        favoriteOnly,
      });
      source = selected.source;
      range = selected.range;
    } catch {
      if (status && status !== 'all') {
        const idxName = orderBy === 'createdAt' ? 'by_status_createdAt' : 'by_status_updatedAt';
        source = store.index(idxName as any);
        range = IDBKeyRange.bound([status, 0] as any, [status, MAX_INDEX_NUMBER] as any);
      } else {
        const idxName = orderBy === 'createdAt' ? 'by_createdAt' : 'by_updatedAt';
        source = store.index(idxName as any);
      }
    }
  } else if (status && status !== 'all') {
    source = store.index('by_status');
    range = IDBKeyRange.only(status);
  }

  const list: VideoRecord[] = [];
  for (let cursor = await source.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
    const r = cursor.value as VideoRecord;
    if (!r) continue;
    if (status && status !== 'all' && r.status !== status) continue;
    if (favoriteOnly && r.isFavorite !== true) continue;

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
      if (!queryLower.every(qt => arrLower.some(t => t.includes(qt)))) continue;
    }
    if (needListIds) {
      const recListIds = Array.isArray((r as any).listIds) ? ((r as any).listIds as string[]) : [];
      if (recListIds.length === 0) continue;
      if (!listIds.some((id) => recListIds.includes(String(id)))) continue;
    }
    if (adv.length > 0 && !matchAdvBasic(r, adv)) continue;
    list.push(r);
  }

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
const MAX_INDEX_NUMBER = Number.MAX_SAFE_INTEGER;

function normalizeViewedRecord(record: VideoRecord): VideoRecord & { favoriteIndexed?: number } {
  return {
    ...record,
    favoriteIndexed: record.isFavorite === true ? 1 : 0,
  };
}

function deriveLogSource(msg: string): 'DRIVE115' | 'GENERAL' {
  const m = String(msg || '');
  if (/\[(?:115|115V2|Drive115)\]|115|Drive115/i.test(m)) return 'DRIVE115';
  return 'GENERAL';
}

function deriveLogCategory(msg: string): string {
  const m = String(msg || '');
  const match = m.match(/^\[([A-Z0-9]+)\]/);
  if (match) {
    const normalized = match[1].toUpperCase();
    if (normalized === '115' || normalized === '115V2' || normalized === 'DRIVE115') return 'DRIVE115';
    return normalized;
  }
  if (/\[(?:115|115V2|Drive115)\]|115|Drive115/i.test(m)) return 'DRIVE115';
  if (/DB|database/i.test(m)) return 'DB';
  if (/BG|background/i.test(m)) return 'BG';
  return 'GENERAL';
}

function buildViewedTimeCursorSource(
  store: any,
  params: { status?: VideoRecord['status']; orderBy: 'updatedAt' | 'createdAt'; favoriteOnly?: boolean }
): { source: any; range?: IDBKeyRange } {
  const { status, orderBy, favoriteOnly = false } = params;
  const suffix = orderBy === 'createdAt' ? 'createdAt' : 'updatedAt';

  if (status && favoriteOnly) {
    const source = store.index(`by_status_favorite_${suffix}` as any);
    const range = IDBKeyRange.bound([status, 1, 0] as any, [status, 1, MAX_INDEX_NUMBER] as any);
    return { source, range };
  }
  if (status) {
    const source = store.index(`by_status_${suffix}` as any);
    const range = IDBKeyRange.bound([status, 0] as any, [status, MAX_INDEX_NUMBER] as any);
    return { source, range };
  }
  if (favoriteOnly) {
    const source = store.index(`by_favorite_${suffix}` as any);
    const range = IDBKeyRange.bound([1, 0] as any, [1, MAX_INDEX_NUMBER] as any);
    return { source, range };
  }
  return { source: store.index(`by_${suffix}` as any) };
}

function buildLogsTimestampRange(fromMs?: number, toMs?: number): IDBKeyRange | undefined {
  if (fromMs != null && toMs != null) return IDBKeyRange.bound(fromMs, toMs);
  if (fromMs != null) return IDBKeyRange.lowerBound(fromMs);
  if (toMs != null) return IDBKeyRange.upperBound(toMs);
  return undefined;
}

function buildLogsIndexedCursorSource(
  store: any,
  params: { level?: LogEntry['level']; source?: 'ALL' | 'GENERAL' | 'DRIVE115'; category?: string; fromMs?: number; toMs?: number }
): { source: any; range?: IDBKeyRange; key: 'timestamp' | 'level' | 'source' | 'category' } {
  const { level, source, category, fromMs, toMs } = params;
  const min = fromMs ?? 0;
  const max = toMs ?? MAX_INDEX_NUMBER;
  const normalizedCategory = category && category !== 'ALL' ? String(category).toUpperCase() : '';

  if (level) {
    return {
      source: store.index('by_level_timestamp'),
      range: IDBKeyRange.bound([level, min] as any, [level, max] as any),
      key: 'level',
    };
  }
  if (normalizedCategory) {
    return {
      source: store.index('by_category_timestamp'),
      range: IDBKeyRange.bound([normalizedCategory, min] as any, [normalizedCategory, max] as any),
      key: 'category',
    };
  }
  if (source && source !== 'ALL') {
    return {
      source: store.index('by_source_timestamp'),
      range: IDBKeyRange.bound([source, min] as any, [source, max] as any),
      key: 'source',
    };
  }
  return {
    source: store.index('by_timestamp'),
    range: buildLogsTimestampRange(fromMs, toMs),
    key: 'timestamp',
  };
}


function normalizeTagKey(tag: string): string {
  return String(tag || '').trim().toLowerCase();
}

function normalizeListIdKey(listId: string): string {
  return String(listId || '').trim();
}

function extractRecordTagKeys(record?: VideoRecord | null): string[] {
  const raw = Array.isArray(record?.tags) ? record!.tags! : [];
  const keys = raw.map(normalizeTagKey).filter(Boolean);
  return Array.from(new Set(keys));
}

function extractRecordListKeys(record?: VideoRecord | null): string[] {
  const raw = Array.isArray(record?.listIds) ? record!.listIds! : [];
  const keys = raw.map(normalizeListIdKey).filter(Boolean);
  return Array.from(new Set(keys));
}

function makeViewedTagIndexRecord(tag: string, videoId: string): ViewedTagIndexRecord {
  return {
    key: `${tag}::${videoId}`,
    tag,
    videoId,
  };
}

function makeViewedListIndexRecord(listId: string, videoId: string): ViewedListIndexRecord {
  return {
    key: `${listId}::${videoId}`,
    listId,
    videoId,
  };
}

async function syncViewedSecondaryIndexes(
  tagStore: any,
  listStore: any,
  oldRecord?: VideoRecord | null,
  newRecord?: VideoRecord | null
): Promise<void> {
  const oldVideoId = String(oldRecord?.id || '');
  const newVideoId = String(newRecord?.id || '');
  const videoId = newVideoId || oldVideoId;
  if (!videoId) return;

  const oldTagKeys = new Set(extractRecordTagKeys(oldRecord || undefined));
  const newTagKeys = new Set(extractRecordTagKeys(newRecord || undefined));
  for (const key of oldTagKeys) {
    if (!newTagKeys.has(key)) {
      await tagStore.delete(`${key}::${videoId}`);
    }
  }
  for (const key of newTagKeys) {
    if (!oldTagKeys.has(key)) {
      await tagStore.put(makeViewedTagIndexRecord(key, videoId));
    }
  }

  const oldListKeys = new Set(extractRecordListKeys(oldRecord || undefined));
  const newListKeys = new Set(extractRecordListKeys(newRecord || undefined));
  for (const key of oldListKeys) {
    if (!newListKeys.has(key)) {
      await listStore.delete(`${key}::${videoId}`);
    }
  }
  for (const key of newListKeys) {
    if (!oldListKeys.has(key)) {
      await listStore.put(makeViewedListIndexRecord(key, videoId));
    }
  }
}

async function clearViewedSecondaryIndexesByVideoId(tagStore: any, listStore: any, videoId: string): Promise<void> {
  const normalizedVideoId = String(videoId || '').trim();
  if (!normalizedVideoId) return;
  const tagIndex = tagStore.index('by_videoId');
  const listIndex = listStore.index('by_videoId');

  for (let cursor = await tagIndex.openCursor(IDBKeyRange.only(normalizedVideoId)); cursor; cursor = await cursor.continue()) {
    await cursor.delete();
  }
  for (let cursor = await listIndex.openCursor(IDBKeyRange.only(normalizedVideoId)); cursor; cursor = await cursor.continue()) {
    await cursor.delete();
  }
}

async function getVideoIdsForListFilter(store: any, listIds: string[]): Promise<Set<string> | null> {
  const index = store.index('by_listId');
  const normalized = Array.from(new Set((Array.isArray(listIds) ? listIds : []).map(normalizeListIdKey).filter(Boolean)));
  if (normalized.length === 0) return null;
  const result = new Set<string>();
  for (const listId of normalized) {
    for (let cursor = await index.openCursor(IDBKeyRange.only(listId)); cursor; cursor = await cursor.continue()) {
      const row = cursor.value as ViewedListIndexRecord;
      if (row?.videoId) result.add(String(row.videoId));
    }
  }
  return result;
}

async function getVideoIdsForTagToken(store: any, token: string): Promise<Set<string> | null> {
  const normalizedToken = normalizeTagKey(token);
  if (!normalizedToken) return null;
  const index = store.index('by_tag');
  const matchedTags: string[] = [];
  for (let cursor = await index.openKeyCursor(undefined, 'next'); cursor; cursor = await cursor.continue()) {
    const key = String(cursor.key || '');
    if (key && key.includes(normalizedToken)) matchedTags.push(key);
  }
  if (matchedTags.length === 0) return new Set<string>();
  const result = new Set<string>();
  for (const tag of matchedTags) {
    for (let cursor = await index.openCursor(IDBKeyRange.only(tag)); cursor; cursor = await cursor.continue()) {
      const row = cursor.value as ViewedTagIndexRecord;
      if (row?.videoId) result.add(String(row.videoId));
    }
  }
  return result;
}

async function getVideoIdsForTagFilter(store: any, tags: string[]): Promise<Set<string> | null> {
  const normalized = Array.from(new Set((Array.isArray(tags) ? tags : []).map(normalizeTagKey).filter(Boolean)));
  if (normalized.length === 0) return null;
  let result: Set<string> | null = null;
  for (const tag of normalized) {
    const current = await getVideoIdsForTagToken(store, tag);
    if (!current) continue;
    if (result == null) {
      result = current;
      continue;
    }
    const next = new Set<string>();
    for (const videoId of result) {
      if (current.has(videoId)) next.add(videoId);
    }
    result = next;
    if (result.size === 0) break;
  }
  return result ?? new Set<string>();
}

function intersectVideoIdSets(a: Set<string> | null, b: Set<string> | null): Set<string> | null {
  if (a == null) return b;
  if (b == null) return a;
  const result = new Set<string>();
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const videoId of small) {
    if (large.has(videoId)) result.add(videoId);
  }
  return result;
}


async function rebuildViewedSecondaryIndexes(db: IDBPDatabase<JavdbDB>): Promise<void> {
  const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList'], 'readwrite');
  const viewedStore = tx.objectStore('viewedRecords');
  const tagStore = tx.objectStore('viewedByTag');
  const listStore = tx.objectStore('viewedByList');
  await tagStore.clear();
  await listStore.clear();
  for (let cursor = await viewedStore.openCursor(); cursor; cursor = await cursor.continue()) {
    const value = normalizeViewedRecord((cursor.value || {}) as VideoRecord);
    const videoId = String(value.id || '');
    for (const tag of extractRecordTagKeys(value)) {
      await tagStore.put(makeViewedTagIndexRecord(tag, videoId));
    }
    for (const listId of extractRecordListKeys(value)) {
      await listStore.put(makeViewedListIndexRecord(listId, videoId));
    }
  }
  await tx.done;
}

async function ensureViewedSecondaryIndexesReady(db: IDBPDatabase<JavdbDB>, needTags: boolean, needListIds: boolean): Promise<boolean> {
  try {
    if (needTags) {
      const tagCount = await db.count('viewedByTag');
      if (tagCount <= 0) {
        const viewedCount = await db.count('viewedRecords');
        if (viewedCount > 0) {
          await rebuildViewedSecondaryIndexes(db);
        }
      }
    }
    if (needListIds) {
      const listCount = await db.count('viewedByList');
      if (listCount <= 0) {
        const viewedCount = await db.count('viewedRecords');
        if (viewedCount > 0) {
          await rebuildViewedSecondaryIndexes(db);
        }
      }
    }
    return true;
  } catch {
    return false;
  }
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


export interface ViewedTagIndexRecord {
  key: string;
  tag: string;
  videoId: string;
}

export interface ViewedListIndexRecord {
  key: string;
  listId: string;
  videoId: string;
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
      by_favorite_updatedAt: [number, number];
      by_favorite_createdAt: [number, number];
      by_status_favorite_updatedAt: [string, number, number];
      by_status_favorite_createdAt: [string, number, number];
    };
  };
  viewedByTag: {
    key: string;
    value: ViewedTagIndexRecord;
    indexes: {
      by_tag: string;
      by_videoId: string;
    };
  };
  viewedByList: {
    key: string;
    value: ViewedListIndexRecord;
    indexes: {
      by_listId: string;
      by_videoId: string;
    };
  };
  lists: {
    key: string; // list id
    value: ListRecord;
    indexes: {
      by_type: string;
      by_updatedAt: number;
      by_source: string;
    };
  };
  logs: {
    key: number; // autoIncrement id
    value: PersistedLogEntry;
    indexes: {
      by_timestamp: number;
      by_level: string;
      by_level_timestamp: [string, number];
      by_source_timestamp: [string, number];
      by_category_timestamp: [string, number];
    };
  };
  actors: {
    key: string; // actor id
    value: ActorRecord;
    indexes: {
      by_name: string;
      by_updatedAt: number;
      by_gender: string;
      by_category: string;
      by_blacklisted: number; // 布尔值在 IndexedDB 中作为数字存储
      by_createdAt: number;
    };
  };
  newWorks: {
    key: string; // work id（暂定）
    value: NewWorkRecord;
    indexes: {
      by_actorId: string;
      by_discoveredAt: number;
      by_status: string;
      by_isRead: number; // 布尔值在 IndexedDB 中作为数字存储
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
  magnetPushLogs: {
    key: number;
    value: PersistedMagnetPushLogEntry;
    indexes: {
      by_timestamp: number;
      by_type: string;
      by_videoId: string;
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
  newWorksDailyStats: {
    key: string; // date YYYY-MM-DD
    value: NewWorksDailyStat;
    indexes: Record<string, never>;
  };
}

// 新作品每日快照
export interface NewWorksDailyStat {
  date: string;    // YYYY-MM-DD
  total: number;   // 当日累计发现总量（含已读）
  unread: number;  // 当日未读量
}

const DB_NAME = 'javdb_v1';
const DB_VERSION = 14;

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
          actors.createIndex('by_gender', 'gender');
          actors.createIndex('by_category', 'category');
          actors.createIndex('by_blacklisted', 'blacklisted');
          actors.createIndex('by_createdAt', 'createdAt');

          // newWorks
          const nw = db.createObjectStore('newWorks', { keyPath: 'id' });
          nw.createIndex('by_actorId', 'actorId');
          nw.createIndex('by_discoveredAt', 'discoveredAt');
          nw.createIndex('by_status', 'status');
          nw.createIndex('by_isRead', 'isRead');

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
        // v5 -> 新增 lists
        if (oldVersion < 5) {
          try {
            const ls = db.createObjectStore('lists', { keyPath: 'id' });
            ls.createIndex('by_type', 'type');
            ls.createIndex('by_updatedAt', 'updatedAt');
          } catch {}
        }
        // v6 -> 预留版本（无结构变更）
        if (oldVersion < 6) {
          // 无需操作，仅版本号升级
        }
        // v7 -> 为 actors 和 newWorks 添加性能优化索引
        if (oldVersion < 7) {
          try {
            const actorsStore = tx.objectStore('actors');
            // 检查索引是否已存在，避免重复创建
            const existingIndexes = Array.from(actorsStore.indexNames);
            if (!existingIndexes.includes('by_gender')) {
              try { actorsStore.createIndex('by_gender', 'gender'); } catch {}
            }
            if (!existingIndexes.includes('by_category')) {
              try { actorsStore.createIndex('by_category', 'category'); } catch {}
            }
            if (!existingIndexes.includes('by_blacklisted')) {
              try { actorsStore.createIndex('by_blacklisted', 'blacklisted'); } catch {}
            }
            if (!existingIndexes.includes('by_createdAt')) {
              try { actorsStore.createIndex('by_createdAt', 'createdAt'); } catch {}
            }
          } catch {}
          try {
            const newWorksStore = tx.objectStore('newWorks');
            const existingIndexes = Array.from(newWorksStore.indexNames);
            if (!existingIndexes.includes('by_isRead')) {
              try { newWorksStore.createIndex('by_isRead', 'isRead'); } catch {}
            }
          } catch {}
        }
        // v8 -> 为 lists 新增 by_source 索引，支持按来源查询清单
        if (oldVersion < 8) {
          try {
            const listsStore = tx.objectStore('lists');
            const existingIndexes = Array.from(listsStore.indexNames);
            if (!existingIndexes.includes('by_source')) {
              try { listsStore.createIndex('by_source', 'source'); } catch {}
            }
          } catch {}
        }
        // v9 -> 新增 newWorksDailyStats，用于新作品趋势快照（防止已读/清理后数据丢失）
        if (oldVersion < 9) {
          try {
            db.createObjectStore('newWorksDailyStats', { keyPath: 'date' });
          } catch {}
        }

        // v10 -> 为 viewedRecords / logs 增加高频查询索引，并为旧日志回填 source/category
        if (oldVersion < 10) {
          try {
            const viewedStore = tx.objectStore('viewedRecords');
            const existingIndexes = Array.from(viewedStore.indexNames);
            if (!existingIndexes.includes('by_favorite_updatedAt')) {
              try { viewedStore.createIndex('by_favorite_updatedAt', ['favoriteIndexed', 'updatedAt']); } catch {}
            }
            if (!existingIndexes.includes('by_favorite_createdAt')) {
              try { viewedStore.createIndex('by_favorite_createdAt', ['favoriteIndexed', 'createdAt']); } catch {}
            }
            if (!existingIndexes.includes('by_status_favorite_updatedAt')) {
              try { viewedStore.createIndex('by_status_favorite_updatedAt', ['status', 'favoriteIndexed', 'updatedAt']); } catch {}
            }
            if (!existingIndexes.includes('by_status_favorite_createdAt')) {
              try { viewedStore.createIndex('by_status_favorite_createdAt', ['status', 'favoriteIndexed', 'createdAt']); } catch {}
            }
          } catch {}
          try {
            const logsStore = tx.objectStore('logs');
            const existingIndexes = Array.from(logsStore.indexNames);
            if (!existingIndexes.includes('by_level_timestamp')) {
              try { logsStore.createIndex('by_level_timestamp', ['level', 'timestampMs']); } catch {}
            }
            if (!existingIndexes.includes('by_source_timestamp')) {
              try { logsStore.createIndex('by_source_timestamp', ['source', 'timestampMs']); } catch {}
            }
            if (!existingIndexes.includes('by_category_timestamp')) {
              try { logsStore.createIndex('by_category_timestamp', ['category', 'timestampMs']); } catch {}
            }
            const request = logsStore.openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const value = (cursor.value || {}) as PersistedLogEntry;
              const sourceValue = value.source || deriveLogSource(String(value.message || ''));
              const categoryValue = value.category || deriveLogCategory(String(value.message || ''));
              if (value.source !== sourceValue || value.category !== categoryValue) {
                cursor.update({ ...value, source: sourceValue, category: categoryValue });
              }
              cursor.continue();
            };
          } catch {}
          try {
            const viewedStore = tx.objectStore('viewedRecords');
            const request = viewedStore.openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const value = (cursor.value || {}) as VideoRecord & { favoriteIndexed?: number };
              const favoriteIndexed = value.isFavorite === true ? 1 : 0;
              if (value.favoriteIndexed !== favoriteIndexed) {
                cursor.update({ ...value, favoriteIndexed });
              }
              cursor.continue();
            };
          } catch {}
        }

        if (oldVersion < 11) {
          try {
            const tagStore = db.createObjectStore('viewedByTag', { keyPath: 'key' });
            tagStore.createIndex('by_tag', 'tag');
            tagStore.createIndex('by_videoId', 'videoId');
          } catch {}
          try {
            const listStore = db.createObjectStore('viewedByList', { keyPath: 'key' });
            listStore.createIndex('by_listId', 'listId');
            listStore.createIndex('by_videoId', 'videoId');
          } catch {}
          try {
            const viewedStore = tx.objectStore('viewedRecords');
            const tagStore = tx.objectStore('viewedByTag');
            const listStore = tx.objectStore('viewedByList');
            const request = viewedStore.openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const value = normalizeViewedRecord((cursor.value || {}) as VideoRecord);
              const videoId = String(value.id || '');
              for (const tag of extractRecordTagKeys(value)) {
                try { tagStore.put(makeViewedTagIndexRecord(tag, videoId)); } catch {}
              }
              for (const listId of extractRecordListKeys(value)) {
                try { listStore.put(makeViewedListIndexRecord(listId, videoId)); } catch {}
              }
              cursor.continue();
            };
          } catch {}
        }
        // v12 -> 磁力推送日志独立存储池
        if (oldVersion < 12) {
          try {
            const store = db.createObjectStore('magnetPushLogs', { keyPath: 'id', autoIncrement: true });
            store.createIndex('by_timestamp', 'timestampMs');
            store.createIndex('by_type', 'type');
            store.createIndex('by_videoId', 'videoId');
          } catch {}
        }
      }
    });
  }
  return dbPromise;
}

// ----- lists API -----

export async function listsPut(record: ListRecord): Promise<void> {
  const db = await initDB();
  await db.put('lists', record);
}

export async function listsBulkPut(records: ListRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('lists', 'readwrite');
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

export async function listsGet(id: string): Promise<ListRecord | undefined> {
  const db = await initDB();
  return db.get('lists', id);
}

export async function listsGetAll(): Promise<ListRecord[]> {
  const db = await initDB();
  return db.getAll('lists');
}

export async function listsClear(): Promise<void> {
  const db = await initDB();
  await db.clear('lists');
}

export async function listsDelete(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('lists', id);
}

/**
 * 规范化清单记录：对缺失 source 字段的旧数据补全为 'javdb'，不修改其他字段
 */
function normalizeListRecord(r: any): ListRecord {
  return { ...r, source: r.source ?? 'javdb' };
}

/**
 * 获取所有清单并规范化 source 字段（兼容旧数据）
 */
export async function listsGetAllNormalized(): Promise<ListRecord[]> {
  const records = await listsGetAll();
  return records.map(normalizeListRecord);
}

/**
 * 按 ID 获取单条清单并规范化 source 字段（兼容旧数据）
 */
export async function listsGetNormalized(id: string): Promise<ListRecord | undefined> {
  const record = await listsGet(id);
  if (!record) return undefined;
  return normalizeListRecord(record);
}

/**
 * 按来源查询清单（使用 by_source 索引）
 */
export async function listsGetBySource(source: 'javdb' | 'local'): Promise<ListRecord[]> {
  const db = await initDB();
  const idx = db.transaction('lists').store.index('by_source');
  // @ts-ignore
  const records = await idx.getAll(IDBKeyRange.only(source));
  return records.map(normalizeListRecord);
}

/**
 * 原子更新单个视频的 listIds（在单个 IndexedDB 事务中完成读取-修改-写入）
 * 使用 Set 保证幂等性：add 时不重复添加，remove 时安全删除
 */
export async function viewedPatchListIds(
  videoId: string,
  listId: string,
  action: 'add' | 'remove'
): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList'], 'readwrite');
  const viewedStore = tx.objectStore('viewedRecords');
  const oldRecord = await viewedStore.get(videoId);
  if (!oldRecord) { await tx.done; return; }
  const record = normalizeViewedRecord(oldRecord);
  const ids = new Set<string>(Array.isArray(record.listIds) ? record.listIds : []);
  if (action === 'add') ids.add(listId);
  else ids.delete(listId);
  record.listIds = Array.from(ids);
  record.updatedAt = Date.now();
  await viewedStore.put(record as any);
  await syncViewedSecondaryIndexes(tx.objectStore('viewedByTag'), tx.objectStore('viewedByList'), oldRecord, record);
  await tx.done;
}

/**
 * 批量更新多个视频的 listIds
 * @param videoIds 视频 ID 数组，或 'all' 表示所有视频
 * @param listId 目标清单 ID
 * @param action 'add' 或 'remove'
 * @returns 成功与失败计数
 */
export async function viewedBulkPatchListIds(
  videoIds: string[] | 'all',
  listId: string,
  action: 'add' | 'remove'
): Promise<{ successCount: number; failCount: number }> {
  let ids: string[];
  if (videoIds === 'all') {
    const db = await initDB();
    ids = await db.getAllKeys('viewedRecords') as string[];
  } else {
    ids = videoIds;
  }

  let successCount = 0;
  let failCount = 0;

  // 串行执行，单条失败不中断整体流程
  for (const videoId of ids) {
    try {
      await viewedPatchListIds(videoId, listId, action);
      successCount++;
    } catch {
      failCount++;
    }
  }

  return { successCount, failCount };
}

// ----- viewedRecords API -----

export async function viewedPut(record: VideoRecord): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList'], 'readwrite');
  const viewedStore = tx.objectStore('viewedRecords');
  const normalized = normalizeViewedRecord(record);
  const oldRecord = await viewedStore.get(normalized.id);
  await viewedStore.put(normalized as any);
  await syncViewedSecondaryIndexes(tx.objectStore('viewedByTag'), tx.objectStore('viewedByList'), oldRecord, normalized);
  await tx.done;
}

export async function viewedBulkPut(records: VideoRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList'], 'readwrite');
  const viewedStore = tx.objectStore('viewedRecords');
  try {
    for (const r of records) {
      const normalized = normalizeViewedRecord(r);
      const oldRecord = await viewedStore.get(normalized.id);
      await viewedStore.put(normalized as any);
      await syncViewedSecondaryIndexes(tx.objectStore('viewedByTag'), tx.objectStore('viewedByList'), oldRecord, normalized);
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
  const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList'], 'readwrite');
  const viewedStore = tx.objectStore('viewedRecords');
  await clearViewedSecondaryIndexesByVideoId(tx.objectStore('viewedByTag'), tx.objectStore('viewedByList'), videoId);
  await viewedStore.delete(videoId);
  await tx.done;
}

export async function viewedBulkDelete(videoIds: string[]): Promise<void> {
  if (!videoIds || videoIds.length === 0) return;
  const db = await initDB();
  const tx = db.transaction(['viewedRecords', 'viewedByTag', 'viewedByList'], 'readwrite');
  const viewedStore = tx.objectStore('viewedRecords');
  try {
    for (const id of videoIds) {
      await clearViewedSecondaryIndexesByVideoId(tx.objectStore('viewedByTag'), tx.objectStore('viewedByList'), id);
      await viewedStore.delete(id);
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

export async function viewedPage(params: ViewedPageParams): Promise<{ items: VideoRecord[]; total: number; }> {
  const { offset = 0, limit = 50, status, orderBy = 'updatedAt', order = 'desc', isFavorite } = params || {} as any;
  const db = await initDB();
  const favoriteOnly = isFavorite === true;
  const dir = order === 'asc' ? 'next' : 'prev';

  try {
    const tx = db.transaction('viewedRecords');
    const store = tx.store;
    const { source, range } = buildViewedTimeCursorSource(store, {
      status,
      orderBy,
      favoriteOnly,
    });

    let total = 0;
    try {
      total = range ? await source.count(range as any) : await store.count();
    } catch {
      total = 0;
    }

    const items: VideoRecord[] = [];
    let skipped = 0;
    let collected = 0;
    for (let cursor = await source.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
      if (skipped < offset) {
        skipped++;
        continue;
      }
      items.push(cursor.value as VideoRecord);
      collected++;
      if (collected >= limit) break;
    }

    return { items, total };
  } catch {
    const tx = db.transaction('viewedRecords');
    const store = tx.store;
    const allItems: VideoRecord[] = [];
    for (let cursor = await store.openCursor(); cursor; cursor = await cursor.continue()) {
      const record = cursor.value as VideoRecord;
      const matchesStatus = !status || record.status === status;
      const matchesFavorite = !favoriteOnly || record.isFavorite === true;
      if (matchesStatus && matchesFavorite) {
        allItems.push(record);
      }
    }
    allItems.sort((a, b) => {
      const aVal = orderBy === 'createdAt' ? (a.createdAt || 0) : (a.updatedAt || 0);
      const bVal = orderBy === 'createdAt' ? (b.createdAt || 0) : (b.updatedAt || 0);
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return {
      items: allItems.slice(offset, offset + limit),
      total: allItems.length,
    };
  }
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
  const source = deriveLogSource(String(entry.message || ''));
  const category = deriveLogCategory(String(entry.message || ''));
  return {
    ...entry,
    timestamp: timestampISO,
    timestampISO,
    timestampMs: ms,
    source,
    category,
  } as PersistedLogEntry;
}

function normalizeMagnetPushLog(entry: any): PersistedMagnetPushLogEntry {
  const ts = typeof entry?.timestamp === 'number' ? entry.timestamp : Date.now();
  return {
    id: entry?.id,
    type: entry?.type,
    videoId: String(entry?.videoId || ''),
    message: String(entry?.message || ''),
    timestamp: ts,
    timestampMs: ts,
    timestampISO: new Date(ts).toISOString(),
    source: 'DRIVE115',
    category: 'DRIVE115',
    data: entry?.data,
  };
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
  category?: string; // 新增：日志类别筛选（如 DB、BG、CONTENT等）
}

export async function logsQuery(params: LogsQueryParams): Promise<{ items: PersistedLogEntry[]; total: number; }> {
  const { level, minLevel, fromMs, toMs, offset = 0, limit = 100, order = 'desc', query = '', hasDataOnly = false, source = 'ALL', category } = params || {} as any;
  const db = await initDB();
  const store = db.transaction('logs').store;
  const dir = order === 'asc' ? 'next' : 'prev';
  const q = String(query || '').trim().toLowerCase();
  const normalizedCategory = category && category !== 'ALL' ? String(category).toUpperCase() : '';

  const rank = (lv: LogEntry['level']) => {
    switch (lv) {
      case 'DEBUG': return 0;
      case 'INFO': return 1;
      case 'WARN': return 2;
      case 'ERROR': return 3;
      default: return 0;
    }
  };
  const minRank = (() => {
    if (!minLevel) return null;
    if (minLevel === 'OFF') return Infinity;
    return rank(minLevel as LogEntry['level']);
  })();

  const canUseExactIndexedPage = !q && !hasDataOnly && !minLevel && (
    (!!level && source === 'ALL' && !normalizedCategory) ||
    (!level && source !== 'ALL' && !normalizedCategory) ||
    (!level && source === 'ALL' && !!normalizedCategory) ||
    (!level && source === 'ALL' && !normalizedCategory)
  );

  if (canUseExactIndexedPage) {
    const { source: cursorSource, range } = buildLogsIndexedCursorSource(store, {
      level,
      source,
      category: normalizedCategory || undefined,
      fromMs,
      toMs,
    });
    let total = 0;
    try {
      total = range ? await cursorSource.count(range as any) : await store.count();
    } catch {
      total = 0;
    }

    const items: PersistedLogEntry[] = [];
    let skipped = 0;
    let collected = 0;
    for (let cursor = await cursorSource.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
      if (skipped < offset) {
        skipped++;
        continue;
      }
      items.push(cursor.value as PersistedLogEntry);
      collected++;
      if (collected >= limit) break;
    }
    return { items, total };
  }

  const { source: cursorSource, range } = buildLogsIndexedCursorSource(store, {
    level,
    source,
    category: normalizedCategory || undefined,
    fromMs,
    toMs,
  });

  const items: PersistedLogEntry[] = [];
  let skipped = 0;
  let collected = 0;
  let total = 0;
  for (let cursor = await cursorSource.openCursor(range as any, dir); cursor; cursor = await cursor.continue()) {
    const v = cursor.value as PersistedLogEntry;
    const sourceValue = v.source || deriveLogSource(String(v.message || ''));
    const categoryValue = (v.category || deriveLogCategory(String(v.message || ''))).toUpperCase();

    if (level && v.level !== level) continue;
    if (minRank != null && minRank !== Infinity && rank(v.level as any) < minRank) continue;
    if (minRank === Infinity) continue;
    if (hasDataOnly && !v.data) continue;
    if (q) {
      const inMsg = String(v.message || '').toLowerCase().includes(q);
      let inData = false;
      try { inData = v.data ? JSON.stringify(v.data).toLowerCase().includes(q) : false; } catch { inData = false; }
      if (!inMsg && !inData) continue;
    }
    if (source && source !== 'ALL' && sourceValue !== source) continue;
    if (normalizedCategory && categoryValue !== normalizedCategory) continue;

    total++;
    if (skipped < offset) {
      skipped++;
      continue;
    }
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

async function ensureMagnetPushLogsStore(): Promise<void> {
  const db = await initDB();
  if (db.objectStoreNames.contains('magnetPushLogs')) return;
  db.close();
  dbPromise = null;
  await initDB();
}

export async function magnetPushLogsAdd(entry: any): Promise<number> {
  await ensureMagnetPushLogsStore();
  const db = await initDB();
  const v = normalizeMagnetPushLog(entry);
  const id = await db.add('magnetPushLogs', v as any);
  try { await magnetPushLogsEnforceRetention(); } catch {}
  return id as number;
}

export async function magnetPushLogsBulkAdd(entries: any[]): Promise<void> {
  if (!entries || entries.length === 0) return;
  await ensureMagnetPushLogsStore();
  const db = await initDB();
  const tx = db.transaction('magnetPushLogs', 'readwrite');
  try {
    for (const e of entries) {
      const v = normalizeMagnetPushLog(e);
      await tx.store.add(v as any);
    }
    await tx.done;
    try { await magnetPushLogsEnforceRetention(); } catch {}
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function magnetPushLogsQuery(params: {
  type?: 'push_start' | 'push_success' | 'push_failed' | 'ALL';
  fromMs?: number;
  toMs?: number;
  offset?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  query?: string;
  status?: 'ALL' | 'SUCCESS' | 'FAILED';
}): Promise<{ items: PersistedMagnetPushLogEntry[]; total: number; }> {
  const { type = 'ALL', fromMs, toMs, offset = 0, limit = 100, order = 'desc', query = '', status = 'ALL' } = params || {} as any;
  await ensureMagnetPushLogsStore();
  const db = await initDB();
  const store = db.transaction('magnetPushLogs').store;
  const idx = store.index('by_timestamp');
  const dir = order === 'asc' ? 'next' : 'prev';
  const q = String(query || '').trim().toLowerCase();
  const items: PersistedMagnetPushLogEntry[] = [];
  let skipped = 0;
  let total = 0;
  for (let cursor = await idx.openCursor(undefined, dir); cursor; cursor = await cursor.continue()) {
    const v = cursor.value as PersistedMagnetPushLogEntry;
    if (fromMs != null && v.timestampMs < fromMs) continue;
    if (toMs != null && v.timestampMs > toMs) continue;
    if (type !== 'ALL' && v.type !== type) continue;
    if (status === 'SUCCESS' && v.type !== 'push_success') continue;
    if (status === 'FAILED' && v.type !== 'push_failed') continue;
    if (q) {
      const inMsg = String(v.message || '').toLowerCase().includes(q);
      let inData = false;
      try { inData = v.data ? JSON.stringify(v.data).toLowerCase().includes(q) : false; } catch { inData = false; }
      if (!inMsg && !inData) continue;
    }
    total++;
    if (skipped < offset) { skipped++; continue; }
    if (items.length < limit) items.push(v);
  }
  return { items, total };
}

export async function magnetPushLogsClear(beforeMs?: number): Promise<void> {
  await ensureMagnetPushLogsStore();
  const db = await initDB();
  const tx = db.transaction('magnetPushLogs', 'readwrite');
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

export async function magnetPushLogsGetAll(): Promise<PersistedMagnetPushLogEntry[]> {
  await ensureMagnetPushLogsStore();
  const db = await initDB();
  return db.getAll('magnetPushLogs');
}

async function magnetPushLogsEnforceRetention(): Promise<void> {
  try {
    const settings = await getSettings();
    const logging: any = (settings as any)?.logging || {};
    let maxEntries = Number(logging.maxMagnetPushEntries ?? 10000);
    if (!Number.isFinite(maxEntries) || maxEntries <= 0) maxEntries = 10000;
    const db = await initDB();
    const total = await db.count('magnetPushLogs');
    if (total <= maxEntries) return;
    const toRemove = total - maxEntries;
    const tx = db.transaction('magnetPushLogs', 'readwrite');
    const idx = tx.store.index('by_timestamp');
    let removed = 0;
    for (let cursor = await idx.openCursor(undefined, 'next'); cursor && removed < toRemove; cursor = await cursor.continue()) {
      await cursor.delete();
      removed++;
    }
    await tx.done;
  } catch {}
}

// 保留策略：按条数限制
async function logsEnforceRetention(): Promise<void> {
  try {
    const settings = await getSettings();
    const logging: any = (settings as any)?.logging || {};
    let maxEntries = Number(logging.maxLogEntries ?? logging.maxEntries ?? 5000);
    if (!Number.isFinite(maxEntries) || maxEntries <= 0) maxEntries = 5000;

    const db = await initDB();
    const total = await db.count('logs');
    if (total <= maxEntries) return;

    const toRemove = total - maxEntries;
    const tx = db.transaction('logs', 'readwrite');
    const idx = tx.store.index('by_timestamp');
    let removed = 0;
    for (let cursor = await idx.openCursor(undefined, 'next'); cursor && removed < toRemove; cursor = await cursor.continue()) {
      await cursor.delete();
      removed++;
    }
    await tx.done;
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
  videoId?: string;
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
  const db = await initDB();
  let allByVideo: MagnetCacheRecord[] = [];
  if (videoId) {
    const idx = db.transaction('magnets').store.index('by_videoId');
    // @ts-ignore
    allByVideo = await idx.getAll(IDBKeyRange.only(videoId));
  } else {
    allByVideo = await db.getAll('magnets');
  }

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
  const tx = db.transaction('actors');
  const store = tx.store;
  
  // 使用索引优化查询
  const total = await store.count();
  
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  // 统计性别分布 - 直接遍历所有记录
  const byGender: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let blacklisted = 0;
  let recentlyAdded = 0;
  let recentlyUpdated = 0;

  // 一次性获取所有数据进行统计
  const all = await store.getAll();
  for (const actor of all) {
    // 统计性别
    if (actor.gender) {
      byGender[actor.gender] = (byGender[actor.gender] || 0) + 1;
    }
    // 统计分类
    if (actor.category) {
      byCategory[actor.category] = (byCategory[actor.category] || 0) + 1;
    }
    // 统计黑名单
    if (actor.blacklisted) {
      blacklisted++;
    }
    // 统计最近添加
    if (actor.createdAt && actor.createdAt > weekAgo) {
      recentlyAdded++;
    }
    // 统计最近更新
    if (actor.updatedAt && actor.updatedAt > weekAgo) {
      recentlyUpdated++;
    }
  }
  
  return { total, byGender, byCategory, blacklisted, recentlyAdded, recentlyUpdated };
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
  await newWorksDailyStatRefreshToday();
}

export async function newWorksBulkPut(records: NewWorkRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  console.log(`[IDB] newWorksBulkPut: 准备写入 ${records.length} 个作品到 IndexedDB`);
  const db = await initDB();
  const tx = db.transaction('newWorks', 'readwrite');
  try {
    for (const r of records) {
      await tx.store.put(r);
    }
    await tx.done;
    console.log(`[IDB] newWorksBulkPut: 成功写入 ${records.length} 个作品到 IndexedDB`);
    
    // 验证写入：立即读取确认
    const count = await db.count('newWorks');
    console.log(`[IDB] newWorksBulkPut: 写入后 IndexedDB 中共有 ${count} 个作品`);
  } catch (e) {
    console.error(`[IDB] newWorksBulkPut: 写入失败`, e);
    try { await tx.done; } catch {}
    throw e;
  }
  // 写入后刷新当日快照，确保趋势数据不因后续已读/清理而丢失
  await newWorksDailyStatRefreshToday();
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
  console.log(`[IDB] newWorksQuery: 从 IndexedDB 获取到 ${items.length} 个作品`, { search, filter, sort, order, offset, limit });

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
  const tx = db.transaction('newWorks');
  const store = tx.store;
  
  console.log(`[IDB] newWorksStats: 开始统计`);
  
  const total = await store.count();
  
  // 使用索引统计未读数量
  let unread = 0;
  try {
    const isReadIndex = store.index('by_isRead');
    unread = await isReadIndex.count(IDBKeyRange.only(false));
  } catch {
    // 如果索引不存在，回退到全量查询
    const items = await store.getAll();
    unread = items.filter(w => !w.isRead).length;
  }
  
  // 使用索引统计今日和本周发现的作品
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  
  let today = 0;
  let week = 0;
  try {
    const discoveredIndex = store.index('by_discoveredAt');
    today = await discoveredIndex.count(IDBKeyRange.lowerBound(todayStart));
    week = await discoveredIndex.count(IDBKeyRange.lowerBound(weekStart));
  } catch {
    const items = await store.getAll();
    today = items.filter(w => (w.discoveredAt || 0) >= todayStart).length;
    week = items.filter(w => (w.discoveredAt || 0) >= weekStart).length;
  }
  
  console.log(`[IDB] newWorksStats: 统计结果`, { total, unread, today, week });
  return { total, unread, today, week };
}

export async function newWorksExportJSON(): Promise<string> {
  const db = await initDB();
  const list = await db.getAll('newWorks');
  return JSON.stringify(list);
}
