/**
 * @file enqueueLocalChange.ts
 * @description 本地写入后入 pending 队列（自动同步前置）
 * @module features/cloudSync
 */
import type { SyncEntity } from '@javdb/sync-protocol';
import type { ActorRecord, ListRecord, NewWorkRecord, VideoRecord } from '../../types';
import { upsertCloudPending } from './chromePendingStore';
import {
  actorToSyncEntity,
  listToSyncEntity,
  newWorkToSyncEntity,
  preferenceToSyncEntity,
  toSyncEntity,
  videoToSyncEntity,
  CLOUD_PREFERENCE_KEYS,
} from './toSyncEntity';

export async function enqueueSyncEntities(entities: SyncEntity[]): Promise<void> {
  const list = entities.filter(Boolean);
  if (!list.length) return;
  await upsertCloudPending(list);
}

export async function enqueueVideoChange(record: VideoRecord): Promise<void> {
  const e = videoToSyncEntity(record);
  if (e) await upsertCloudPending([e]);
}

export async function enqueueVideoChanges(records: VideoRecord[]): Promise<void> {
  const list = records.map(videoToSyncEntity).filter(Boolean) as SyncEntity[];
  if (list.length) await upsertCloudPending(list);
}

export async function enqueueActorChange(record: ActorRecord): Promise<void> {
  const e = actorToSyncEntity(record);
  if (e) await upsertCloudPending([e]);
}

export async function enqueueActorChanges(records: ActorRecord[]): Promise<void> {
  const list = records.map(actorToSyncEntity).filter(Boolean) as SyncEntity[];
  if (list.length) await upsertCloudPending(list);
}

export async function enqueueListChange(record: ListRecord): Promise<void> {
  const e = listToSyncEntity(record);
  if (e) await upsertCloudPending([e]);
}

export async function enqueueListChanges(records: ListRecord[]): Promise<void> {
  const list = records.map(listToSyncEntity).filter(Boolean) as SyncEntity[];
  if (list.length) await upsertCloudPending(list);
}

export async function enqueueNewWorkChange(record: NewWorkRecord): Promise<void> {
  const e = newWorkToSyncEntity(record);
  if (e) await upsertCloudPending([e]);
}

export async function enqueueNewWorkChanges(records: NewWorkRecord[]): Promise<void> {
  const list = records.map(newWorkToSyncEntity).filter(Boolean) as SyncEntity[];
  if (list.length) await upsertCloudPending(list);
}

export async function enqueueSubscriptionChange(id: string, payload: unknown): Promise<void> {
  if (!id) return;
  await upsertCloudPending([
    toSyncEntity('new_work_subscription', id, payload, Date.now()),
  ]);
}

export async function enqueueUserProfileChange(profile: unknown): Promise<void> {
  if (profile == null) return;
  await upsertCloudPending([toSyncEntity('user_profile', 'default', profile, Date.now())]);
}

export async function enqueueSearchPresetChange(id: string, payload: unknown): Promise<void> {
  if (!id) return;
  await upsertCloudPending([toSyncEntity('search_preset', id, payload, Date.now())]);
}

export async function enqueuePreferenceChange(key: string, value: unknown): Promise<void> {
  if (!(CLOUD_PREFERENCE_KEYS as readonly string[]).includes(key)) return;
  await upsertCloudPending([preferenceToSyncEntity(key, value)]);
}

/** fire-and-forget：不阻塞主写入路径 */
export function scheduleEnqueue(task: () => Promise<void>): void {
  try {
    void task().catch(() => {});
  } catch {
    // ignore
  }
}
