/**
 * @file index.ts
 * @description Sync client public surface. Full engine/adapters land progressively in 07-16-sync-client-engine.
 * @module @javdb/sync-client
 */

import {
  PROTOCOL_VERSION,
  type ProtocolVersion,
  type SyncCursorMap,
  type SyncEntity,
} from '@javdb/sync-protocol';

export { PROTOCOL_VERSION };
export type { ProtocolVersion, SyncCursorMap, SyncEntity };

export {
  entityKey,
  mergeEntityBatches,
  mergeVaultBatches,
  advanceCursors,
} from './conflictPolicy';

/**
 * Minimal facade so apps can depend on the package before the full engine exists.
 */
export function createSyncClientStub(opts?: { protocolVersion?: ProtocolVersion }) {
  const protocolVersion = opts?.protocolVersion ?? PROTOCOL_VERSION;
  return {
    protocolVersion,
    async pull(_cursors: SyncCursorMap = {}): Promise<{ changes: SyncEntity[]; cursors: SyncCursorMap }> {
      return { changes: [], cursors: { ..._cursors } };
    },
  };
}

export type SyncClientStub = ReturnType<typeof createSyncClientStub>;
