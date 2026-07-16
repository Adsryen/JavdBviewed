/**
 * @file assetMatrix.test.ts
 * @description Asset matrix completeness and settings path guards.
 */
import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_ENTITY_TYPES,
  ASSET_MATRIX,
  accountEntityTypesFromMatrix,
  assertAccountEntityTypesComplete,
  assertNoSecretMarkedSyncable,
  assetsByClass,
  classifySettingsPath,
} from './assetMatrix';
import { SYNC_ENTITY_TYPES } from './types';

describe('assetMatrix', () => {
  it('lists all account entity types required by contract', () => {
    expect(ACCOUNT_ENTITY_TYPES).toEqual([...SYNC_ENTITY_TYPES]);
    assertAccountEntityTypesComplete();
    expect(accountEntityTypesFromMatrix().sort()).toEqual([...SYNC_ENTITY_TYPES].sort());
  });

  it('has account, vault, rebuildable, and local rows', () => {
    expect(assetsByClass('account').length).toBeGreaterThan(0);
    expect(assetsByClass('vault').length).toBeGreaterThan(0);
    expect(assetsByClass('rebuildable').length).toBeGreaterThan(0);
    expect(assetsByClass('local').length).toBeGreaterThan(0);
  });

  it('never assigns entityType to local or rebuildable rows', () => {
    for (const row of ASSET_MATRIX) {
      if (row.cloudClass === 'local' || row.cloudClass === 'rebuildable') {
        expect(row.entityType).toBe('-');
      }
    }
  });

  it('marks emby and telemetry as local', () => {
    const localAssets = new Set(assetsByClass('local').map((r) => r.asset));
    expect(localAssets.has('emby_library_state')).toBe(true);
    expect(localAssets.has('telemetry_client_state')).toBe(true);
    expect(localAssets.has('cloud_device_tokens')).toBe(true);
  });
});

describe('classifySettingsPath', () => {
  it('classifies secrets', () => {
    expect(classifySettingsPath('webdav.password')).toBe('secret');
    expect(classifySettingsPath('ai.apiKey')).toBe('secret');
    expect(classifySettingsPath('drive115.cookie')).toBe('secret');
  });

  it('classifies local runtime paths', () => {
    expect(classifySettingsPath('dashboard_last_page')).toBe('local');
    expect(classifySettingsPath('privacy.session')).toBe('local');
  });

  it('defaults pure prefs to syncable', () => {
    expect(classifySettingsPath('display.theme')).toBe('syncable');
    expect(classifySettingsPath('features.enableFoo')).toBe('syncable');
  });

  it('assertNoSecretMarkedSyncable catches mistakes', () => {
    expect(() =>
      assertNoSecretMarkedSyncable([
        { path: 'webdav.password', class: 'syncable' },
      ]),
    ).toThrow(/secret path/);
  });
});
