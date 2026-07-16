/**
 * @file syncSettingsModel.test.ts
 * @description 同步设置模型测试
 * @module apps/dashboard/pages/settings/sync
 */
import { describe, expect, it } from 'vitest';
import {
  applySyncFormToSettings,
  DEFAULT_SYNC_SETTINGS_FORM,
  mapSettingsToSyncForm,
  validateSyncForm,
} from './syncSettingsModel';

describe('syncSettingsModel', () => {
  it('defaults match legacy SyncSettings', () => {
    expect(DEFAULT_SYNC_SETTINGS_FORM.requestInterval).toBe(3);
    expect(DEFAULT_SYNC_SETTINGS_FORM.actorSyncInterval).toBe(1440);
    expect(DEFAULT_SYNC_SETTINGS_FORM.actorEnabled).toBe(false);
  });

  it('maps empty to defaults', () => {
    expect(mapSettingsToSyncForm(undefined)).toEqual(DEFAULT_SYNC_SETTINGS_FORM);
  });

  it('validates ranges', () => {
    expect(validateSyncForm(DEFAULT_SYNC_SETTINGS_FORM).isValid).toBe(true);
    const bad = validateSyncForm({
      ...DEFAULT_SYNC_SETTINGS_FORM,
      requestInterval: 0,
      actorBatchSize: 5,
    });
    expect(bad.isValid).toBe(false);
    expect(bad.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('applies form into dataSync and actorSync', () => {
    const next = applySyncFormToSettings({} as any, {
      ...DEFAULT_SYNC_SETTINGS_FORM,
      actorEnabled: true,
      wantWatchUrl: 'https://example.com/want',
    });
    expect(next.actorSync?.enabled).toBe(true);
    expect((next.dataSync as any)?.urls?.wantWatch).toBe('https://example.com/want');
  });
});
