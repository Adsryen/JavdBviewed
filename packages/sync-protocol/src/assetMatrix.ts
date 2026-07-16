/**
 * @file assetMatrix.ts
 * @description Full sync asset matrix: account / vault / rebuildable / local.
 * Source of truth for what may enter Cloud vs stay on-device.
 * @module @javdb/sync-protocol
 */

import { SYNC_ENTITY_TYPES, type SyncEntityType } from './types';

export type CloudAssetClass = 'account' | 'vault' | 'rebuildable' | 'local';

export type ConflictStrategy =
  | 'LWW-record'
  | 'LWW-key'
  | 'LWW-item'
  | 'set-tombstone'
  | 'n/a';

export interface AssetMatrixRow {
  asset: string;
  storage: string;
  cloudClass: CloudAssetClass;
  entityType: SyncEntityType | '-';
  vaultKind?: string;
  conflict: ConflictStrategy;
  webdavAlign: boolean | 'partial';
  notes?: string;
}

/** Account-scoped entities that must be covered by pull/push. */
export const ACCOUNT_ENTITY_TYPES: readonly SyncEntityType[] = SYNC_ENTITY_TYPES;

export const ASSET_MATRIX: readonly AssetMatrixRow[] = [
  // ----- account -----
  {
    asset: 'videos',
    storage: 'IDB viewedRecords; legacy key viewed',
    cloudClass: 'account',
    entityType: 'video',
    conflict: 'LWW-record',
    webdavAlign: true,
    notes: 'soft-delete via deletedAt; set fields use set-tombstone in merge helpers',
  },
  {
    asset: 'actors',
    storage: 'IDB actors; legacy actor_records',
    cloudClass: 'account',
    entityType: 'actor',
    conflict: 'LWW-record',
    webdavAlign: true,
  },
  {
    asset: 'lists',
    storage: 'IDB lists',
    cloudClass: 'account',
    entityType: 'list',
    conflict: 'LWW-record',
    webdavAlign: true,
  },
  {
    asset: 'new_works_records',
    storage: 'IDB newWorks; key new_works_records',
    cloudClass: 'account',
    entityType: 'new_work',
    conflict: 'LWW-record',
    webdavAlign: true,
  },
  {
    asset: 'new_works_subscriptions',
    storage: 'new_works_subscriptions',
    cloudClass: 'account',
    entityType: 'new_work_subscription',
    conflict: 'LWW-record',
    webdavAlign: true,
  },
  {
    asset: 'user_profile',
    storage: 'user_profile',
    cloudClass: 'account',
    entityType: 'user_profile',
    conflict: 'LWW-record',
    webdavAlign: true,
  },
  {
    asset: 'preferences',
    storage: 'settings whitelist paths',
    cloudClass: 'account',
    entityType: 'preference',
    conflict: 'LWW-key',
    webdavAlign: 'partial',
    notes: 'never whole-blob settings; secrets go to vault',
  },
  {
    asset: 'search_presets',
    storage: 'adv_search_presets',
    cloudClass: 'account',
    entityType: 'search_preset',
    conflict: 'LWW-record',
    webdavAlign: true,
  },
  // ----- vault -----
  {
    asset: 'webdav_credentials',
    storage: 'settings webdav configs',
    cloudClass: 'vault',
    entityType: '-',
    vaultKind: 'webdav',
    conflict: 'LWW-item',
    webdavAlign: true,
  },
  {
    asset: 'drive115_credentials',
    storage: 'settings drive115',
    cloudClass: 'vault',
    entityType: '-',
    vaultKind: 'drive115',
    conflict: 'LWW-item',
    webdavAlign: true,
  },
  {
    asset: 'ai_api_keys',
    storage: 'settings AI keys if any',
    cloudClass: 'vault',
    entityType: '-',
    vaultKind: 'ai',
    conflict: 'LWW-item',
    webdavAlign: false,
    notes: 'confirm field paths at integration; treat API keys as vault',
  },
  // ----- rebuildable -----
  {
    asset: 'viewedByTag',
    storage: 'IDB viewedByTag',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
    notes: 'rebuild from videos.tags',
  },
  {
    asset: 'viewedByList',
    storage: 'IDB viewedByList',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
    notes: 'rebuild from videos.listIds + lists',
  },
  {
    asset: 'magnets',
    storage: 'IDB magnets',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'insightsViews',
    storage: 'IDB insightsViews',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'insightsReports',
    storage: 'IDB insightsReports',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'newWorksDailyStats',
    storage: 'IDB newWorksDailyStats',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'last_import_stats',
    storage: 'last_import_stats',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
    notes: 'default rebuildable unless product promotes to account',
  },
  {
    asset: 'restore_backup',
    storage: 'restore_backup / webdav_last_selected_backup',
    cloudClass: 'rebuildable',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  // ----- local -----
  {
    asset: 'telemetry_client_state',
    storage: 'telemetry client key',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'emby_library_state',
    storage: 'emby_library_state',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'privacy_session',
    storage: 'privacy_state / privacy_session',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'logs',
    storage: 'persistent_logs / IDB logs / magnet push logs',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'dashboard_last_page',
    storage: 'dashboard_last_page',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'idb_migration_flags',
    storage: 'idb_*_migrated',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'media_115_cleanup_list',
    storage: 'media_115_cleanup_list',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
  },
  {
    asset: 'cloud_device_tokens',
    storage: 'device-local secure store',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
    notes: 'per-device access/refresh; never sync as business entity',
  },
  {
    asset: 'webdav_local_client_identity',
    storage: 'webdav clientId profile',
    cloudClass: 'local',
    entityType: '-',
    conflict: 'n/a',
    webdavAlign: false,
    notes: 'separate from Cloud device registry',
  },
] as const;

export function assetsByClass(cloudClass: CloudAssetClass): AssetMatrixRow[] {
  return ASSET_MATRIX.filter((row) => row.cloudClass === cloudClass);
}

export function accountEntityTypesFromMatrix(): SyncEntityType[] {
  const types = new Set<SyncEntityType>();
  for (const row of ASSET_MATRIX) {
    if (row.cloudClass === 'account' && row.entityType !== '-') {
      types.add(row.entityType);
    }
  }
  return [...types].sort();
}

/**
 * Assert matrix account entity types match the frozen SYNC_ENTITY_TYPES list.
 * Throws if the contract drifts.
 */
export function assertAccountEntityTypesComplete(): void {
  const fromMatrix = new Set(accountEntityTypesFromMatrix());
  const expected = new Set(ACCOUNT_ENTITY_TYPES);
  for (const t of expected) {
    if (!fromMatrix.has(t)) {
      throw new Error(`assetMatrix missing account entityType: ${t}`);
    }
  }
  for (const t of fromMatrix) {
    if (!expected.has(t)) {
      throw new Error(`assetMatrix has undeclared account entityType: ${t}`);
    }
  }
}

/** Preference / settings path classification helpers (string paths, not values). */
export type SettingsPathClass = 'syncable' | 'secret' | 'local';

/**
 * Heuristic path classifier for settings keys.
 * Integration may override with an explicit whitelist; secrets must never be syncable.
 */
export function classifySettingsPath(path: string): SettingsPathClass {
  const p = path.toLowerCase();
  if (
    p.includes('password')
    || p.includes('token')
    || p.includes('secret')
    || p.includes('cookie')
    || p.includes('apikey')
    || p.includes('api_key')
    || p.includes('credential')
  ) {
    return 'secret';
  }
  if (
    p.includes('webdav')
    || p.includes('drive115')
    || p.includes('proxy')
    || p.includes('endpoint')
    || p.endsWith('url') && (p.includes('server') || p.includes('base'))
  ) {
    // connection configs: credentials → vault; bare URL may still be secret-adjacent
    if (p.includes('password') || p.includes('token') || p.includes('user')) {
      return 'secret';
    }
  }
  if (
    p.includes('path')
    || p.includes('session')
    || p.includes('window')
    || p.includes('lastpage')
    || p.includes('last_page')
    || p.includes('device')
    || p.includes('telemetry')
  ) {
    return 'local';
  }
  return 'syncable';
}

/** Guard: secret classification must never be treated as syncable entity path. */
export function assertNoSecretMarkedSyncable(
  entries: ReadonlyArray<{ path: string; class: SettingsPathClass }>,
): void {
  for (const e of entries) {
    if (e.class === 'syncable' && classifySettingsPath(e.path) === 'secret') {
      throw new Error(`secret path marked syncable: ${e.path}`);
    }
  }
}
