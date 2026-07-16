/**
 * @file types.ts
 * @description Sync protocol DTOs: entity envelope, auth, devices, pull/push, vault.
 * @module @javdb/sync-protocol
 */

import type { ClientProductId, ProtocolVersion } from './version';

// ---------------------------------------------------------------------------
// Entity envelope (all account-scoped business records)
// ---------------------------------------------------------------------------

/**
 * Common envelope for every syncable entity.
 * `revision` is server-monotonic per (user, type, id).
 */
export interface SyncEntity<T = unknown> {
  id: string;
  type: string;
  revision: number;
  updatedAt: number;
  deletedAt?: number | null;
  updatedByDeviceId?: string;
  payload: T;
}

/** @deprecated Prefer SyncEntity; kept for Day-1 skeleton imports. */
export type SyncEntityEnvelope<T = unknown> = SyncEntity<T>;

/** Opaque cursor map: entity type → last seen server revision. */
export type SyncCursorMap = Record<string, number>;

// ---------------------------------------------------------------------------
// Entity type ids (must stay aligned with assetMatrix ACCOUNT_ENTITY_TYPES)
// ---------------------------------------------------------------------------

export const SYNC_ENTITY_TYPES = [
  'video',
  'actor',
  'list',
  'new_work',
  'new_work_subscription',
  'user_profile',
  'preference',
  'search_preset',
] as const;

export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[number];

// ---------------------------------------------------------------------------
// Auth + device
// ---------------------------------------------------------------------------

export interface DeviceRegistration {
  id: string;
  label: string;
  platform?: string;
  clientType: ClientProductId;
  clientVersion?: string;
}

export interface AuthRegisterRequest {
  identifier: string;
  password: string;
}

export interface AuthLoginRequest {
  identifier: string;
  password: string;
  device: DeviceRegistration;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  userId: string;
  deviceId: string;
}

export interface AuthLoginResponse extends AuthTokenPair {
  protocolVersion: ProtocolVersion;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface DeviceInfo {
  id: string;
  label: string;
  platform?: string;
  clientType: ClientProductId;
  clientVersion?: string;
  createdAt?: number;
  lastSeenAt?: number;
  revokedAt?: number | null;
}

// ---------------------------------------------------------------------------
// Sync pull / push
// ---------------------------------------------------------------------------

export interface SyncPullRequest {
  protocolVersion: ProtocolVersion;
  cursors: SyncCursorMap;
  /** Optional limit per type; server may clamp. */
  limit?: number;
}

export interface SyncPullResponse {
  protocolVersion: ProtocolVersion;
  changes: SyncEntity[];
  cursors: SyncCursorMap;
  hasMore?: boolean;
}

export interface SyncPushRequest {
  protocolVersion: ProtocolVersion;
  changes: SyncEntity[];
}

export type SyncPushItemResult =
  | { id: string; type: string; status: 'accepted'; revision: number }
  | { id: string; type: string; status: 'rejected'; reason: string; server?: SyncEntity }
  | { id: string; type: string; status: 'merged'; entity: SyncEntity };

export interface SyncPushResponse {
  protocolVersion: ProtocolVersion;
  results: SyncPushItemResult[];
  cursors?: SyncCursorMap;
}

// ---------------------------------------------------------------------------
// Vault (account secrets; whole-item LWW)
// ---------------------------------------------------------------------------

export type VaultItemKind = 'webdav' | 'drive115' | string;

export interface VaultItem {
  id: string;
  kind: VaultItemKind;
  label?: string;
  ciphertext: string;
  revision: number;
  updatedAt: number;
  deletedAt?: number | null;
  updatedByDeviceId?: string;
}

export interface VaultPutRequest {
  protocolVersion: ProtocolVersion;
  item: VaultItem;
}

export interface VaultListResponse {
  protocolVersion: ProtocolVersion;
  items: VaultItem[];
}
