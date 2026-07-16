/**
 * @file index.ts
 * @description Sync client public surface (Day-1 skeleton).
 * Engine implementation lands in 07-16-sync-client-engine.
 * @module @javdb/sync-client
 */

import { PROTOCOL_VERSION, type ProtocolVersion } from '@javdb/sync-protocol';

export { PROTOCOL_VERSION };
export type { ProtocolVersion };

/** Opaque cursor map: entity type → last seen server revision. */
export type SyncCursorMap = Record<string, number>;

/**
 * Minimal facade so apps can depend on the package before the engine exists.
 * Real pull/push/adapters are filled by the client-engine subtask.
 */
export function createSyncClientStub(opts?: { protocolVersion?: ProtocolVersion }) {
  const protocolVersion = opts?.protocolVersion ?? PROTOCOL_VERSION;
  return {
    protocolVersion,
    /** Day-1 stub: always empty changes. */
    async pull(_cursors: SyncCursorMap = {}): Promise<{ changes: unknown[]; cursors: SyncCursorMap }> {
      return { changes: [], cursors: { ..._cursors } };
    },
  };
}

export type SyncClientStub = ReturnType<typeof createSyncClientStub>;
