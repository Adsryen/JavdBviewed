/**
 * @file syncEngine.ts
 * @description Pull/push loop over CloudApi + local entity buffer (no chrome).
 * @module @javdb/sync-client
 */

import {
  PROTOCOL_VERSION,
  type ProtocolVersion,
  type SyncCursorMap,
  type SyncEntity,
} from '@javdb/sync-protocol';
import type { ApiClient } from './apiClient';
import { advanceCursors, mergeEntityBatches } from './conflictPolicy';

export interface LocalEntityStore {
  listAll(): Promise<SyncEntity[]>;
  applyRemote(entities: SyncEntity[]): Promise<void>;
  /** Pending local changes not yet acknowledged by server. */
  listPending(): Promise<SyncEntity[]>;
  /** Drop pending entries that server accepted/merged (by type+id). */
  clearPending(keys: Array<{ type: string; id: string }>): Promise<void>;
}

export interface CursorStore {
  get(): Promise<SyncCursorMap>;
  set(cursors: SyncCursorMap): Promise<void>;
}

export interface SyncEngine {
  readonly protocolVersion: ProtocolVersion;
  syncNow(): Promise<{ pulled: number; pushed: number; cursors: SyncCursorMap }>;
}

export function createSyncEngine(opts: {
  api: ApiClient;
  local: LocalEntityStore;
  cursors: CursorStore;
  protocolVersion?: ProtocolVersion;
}): SyncEngine {
  const protocolVersion = opts.protocolVersion ?? PROTOCOL_VERSION;

  return {
    protocolVersion,

    async syncNow() {
      let cursors = await opts.cursors.get();
      let pulled = 0;
      let hasMore = true;

      while (hasMore) {
        const pullRes = await opts.api.pull({ protocolVersion, cursors });
        pulled += pullRes.changes.length;
        if (pullRes.changes.length) {
          const localAll = await opts.local.listAll();
          const merged = mergeEntityBatches(localAll, pullRes.changes);
          await opts.local.applyRemote(merged);
        }
        cursors = advanceCursors(pullRes.cursors ?? cursors, pullRes.changes);
        await opts.cursors.set(cursors);
        hasMore = Boolean(pullRes.hasMore);
        if (!pullRes.changes.length) break;
      }

      const pending = await opts.local.listPending();
      let pushed = 0;
      if (pending.length) {
        const pushRes = await opts.api.push({ protocolVersion, changes: pending });
        const done: Array<{ type: string; id: string }> = [];
        for (const r of pushRes.results) {
          if (r.status === 'accepted' || r.status === 'merged') {
            done.push({ type: r.type, id: r.id });
            pushed += 1;
          }
        }
        if (done.length) await opts.local.clearPending(done);
        if (pushRes.cursors) {
          cursors = { ...cursors, ...pushRes.cursors };
          await opts.cursors.set(cursors);
        }
      }

      return { pulled, pushed, cursors };
    },
  };
}

/** In-memory local store for unit tests. */
export function createMemoryLocalStore(seed: SyncEntity[] = []): LocalEntityStore {
  let entities = [...seed];
  let pending: SyncEntity[] = [];
  return {
    async listAll() {
      return [...entities];
    },
    async applyRemote(next) {
      entities = [...next];
    },
    async listPending() {
      return [...pending];
    },
    async clearPending(keys) {
      const drop = new Set(keys.map((k) => `${k.type}\0${k.id}`));
      pending = pending.filter((e) => !drop.has(`${e.type}\0${e.id}`));
    },
    // test helper not on interface — attach via cast in tests
    ...({
      async enqueuePending(e: SyncEntity) {
        pending.push(e);
      },
    } as object),
  };
}

export function createMemoryCursorStore(initial: SyncCursorMap = {}): CursorStore {
  let cursors = { ...initial };
  return {
    async get() {
      return { ...cursors };
    },
    async set(next) {
      cursors = { ...next };
    },
  };
}
