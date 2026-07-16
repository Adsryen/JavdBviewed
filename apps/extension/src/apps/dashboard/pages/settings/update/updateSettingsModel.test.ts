/**
 * @file updateSettingsModel.test.ts
 * @description 版本设置模型单测
 * @module apps/dashboard/pages/settings/update
 */
import { describe, expect, it } from 'vitest';
import {
  applyUpdateFormToSettings,
  DEFAULT_UPDATE_SETTINGS_FORM,
  formatLastUpdateCheck,
  mapSettingsToUpdateForm,
} from './updateSettingsModel';

describe('updateSettingsModel', () => {
  it('defaults auto check true and interval 24', () => {
    expect(mapSettingsToUpdateForm({})).toEqual(DEFAULT_UPDATE_SETTINGS_FORM);
  });

  it('maps explicit values', () => {
    const form = mapSettingsToUpdateForm({
      autoUpdateCheck: false,
      updateCheckInterval: '12',
      includePrerelease: true,
    } as any);
    expect(form.autoUpdateCheck).toBe(false);
    expect(form.updateCheckInterval).toBe('12');
    expect(form.includePrerelease).toBe(true);
  });

  it('applies form back to settings', () => {
    const next = applyUpdateFormToSettings({} as any, {
      autoUpdateCheck: false,
      updateCheckInterval: '168',
      includePrerelease: true,
    });
    expect((next as any).autoUpdateCheck).toBe(false);
    expect((next as any).updateCheckInterval).toBe('168');
    expect((next as any).includePrerelease).toBe(true);
  });

  it('formats last check', () => {
    expect(formatLastUpdateCheck(null)).toBe('从未检查');
    expect(formatLastUpdateCheck('not-a-date')).not.toBe('');
  });
});
