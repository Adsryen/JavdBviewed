/**
 * @file mountSearchEngineSettingsPage.ts
 * @description 挂载搜索引擎 React 全页
 * @module apps/dashboard/pages/settings/searchEngine
 */
import { SearchEngineSettingsPage } from './SearchEngineSettingsPage';
import { mountReactSettingsPage, unmountReactSettingsPage } from '../shared/mountReactSettingsPage';

export function mountSearchEngineSettingsPage(hostSelector = '#tab-settings'): void {
  mountReactSettingsPage({
    hostSelector,
    kind: 'subpage',
    element: SearchEngineSettingsPage,
    markerAttr: 'data-search-engine-settings-react',
    mountDataset: { searchEngineSettingsReact: '1' },
  });
}

export function unmountSearchEngineSettingsPage(hostSelector = '#tab-settings'): void {
  unmountReactSettingsPage(hostSelector);
}
