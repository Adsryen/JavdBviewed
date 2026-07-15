/**
 * @file mountEnhancementSettingsPage.ts
 * @description 挂载功能增强设置 React 全页
 * @module apps/dashboard/pages/settings/enhancement
 */
import { EnhancementSettingsPage } from './EnhancementSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountEnhancementSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: EnhancementSettingsPage,
    markerAttr: 'data-enhancement-settings-react',
    mountDataset: { enhancementSettingsReact: '1' },
  });
}

export function unmountEnhancementSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
