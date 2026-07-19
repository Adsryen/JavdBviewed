/**
 * @file extensionEntityStore.ts
 * @description 将本地 IDB / chrome.storage 用户资产映射为 SyncEntity，并写回
 * @module features/cloudSync
 */
import type { LocalEntityStore } from '@javdb/sync-client';
import type { SyncEntity } from '@javdb/sync-protocol';
import type { ActorRecord, ListRecord, NewWorkRecord, VideoRecord } from '../../types';
import type { ReportMonthly, ViewsDaily } from '../../types/insights';
import { STORAGE_KEYS } from '../../utils/config';
import { getSettings, getValue, setValue } from '../../utils/storage';
import {
  actorsBulkPut,
  actorsGet,
  initDB,
  listsBulkPut,
  listsGet,
  newWorksBulkPut,
  newWorksGet,
  viewedBulkPut,
  viewedGet,
  type MagnetCacheRecord,
  type NewWorksDailyStat,
} from '../../platform/storage/indexedDb';
import {
  clearCloudPending,
  ensureInitialPending,
  listCloudPending,
} from './chromePendingStore';
import { markCloudStorageWrite } from './storageChangeGate';
import { shouldSyncStorageItemKey, STORAGE_ITEM_TYPE } from './storageItemPolicy';

function asRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

function ownValue(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = ownValue(record, key);
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function timestampFromPayload(payload: unknown, fields: readonly string[]): number {
  const record = asRecord(payload);
  for (const field of fields) {
    const value = ownValue(record, field);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return Date.now();
}

function toEntity(type: string, id: string, payload: unknown, updatedAt?: number): SyncEntity {
  const ts =
    typeof updatedAt === 'number' && Number.isFinite(updatedAt)
      ? updatedAt
      : Date.now();
  return {
    id,
    type,
    // 本地 revision 仅作占位；服务端 LWW 会升迁
    revision: 1,
    updatedAt: ts,
    payload,
  };
}

function isSettingsStorageItem(entity: SyncEntity): boolean {
  if (entity.type !== STORAGE_ITEM_TYPE) return false;
  const body = asRecord(entity.payload);
  const key = stringField(body, 'key') || entity.id;
  return key === STORAGE_KEYS.SETTINGS;
}

function readAllChromeStorage(): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(null, (res) => resolve(res || {}));
    } catch {
      resolve({});
    }
  });
}

function removeChromeStorageKey(key: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove([key], () => resolve());
    } catch {
      resolve();
    }
  });
}

/**
 * 从本地库采集 account 级实体快照（全量）。
 */
export async function collectLocalSyncEntities(): Promise<SyncEntity[]> {
  const db = await initDB();
  const out: SyncEntity[] = [];

  try {
    const videos = (await db.getAll('viewedRecords')) as VideoRecord[];
    for (const v of videos) {
      if (!v?.id) continue;
      out.push(toEntity('video', String(v.id), v, Number(v.updatedAt) || Number(v.createdAt) || Date.now()));
    }
  } catch {
    // 忽略：本地库可能缺少该表
  }

  try {
    const actors = (await db.getAll('actors')) as ActorRecord[];
    for (const a of actors) {
      if (!a?.id) continue;
      out.push(toEntity('actor', String(a.id), a, Number(a.updatedAt) || Number(a.createdAt) || Date.now()));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const lists = (await db.getAll('lists')) as ListRecord[];
    for (const l of lists) {
      if (!l?.id) continue;
      out.push(toEntity('list', String(l.id), l, Number(l.updatedAt) || Number(l.createdAt) || Date.now()));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const works = (await db.getAll('newWorks')) as NewWorkRecord[];
    for (const w of works) {
      if (!w?.id) continue;
      const ts = Number((w as { updatedAt?: number }).updatedAt) || Number((w as { discoveredAt?: number }).discoveredAt) || Date.now();
      out.push(toEntity('new_work', String(w.id), w, ts));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const magnets = (await db.getAll('magnets')) as MagnetCacheRecord[];
    for (const m of magnets) {
      if (!m?.key) continue;
      out.push(toEntity('magnet', String(m.key), m, Number(m.createdAt) || Date.now()));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const views = (await db.getAll('insightsViews')) as ViewsDaily[];
    for (const v of views) {
      const id = stringField(asRecord(v), 'date');
      if (!id) continue;
      out.push(toEntity('insights_view', id, v, timestampFromPayload(v, ['updatedAt', 'createdAt'])));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const reports = (await db.getAll('insightsReports')) as ReportMonthly[];
    for (const r of reports) {
      const id = stringField(asRecord(r), 'month');
      if (!id) continue;
      out.push(toEntity('insights_report', id, r, timestampFromPayload(r, ['updatedAt', 'createdAt'])));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const stats = (await db.getAll('newWorksDailyStats')) as NewWorksDailyStat[];
    for (const s of stats) {
      if (!s?.date) continue;
      out.push(toEntity('new_work_daily_stat', String(s.date), s, timestampFromPayload(s, ['updatedAt', 'createdAt'])));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const subs = await getValue<Record<string, unknown>>(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {});
    for (const [id, payload] of Object.entries(subs || {})) {
      out.push(toEntity('new_work_subscription', id, payload, Date.now()));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const profile = await getValue<unknown>(STORAGE_KEYS.USER_PROFILE, null);
    if (profile) {
      out.push(toEntity('user_profile', 'default', profile, Date.now()));
    }
  } catch {
    // 忽略：本地资产缺失不阻断全量同步
  }

  try {
    const presets = await getValue<Record<string, unknown> | unknown[]>(STORAGE_KEYS.ADV_SEARCH_PRESETS, {});
    if (Array.isArray(presets)) {
      presets.forEach((p, i) => {
        const id = String((p as any)?.id || i);
        out.push(toEntity('search_preset', id, p, Date.now()));
      });
    } else if (presets && typeof presets === 'object') {
      for (const [id, payload] of Object.entries(presets)) {
        out.push(toEntity('search_preset', id, payload, Date.now()));
      }
    }
  } catch {
    // 忽略：搜索方案读取失败不阻断全量同步
  }

  try {
    const allStorage = await readAllChromeStorage();
    for (const [key, value] of Object.entries(allStorage)) {
      if (!shouldSyncStorageItemKey(key)) continue;
      out.push(
        toEntity(
          STORAGE_ITEM_TYPE,
          key,
          { key, value },
          timestampFromPayload(value, ['updatedAt', 'createdAt', 'savedAt']),
        ),
      );
    }
  } catch {
    // 忽略：Chrome Storage 读取失败不阻断全量同步
  }

  return out;
}

async function applyOne(entity: SyncEntity): Promise<void> {
  const payload = entity.payload;
  switch (entity.type) {
    case 'video': {
      const rec = { ...(asRecord(payload) as unknown as VideoRecord), id: entity.id };
      if (entity.deletedAt) {
        // 软删除：保留记录并补上远端墓碑时间
        (rec as any).deletedAt = entity.deletedAt;
      }
      await viewedBulkPut([rec]);
      return;
    }
    case 'actor': {
      const rec = { ...(asRecord(payload) as unknown as ActorRecord), id: entity.id };
      if (entity.deletedAt) (rec as any).deletedAt = entity.deletedAt;
      await actorsBulkPut([rec]);
      return;
    }
    case 'list': {
      const rec = { ...(asRecord(payload) as unknown as ListRecord), id: entity.id };
      await listsBulkPut([rec]);
      return;
    }
    case 'new_work': {
      const rec = { ...(asRecord(payload) as unknown as NewWorkRecord), id: entity.id };
      await newWorksBulkPut([rec]);
      return;
    }
    case 'magnet': {
      const db = await initDB();
      const rec = { ...(asRecord(payload) as unknown as MagnetCacheRecord), key: entity.id };
      await db.put('magnets', rec);
      return;
    }
    case 'insights_view': {
      const db = await initDB();
      const rec = { ...(asRecord(payload) as unknown as ViewsDaily), date: entity.id };
      await db.put('insightsViews', rec);
      return;
    }
    case 'insights_report': {
      const db = await initDB();
      const rec = { ...(asRecord(payload) as unknown as ReportMonthly), month: entity.id };
      await db.put('insightsReports', rec);
      return;
    }
    case 'new_work_daily_stat': {
      const db = await initDB();
      const rec = { ...(asRecord(payload) as unknown as NewWorksDailyStat), date: entity.id };
      await db.put('newWorksDailyStats', rec);
      return;
    }
    case 'new_work_subscription': {
      const subs = await getValue<Record<string, unknown>>(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {});
      if (entity.deletedAt) {
        delete subs[entity.id];
      } else {
        subs[entity.id] = payload;
      }
      await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, subs);
      return;
    }
    case 'user_profile': {
      if (!entity.deletedAt) {
        await setValue(STORAGE_KEYS.USER_PROFILE, payload);
      }
      return;
    }
    case 'search_preset': {
      const presets = await getValue<Record<string, unknown>>(STORAGE_KEYS.ADV_SEARCH_PRESETS, {});
      const asObj = Array.isArray(presets)
        ? Object.fromEntries(
            presets.map((p, i) => [String((p as any)?.id || i), p as unknown]),
          )
        : { ...(presets || {}) };
      if (entity.deletedAt) delete asObj[entity.id];
      else asObj[entity.id] = payload;
      await setValue(STORAGE_KEYS.ADV_SEARCH_PRESETS, asObj);
      return;
    }
    case 'preference': {
      const body = asRecord(payload);
      const key = String(body.key || entity.id);
      if (!key || entity.deletedAt) return;
      // 旧客户端兼容：新版本用 storage_item/settings 同步完整设置
      if (!['display', 'dataSync', 'actorLibrary'].includes(key)) return;
      const settings = await getSettings();
      const next = { ...settings, [key]: body.value } as any;
      markCloudStorageWrite(STORAGE_KEYS.SETTINGS, next);
      await setValue(STORAGE_KEYS.SETTINGS, next);
      return;
    }
    case STORAGE_ITEM_TYPE: {
      const body = asRecord(payload);
      const key = stringField(body, 'key') || entity.id;
      if (!shouldSyncStorageItemKey(key)) return;
      if (entity.deletedAt) {
        markCloudStorageWrite(key);
        await removeChromeStorageKey(key);
        return;
      }
      const value = ownValue(body, 'value');
      markCloudStorageWrite(key, value);
      await setValue(key, value);
      return;
    }
    default:
      return;
  }
}

/**
 * Dashboard / 扩展页可用的 LocalEntityStore（直接 IDB，不经 background 消息）。
 */
export function createExtensionEntityStore(): LocalEntityStore {
  return {
    async listAll() {
      return collectLocalSyncEntities();
    },
    async applyRemote(entities) {
      // 增量 upsert：只 put 本 batch 中的实体，从不 clear 未出现的本地 id（session apply 权威路径）
      const hasSettingsStorageItem = entities.some(isSettingsStorageItem);
      const videos: VideoRecord[] = [];
      const actors: ActorRecord[] = [];
      const lists: ListRecord[] = [];
      const works: NewWorkRecord[] = [];
      const others: SyncEntity[] = [];

      for (const e of entities) {
        if (e.type === 'video') {
          videos.push({ ...(asRecord(e.payload) as unknown as VideoRecord), id: e.id });
        } else if (e.type === 'actor') {
          actors.push({ ...(asRecord(e.payload) as unknown as ActorRecord), id: e.id });
        } else if (e.type === 'list') {
          lists.push({ ...(asRecord(e.payload) as unknown as ListRecord), id: e.id });
        } else if (e.type === 'new_work') {
          works.push({ ...(asRecord(e.payload) as unknown as NewWorkRecord), id: e.id });
        } else if (e.type === 'preference' && hasSettingsStorageItem) {
          continue;
        } else {
          others.push(e);
        }
      }

      if (videos.length) await viewedBulkPut(videos);
      if (actors.length) await actorsBulkPut(actors);
      if (lists.length) await listsBulkPut(lists);
      if (works.length) await newWorksBulkPut(works);
      for (const e of others) {
        await applyOne(e);
      }

      // 触达一下单条 get，帮助发现 IDB 未就绪（失败不阻断）
      try {
        if (videos[0]?.id) await viewedGet(videos[0].id);
        if (actors[0]?.id) await actorsGet(actors[0].id);
        if (lists[0]?.id) await listsGet(lists[0].id);
        if (works[0]?.id) await newWorksGet(works[0].id);
      } catch {
        // 忽略：探测失败不阻断远端应用
      }
    },
    async listPending() {
      return listCloudPending();
    },
    async clearPending(keys) {
      await clearCloudPending(keys);
    },
  };
}

export async function preparePushQueueStats(): Promise<{
  enqueuedNow: number;
  pendingCount: number;
  localEntityCount: number;
}> {
  const snapshot = await collectLocalSyncEntities();
  const enqueuedNow = await ensureInitialPending(snapshot);
  const pending = await listCloudPending();
  return {
    enqueuedNow,
    pendingCount: pending.length,
    localEntityCount: snapshot.length,
  };
}
