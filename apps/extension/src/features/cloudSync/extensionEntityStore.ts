/**
 * @file extensionEntityStore.ts
 * @description 将本地 IDB / chrome.storage 用户资产映射为 SyncEntity，并写回
 * @module features/cloudSync
 */
import type { LocalEntityStore } from '@javdb/sync-client';
import type { SyncEntity } from '@javdb/sync-protocol';
import type { ActorRecord, ListRecord, NewWorkRecord, VideoRecord } from '../../types';
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
} from '../../platform/storage/indexedDb';
import {
  clearCloudPending,
  ensureInitialPending,
  listCloudPending,
} from './chromePendingStore';

function asRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
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
    // ignore store missing
  }

  try {
    const actors = (await db.getAll('actors')) as ActorRecord[];
    for (const a of actors) {
      if (!a?.id) continue;
      out.push(toEntity('actor', String(a.id), a, Number(a.updatedAt) || Number(a.createdAt) || Date.now()));
    }
  } catch {
    // ignore
  }

  try {
    const lists = (await db.getAll('lists')) as ListRecord[];
    for (const l of lists) {
      if (!l?.id) continue;
      out.push(toEntity('list', String(l.id), l, Number(l.updatedAt) || Number(l.createdAt) || Date.now()));
    }
  } catch {
    // ignore
  }

  try {
    const works = (await db.getAll('newWorks')) as NewWorkRecord[];
    for (const w of works) {
      if (!w?.id) continue;
      const ts = Number((w as any).updatedAt) || Number((w as any).discoveredAt) || Date.now();
      out.push(toEntity('new_work', String(w.id), w, ts));
    }
  } catch {
    // ignore
  }

  try {
    const subs = await getValue<Record<string, unknown>>(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {});
    for (const [id, payload] of Object.entries(subs || {})) {
      out.push(toEntity('new_work_subscription', id, payload, Date.now()));
    }
  } catch {
    // ignore
  }

  try {
    const profile = await getValue<unknown>(STORAGE_KEYS.USER_PROFILE, null);
    if (profile) {
      out.push(toEntity('user_profile', 'default', profile, Date.now()));
    }
  } catch {
    // ignore
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
    // ignore
  }

  // preference：仅同步安全白名单顶层键（禁止 secrets / 设备态）
  try {
    const settings = await getSettings();
    const whitelist = ['display', 'dataSync', 'actorLibrary'] as const;
    for (const key of whitelist) {
      const value = (settings as any)?.[key];
      if (value === undefined) continue;
      out.push(
        toEntity('preference', key, { key, value }, Date.now()),
      );
    }
  } catch {
    // ignore
  }

  return out;
}

async function applyOne(entity: SyncEntity): Promise<void> {
  const payload = entity.payload;
  switch (entity.type) {
    case 'video': {
      const rec = { ...(asRecord(payload) as unknown as VideoRecord), id: entity.id };
      if (entity.deletedAt) {
        // soft-delete: keep record with deletedAt if present on payload; else patch
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
      // 只写白名单
      if (!['display', 'dataSync', 'actorLibrary'].includes(key)) return;
      const settings = await getSettings();
      const next = { ...settings, [key]: body.value } as any;
      await setValue(STORAGE_KEYS.SETTINGS, next);
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
        // ignore
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
