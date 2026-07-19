/**
 * @file toSyncEntity.ts
 * @description 本地记录 → SyncEntity 纯映射（无 IO）
 * @module features/cloudSync
 */
import type { SyncEntity } from '@javdb/sync-protocol';
import type { ActorRecord, ListRecord, NewWorkRecord, VideoRecord } from '../../types';
import type { ReportMonthly, ViewsDaily } from '../../types/insights';
import type { MagnetCacheRecord, NewWorksDailyStat } from '../../platform/storage/indexedDb';

export function toSyncEntity(
  type: string,
  id: string,
  payload: unknown,
  updatedAt?: number,
): SyncEntity {
  const ts =
    typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : Date.now();
  return {
    id,
    type,
    revision: 1,
    updatedAt: ts,
    payload,
  };
}

export function videoToSyncEntity(v: VideoRecord): SyncEntity | null {
  if (!v?.id) return null;
  return toSyncEntity(
    'video',
    String(v.id),
    v,
    Number(v.updatedAt) || Number(v.createdAt) || Date.now(),
  );
}

export function actorToSyncEntity(a: ActorRecord): SyncEntity | null {
  if (!a?.id) return null;
  return toSyncEntity(
    'actor',
    String(a.id),
    a,
    Number(a.updatedAt) || Number(a.createdAt) || Date.now(),
  );
}

export function listToSyncEntity(l: ListRecord): SyncEntity | null {
  if (!l?.id) return null;
  return toSyncEntity(
    'list',
    String(l.id),
    l,
    Number(l.updatedAt) || Number(l.createdAt) || Date.now(),
  );
}

export function newWorkToSyncEntity(w: NewWorkRecord): SyncEntity | null {
  if (!w?.id) return null;
  const ts =
    Number((w as { updatedAt?: number }).updatedAt) ||
    Number((w as { discoveredAt?: number }).discoveredAt) ||
    Date.now();
  return toSyncEntity('new_work', String(w.id), w, ts);
}

export function preferenceToSyncEntity(key: string, value: unknown): SyncEntity {
  return toSyncEntity('preference', key, { key, value }, Date.now());
}

export function magnetToSyncEntity(record: MagnetCacheRecord): SyncEntity | null {
  if (!record?.key) return null;
  return toSyncEntity('magnet', String(record.key), record, Number(record.createdAt) || Date.now());
}

export function insightsViewToSyncEntity(view: ViewsDaily): SyncEntity | null {
  const id = typeof (view as { date?: unknown }).date === 'string' ? (view as { date: string }).date : '';
  if (!id) return null;
  const ts = Number((view as { updatedAt?: number }).updatedAt) || Number((view as { createdAt?: number }).createdAt) || Date.now();
  return toSyncEntity('insights_view', id, view, ts);
}

export function insightsReportToSyncEntity(report: ReportMonthly): SyncEntity | null {
  const id =
    typeof (report as { month?: unknown }).month === 'string'
      ? (report as { month: string }).month
      : '';
  if (!id) return null;
  const ts = Number((report as { updatedAt?: number }).updatedAt) || Number((report as { createdAt?: number }).createdAt) || Date.now();
  return toSyncEntity('insights_report', id, report, ts);
}

export function newWorkDailyStatToSyncEntity(stat: NewWorksDailyStat): SyncEntity | null {
  if (!stat?.date) return null;
  const ts = Number((stat as { updatedAt?: number }).updatedAt) || Number((stat as { createdAt?: number }).createdAt) || Date.now();
  return toSyncEntity('new_work_daily_stat', String(stat.date), stat, ts);
}

export function storageItemToSyncEntity(key: string, value: unknown, updatedAt?: number): SyncEntity | null {
  if (!key) return null;
  return toSyncEntity('storage_item', key, { key, value }, updatedAt);
}

/** 跨端偏好白名单（与 extensionEntityStore 采集一致） */
export const CLOUD_PREFERENCE_KEYS = ['display', 'dataSync', 'actorLibrary'] as const;
