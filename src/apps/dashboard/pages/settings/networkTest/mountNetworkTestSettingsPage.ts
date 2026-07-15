/**
 * @file mountNetworkTestSettingsPage.ts
 * @description 挂载网络配置 React 全页
 * @module apps/dashboard/pages/settings/networkTest
 */
import { NetworkTestSettingsPage } from './NetworkTestSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

/**
 * 在设置宿主挂载网络配置 React 全页
 */
export function mountNetworkTestSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: NetworkTestSettingsPage,
    markerAttr: 'data-network-test-settings-react',
    mountDataset: { networkTestSettingsReact: '1' },
  });
}

/**
 * 卸载网络配置 React 全页
 */
export function unmountNetworkTestSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
