/**
 * @file insightsSettingsModel.test.ts
 * @description 报告设置模型：默认值、映射、校验
 * @module apps/dashboard/pages/settings/insights
 */
import { describe, expect, it } from 'vitest';
import {
  applyInsightsFormToSettings,
  buildInsightsAutoTip,
  DEFAULT_INSIGHTS_SETTINGS_FORM,
  mapSettingsToInsightsForm,
  validateInsightsForm,
} from './insightsSettingsModel';

describe('insightsSettingsModel', () => {
  it('defaults match legacy InsightsSettings', () => {
    expect(DEFAULT_INSIGHTS_SETTINGS_FORM.topN).toBe(10);
    expect(DEFAULT_INSIGHTS_SETTINGS_FORM.changeThresholdRatio).toBe(0.08);
    expect(DEFAULT_INSIGHTS_SETTINGS_FORM.statusScope).toBe('viewed');
    expect(DEFAULT_INSIGHTS_SETTINGS_FORM.source).toBe('views');
    expect(DEFAULT_INSIGHTS_SETTINGS_FORM.autoMonthlyMinuteOfDay).toBe(10);
  });

  it('maps empty settings to defaults', () => {
    expect(mapSettingsToInsightsForm(undefined)).toEqual(DEFAULT_INSIGHTS_SETTINGS_FORM);
    expect(mapSettingsToInsightsForm({})).toEqual(DEFAULT_INSIGHTS_SETTINGS_FORM);
  });

  it('maps explicit insights fields', () => {
    const form = mapSettingsToInsightsForm({
      insights: {
        topN: 20,
        changeThresholdRatio: 0.2,
        minTagCount: 5,
        risingLimit: 8,
        fallingLimit: 2,
        statusScope: 'viewed_browsed',
        autoMonthlyEnabled: true,
        autoCompensateOnStartupEnabled: true,
        source: 'compare',
        minMonthlySamples: 15,
        autoMonthlyMinuteOfDay: 90,
      },
    } as any);
    expect(form.topN).toBe(20);
    expect(form.source).toBe('compare');
    expect(form.autoMonthlyMinuteOfDay).toBe(90);
    expect(form.autoMonthlyEnabled).toBe(true);
  });

  it('validates ranges', () => {
    expect(validateInsightsForm(DEFAULT_INSIGHTS_SETTINGS_FORM).isValid).toBe(true);
    const bad = validateInsightsForm({
      ...DEFAULT_INSIGHTS_SETTINGS_FORM,
      topN: 0,
      changeThresholdRatio: 2,
      autoMonthlyMinuteOfDay: 2000,
    });
    expect(bad.isValid).toBe(false);
    expect(bad.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('merges form into settings', () => {
    const next = applyInsightsFormToSettings(
      { insights: { topN: 1 } } as any,
      { ...DEFAULT_INSIGHTS_SETTINGS_FORM, topN: 12 },
    );
    expect(next.insights?.topN).toBe(12);
  });

  it('builds auto tip from flags and minute', () => {
    const tip = buildInsightsAutoTip({
      ...DEFAULT_INSIGHTS_SETTINGS_FORM,
      autoMonthlyEnabled: true,
      autoCompensateOnStartupEnabled: true,
      autoMonthlyMinuteOfDay: 70,
    });
    expect(tip).toContain('01:10');
    expect(tip).toContain('启动补偿');
  });
});
