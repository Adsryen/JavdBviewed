/**
 * @file conflictPolicy.ts
 * @description Apply protocol conflict rules to local vs remote entity batches (pure).
 * @module @javdb/sync-client
 */

import {
  mergeSyncEntity,
  mergeVaultItem,
  type SyncEntity,
  type VaultItem,
} from '@javdb/sync-protocol';

export function entityKey(type: string, id: string): string {
  return `${type}\0${id}`;
}

/**
 * Merge two entity lists by (type, id) using record LWW.
 * Remote-only and local-only rows are kept.
 */
export function mergeEntityBatches(
  local: readonly SyncEntity[],
  remote: readonly SyncEntity[],
): SyncEntity[] {
  const map = new Map<string, SyncEntity>();
  for (const e of local) {
    map.set(entityKey(e.type, e.id), e);
  }
  for (const e of remote) {
    const key = entityKey(e.type, e.id);
    const prev = map.get(key);
    map.set(key, prev ? mergeSyncEntity(prev, e) : e);
  }
  return [...map.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.id.localeCompare(b.id);
  });
}

/** Merge vault item lists by id (whole-item LWW). */
export function mergeVaultBatches(
  local: readonly VaultItem[],
  remote: readonly VaultItem[],
): VaultItem[] {
  const map = new Map<string, VaultItem>();
  for (const e of local) map.set(e.id, e);
  for (const e of remote) {
    const prev = map.get(e.id);
    map.set(e.id, prev ? mergeVaultItem(prev, e) : e);
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Advance cursors: for each type, take max of previous cursor and max revision in changes.
 */
export function advanceCursors(
  prev: Record<string, number>,
  changes: readonly SyncEntity[],
): Record<string, number> {
  const next = { ...prev };
  for (const e of changes) {
    const cur = next[e.type] ?? 0;
    if (e.revision > cur) next[e.type] = e.revision;
  }
  return next;
}
