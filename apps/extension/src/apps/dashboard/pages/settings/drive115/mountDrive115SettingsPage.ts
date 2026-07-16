/**
 * @file mountDrive115SettingsPage.ts
 * @description 挂载 115 网盘设置 React 全页
 * @module apps/dashboard/pages/settings/drive115
 */
import { Drive115SettingsPage } from './Drive115SettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

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
