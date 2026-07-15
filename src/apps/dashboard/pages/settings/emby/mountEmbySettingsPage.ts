/**
 * @file mountEmbySettingsPage.ts
 * @description 挂载 Emby/Jellyfin 设置 React 全页
 * @module apps/dashboard/pages/settings/emby
 */
import { EmbySettingsPage } from './EmbySettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountEmbySettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: EmbySettingsPage,
    markerAttr: 'data-emby-settings-react',
    mountDataset: { embySettingsReact: '1' },
  });
}

export function unmountEmbySettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
