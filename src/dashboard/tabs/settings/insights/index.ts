/**
 * Insights 设置模块入口
 */

import type { InsightsSettingsPanel } from './InsightsSettings';

let _insightsSettings: InsightsSettingsPanel | null = null;

export async function getInsightsSettings(): Promise<InsightsSettingsPanel> {
  if (!_insightsSettings) {
    const { InsightsSettingsPanel } = await import('./InsightsSettings');
    _insightsSettings = new InsightsSettingsPanel();
  }
  return _insightsSettings;
}

export const insightsSettings = {
  get instance() {
    return getInsightsSettings();
  }
};
