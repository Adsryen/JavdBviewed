/**
 * @file mountDisplaySettingsPage.ts
 * @description 挂载显示设置 React 全页（走通用 mount）
 * @module apps/dashboard/pages/settings/display
 */
import { DisplaySettingsPage } from './DisplaySettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

/**
 * 在 #tab-settings 挂载显示设置 React 页（跳过 partial HTML）
 */
export function mountDisplaySettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: DisplaySettingsPage,
    markerAttr: 'data-display-settings-react',
    mountDataset: { displaySettingsReact: '1' },
  });
}

/**
 * 卸载显示设置 React 页
 */
export function unmountDisplaySettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
