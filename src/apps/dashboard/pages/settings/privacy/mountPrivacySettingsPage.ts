/**
 * @file mountPrivacySettingsPage.ts
 * @description 挂载隐私保护 React 全页
 * @module apps/dashboard/pages/settings/privacy
 */
import { PrivacySettingsPage } from './PrivacySettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountPrivacySettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: PrivacySettingsPage,
    markerAttr: 'data-privacy-settings-react',
    mountDataset: { privacySettingsReact: '1' },
  });
}

export function unmountPrivacySettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
