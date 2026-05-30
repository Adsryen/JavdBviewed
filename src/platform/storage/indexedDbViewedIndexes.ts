import type { IDBPDatabase } from 'idb';
import type { VideoRecord } from '../../types';
import { MAX_INDEX_NUMBER, type JavdbDB, type ViewedListIndexRecord, type ViewedTagIndexRecord } from './indexedDbSchema';

export function normalizeViewedRecord(record: VideoRecord): VideoRecord & { favoriteIndexed?: number } {
  return {
    ...record,
    favoriteIndexed: record.isFavorite === true ? 1 : 0,
  };
}

export function buildViewedTimeCursorSource(
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

function normalizeTagKey(tag: string): string {
  return String(tag || '').trim().toLowerCase();
}

function normalizeListIdKey(listId: string): string {
  return String(listId || '').trim();
}

export function extractRecordTagKeys(record?: VideoRecord | null): string[] {
  const raw = Array.isArray(record?.tags) ? record!.tags! : [];
  const keys = raw.map(normalizeTagKey).filter(Boolean);
  return Array.from(new Set(keys));
}

export function extractRecordListKeys(record?: VideoRecord | null): string[] {
  const raw = Array.isArray(record?.listIds) ? record!.listIds! : [];
  const keys = raw.map(normalizeListIdKey).filter(Boolean);
  return Array.from(new Set(keys));
}

export function makeViewedTagIndexRecord(tag: string, videoId: string): ViewedTagIndexRecord {
  return {
    key: `${tag}::${videoId}`,
    tag,
    videoId,
  };
}

export function makeViewedListIndexRecord(listId: string, videoId: string): ViewedListIndexRecord {
  return {
    key: `${listId}::${videoId}`,
    listId,
    videoId,
  };
}

export async function syncViewedSecondaryIndexes(
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

export async function clearViewedSecondaryIndexesByVideoId(tagStore: any, listStore: any, videoId: string): Promise<void> {
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

export async function getVideoIdsForListFilter(store: any, listIds: string[]): Promise<Set<string> | null> {
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

export async function getVideoIdsForTagFilter(store: any, tags: string[]): Promise<Set<string> | null> {
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

export function intersectVideoIdSets(a: Set<string> | null, b: Set<string> | null): Set<string> | null {
  if (a == null) return b;
  if (b == null) return a;
  const result = new Set<string>();
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const videoId of small) {
    if (large.has(videoId)) result.add(videoId);
  }
  return result;
}

export async function rebuildViewedSecondaryIndexes(db: IDBPDatabase<JavdbDB>): Promise<void> {
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

export async function ensureViewedSecondaryIndexesReady(db: IDBPDatabase<JavdbDB>, needTags: boolean, needListIds: boolean): Promise<boolean> {
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
