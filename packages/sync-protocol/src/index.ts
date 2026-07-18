/**
 * @file index.ts
 * @description @javdb/sync-protocol public surface — version, types, asset matrix, conflict.
 * HTTP route sketch: ./openapi.sketch.txt (repo ignores *.md at root ignore rules).
 * @module @javdb/sync-protocol
 */

export { PROTOCOL_VERSION, type ProtocolVersion, type ClientProductId } from './version';

export {
  SYNC_ENTITY_TYPES,
  type SyncEntity,
  type SyncEntityEnvelope,
  type SyncEntityType,
  type SyncCursorMap,
  type DeviceRegistration,
  type AuthRegisterRequest,
  type AuthLoginRequest,
  type AuthTokenPair,
  type AuthLoginResponse,
  type AuthRefreshRequest,
  type DeviceInfo,
  type SyncPullRequest,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushItemResult,
  type SyncPushResponse,
  type SyncSessionRequest,
  type SyncSessionItemResult,
  type SyncSessionStats,
  type SyncSessionCode,
  type SyncSessionResponse,
  type VaultItemKind,
  type VaultItem,
  type VaultPutRequest,
  type VaultListResponse,
} from './types';

export {
  ASSET_MATRIX,
  ACCOUNT_ENTITY_TYPES,
  assetsByClass,
  accountEntityTypesFromMatrix,
  assertAccountEntityTypesComplete,
  classifySettingsPath,
  assertNoSecretMarkedSyncable,
  type CloudAssetClass,
  type ConflictStrategy,
  type AssetMatrixRow,
  type SettingsPathClass,
} from './assetMatrix';

export {
  compareRevisioned,
  mergeRecord,
  mergeRecordPreferSoftDelete,
  mergeSetWithTombstones,
  mergePreferenceMap,
  mergeVaultItem,
  mergeSyncEntity,
  type Revisioned,
  type Tombstone,
  type SetMergeInput,
  type PreferenceEntry,
} from './conflict';
