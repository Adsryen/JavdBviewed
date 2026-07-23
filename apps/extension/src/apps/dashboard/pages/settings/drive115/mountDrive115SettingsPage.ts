/**
 * @file mountDrive115SettingsPage.ts
 * @description 挂载 115 网盘设置 React 全页
 * @module apps/dashboard/pages/settings/drive115
 */
import { Drive115SettingsPage } from './Drive115SettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';
// React 全页不走 partial resources 映射时仍需页级样式（与 legacy 金样同源）
import '../../../../../dashboard/styles/05-pages/settings/settings.css';
import '../../../../../dashboard/styles/05-pages/settings/drive115.css';

export function mountDrive115SettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: Drive115SettingsPage,
    markerAttr: 'data-drive115-settings-react',
    mountDataset: { drive115SettingsReact: '1' },
  });
}

export function unmountDrive115SettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
