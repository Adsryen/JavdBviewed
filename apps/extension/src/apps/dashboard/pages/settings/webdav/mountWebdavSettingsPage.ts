/**
 * @file mountWebdavSettingsPage.ts
 * @description 挂载 WebDAV 同步 React 全页
 * @module apps/dashboard/pages/settings/webdav
 */
import { WebdavSettingsPage } from './WebdavSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountWebdavSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: WebdavSettingsPage,
    markerAttr: 'data-webdav-settings-react',
    mountDataset: { webdavSettingsReact: '1' },
  });
}

export function unmountWebdavSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
