/**
 * @file index.ts
 * @description Sync protocol public surface (Day-1 skeleton).
 * Full asset matrix / OpenAPI land in 07-16-sync-protocol-contract.
 * @module @javdb/sync-protocol
 */

/** Wire protocol version; bump only on breaking contract changes. */
export const PROTOCOL_VERSION = 1 as const;

export type ProtocolVersion = typeof PROTOCOL_VERSION;

/** High-level product ids used by release tags and clients. */
export type ClientProductId = 'extension' | 'desktop' | 'mobile' | 'tv';

/**
 * Minimal entity envelope shared by clients and Cloud.
 * Full fields are frozen by the protocol contract subtask.
 */
export interface SyncEntityEnvelope<T = unknown> {
  id: string;
  type: string;
  revision: number;
  updatedAt: number;
  deletedAt?: number | null;
  updatedByDeviceId?: string;
  payload: T;
}
