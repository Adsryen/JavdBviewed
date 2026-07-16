/**
 * @file version.ts
 * @description Wire protocol version constants for clients and Cloud.
 * @module @javdb/sync-protocol
 */

/** Wire protocol version; bump only on breaking contract changes. */
export const PROTOCOL_VERSION = 1 as const;

export type ProtocolVersion = typeof PROTOCOL_VERSION;

/** High-level product ids used by release tags and clients. */
export type ClientProductId = 'extension' | 'desktop' | 'mobile' | 'tv';
