/**
 * @file conflict.ts
 * @description Pure conflict helpers: record LWW, soft-delete, set tombstones, preference map, vault item.
 * @module @javdb/sync-protocol
 */

import type { SyncEntity, VaultItem } from './types';

export interface Revisioned {
  revision: number;
  updatedAt: number;
  deletedAt?: number | null;
}

/**
 * Compare two revisioned records.
 * Higher revision wins; tie-break updatedAt; soft-delete: later deletedAt wins when both deleted.
 */
export function compareRevisioned(a: Revisioned, b: Revisioned): number {
  if (a.revision !== b.revision) return a.revision - b.revision;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt;
  const aDel = a.deletedAt ?? 0;
  const bDel = b.deletedAt ?? 0;
  return aDel - bDel;
}

/** Record-level LWW: returns the winner (same reference when equal). */
export function mergeRecord<T extends Revisioned>(a: T, b: T): T {
  return compareRevisioned(a, b) >= 0 ? a : b;
}

/** Soft-delete preference: if either side has a newer deletedAt, prefer that side via mergeRecord. */
export function mergeRecordPreferSoftDelete<T extends Revisioned>(a: T, b: T): T {
  return mergeRecord(a, b);
}

export interface Tombstone {
  memberId: string;
  deletedAt: number;
}

export interface SetMergeInput {
  members: Iterable<string>;
  tombstones?: Iterable<Tombstone>;
}

/**
 * Merge two sets with tombstones so a delete on one side is not resurrected by union.
 * A member is present only if it appears in members and has no tombstone newer than its add (tombstone alone removes).
 */
export function mergeSetWithTombstones(
  local: SetMergeInput,
  remote: SetMergeInput,
): { members: string[]; tombstones: Tombstone[] } {
  const tombstoneMap = new Map<string, number>();

  const absorbTombstones = (items?: Iterable<Tombstone>) => {
    if (!items) return;
    for (const t of items) {
      const prev = tombstoneMap.get(t.memberId) ?? 0;
      if (t.deletedAt >= prev) tombstoneMap.set(t.memberId, t.deletedAt);
    }
  };

  absorbTombstones(local.tombstones);
  absorbTombstones(remote.tombstones);

  const memberSeen = new Set<string>();
  for (const id of local.members) memberSeen.add(id);
  for (const id of remote.members) memberSeen.add(id);

  const members: string[] = [];
  for (const id of memberSeen) {
    if (!tombstoneMap.has(id)) {
      members.push(id);
    }
  }
  members.sort();

  const tombstones = [...tombstoneMap.entries()]
    .map(([memberId, deletedAt]) => ({ memberId, deletedAt }))
    .sort((x, y) => x.memberId.localeCompare(y.memberId));

  return { members, tombstones };
}

export interface PreferenceEntry {
  key: string;
  value: unknown;
  updatedAt: number;
  revision?: number;
}

/**
 * Per-key LWW for preference maps.
 */
export function mergePreferenceMap(
  local: ReadonlyArray<PreferenceEntry>,
  remote: ReadonlyArray<PreferenceEntry>,
): PreferenceEntry[] {
  const map = new Map<string, PreferenceEntry>();
  const consider = (entry: PreferenceEntry) => {
    const prev = map.get(entry.key);
    if (!prev) {
      map.set(entry.key, entry);
      return;
    }
    const a = { revision: entry.revision ?? 0, updatedAt: entry.updatedAt };
    const b = { revision: prev.revision ?? 0, updatedAt: prev.updatedAt };
    map.set(entry.key, compareRevisioned(a, b) >= 0 ? entry : prev);
  };
  for (const e of local) consider(e);
  for (const e of remote) consider(e);
  return [...map.values()].sort((x, y) => x.key.localeCompare(y.key));
}

/** Whole-item LWW for vault secrets. */
export function mergeVaultItem(a: VaultItem, b: VaultItem): VaultItem {
  return mergeRecord(a, b);
}

/** Merge two SyncEntity envelopes (record LWW on envelope metadata; winner payload kept). */
export function mergeSyncEntity<T>(a: SyncEntity<T>, b: SyncEntity<T>): SyncEntity<T> {
  if (a.id !== b.id || a.type !== b.type) {
    throw new Error('mergeSyncEntity requires same id and type');
  }
  return mergeRecord(a, b);
}
