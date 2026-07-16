/**
 * @file mountSyncSettingsPage.ts
 * @description 挂载同步设置 React 全页
 * @module apps/dashboard/pages/settings/sync
 */
import { SyncSettingsPage } from './SyncSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountSyncSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: SyncSettingsPage,
    markerAttr: 'data-sync-settings-react',
    mountDataset: { syncSettingsReact: '1' },
  });
}

export function unmountSyncSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
