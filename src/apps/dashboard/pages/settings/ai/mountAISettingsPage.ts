/**
 * @file mountAISettingsPage.ts
 * @description 挂载 AI 设置 React 全页
 * @module apps/dashboard/pages/settings/ai
 */
import { AISettingsPage } from './AISettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountAISettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: AISettingsPage,
    markerAttr: 'data-ai-settings-react',
    mountDataset: { aiSettingsReact: '1' },
  });
}

export function unmountAISettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
