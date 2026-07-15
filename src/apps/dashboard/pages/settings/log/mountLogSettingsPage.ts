/**
 * @file mountLogSettingsPage.ts
 * @description 挂载日志设置 React 全页
 * @module apps/dashboard/pages/settings/log
 */
import { LogSettingsPage } from './LogSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountLogSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: LogSettingsPage,
    markerAttr: 'data-log-settings-react',
    mountDataset: { logSettingsReact: '1' },
  });
}

export function unmountLogSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
