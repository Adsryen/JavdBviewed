/**
 * @file chromePendingStore.ts
 * @description 待推送变更队列（本机 local-only）
 * @module features/cloudSync
 */
import type { SyncEntity } from '@javdb/sync-protocol';

export const CLOUD_PENDING_STORAGE_KEY = 'cloud_sync_pending_v1';

function entityKey(type: string, id: string): string {
  return `${type}\0${id}`;
}

async function readPending(): Promise<SyncEntity[]> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([CLOUD_PENDING_STORAGE_KEY], (res) => {
        const v = res?.[CLOUD_PENDING_STORAGE_KEY];
        resolve(Array.isArray(v) ? (v as SyncEntity[]) : []);
      });
    } catch {
      resolve([]);
    }
  });
}

async function writePending(list: SyncEntity[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [CLOUD_PENDING_STORAGE_KEY]: list }, () => resolve());
    } catch {
      resolve();
    }
  });
}

export async function listCloudPending(): Promise<SyncEntity[]> {
  return readPending();
}

/** 按 type+id 覆盖写入 pending（后者覆盖前者） */
export async function upsertCloudPending(entities: SyncEntity[]): Promise<void> {
  if (!entities.length) return;
  const cur = await readPending();
  const map = new Map(cur.map((e) => [entityKey(e.type, e.id), e]));
  for (const e of entities) {
    map.set(entityKey(e.type, e.id), e);
  }
  await writePending([...map.values()]);
}

export async function clearCloudPending(
  keys: Array<{ type: string; id: string }>,
): Promise<void> {
  if (!keys.length) return;
  const drop = new Set(keys.map((k) => entityKey(k.type, k.id)));
  const cur = await readPending();
  await writePending(cur.filter((e) => !drop.has(entityKey(e.type, e.id))));
}

/**
 * 首次同步：若 pending 为空，把当前本地全量实体入队，便于首推到空 Cloud。
 */
export async function ensureInitialPending(snapshot: SyncEntity[]): Promise<number> {
  const cur = await readPending();
  if (cur.length > 0) return 0;
  if (!snapshot.length) return 0;
  await writePending(snapshot);
  return snapshot.length;
}
