/**
 * @file mountInsightsSettingsPage.ts
 * @description 挂载报告设置 React 全页
 * @module apps/dashboard/pages/settings/insights
 */
import { InsightsSettingsPage } from './InsightsSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountInsightsSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: InsightsSettingsPage,
    markerAttr: 'data-insights-settings-react',
    mountDataset: { insightsSettingsReact: '1' },
  });
}

export function unmountInsightsSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
