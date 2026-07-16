/**
 * @file mountUpdateSettingsPage.ts
 * @description 挂载版本与关于 React 全页
 * @module apps/dashboard/pages/settings/update
 */
import { UpdateSettingsPage } from './UpdateSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountUpdateSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: UpdateSettingsPage,
    markerAttr: 'data-update-settings-react',
    mountDataset: { updateSettingsReact: '1' },
  });
}

export function unmountUpdateSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
