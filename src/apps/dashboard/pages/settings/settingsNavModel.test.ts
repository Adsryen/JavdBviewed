/**
 * @file settingsNavModel.test.ts
 * @description 设置导航目录纯函数测试
 * @module apps/dashboard/pages/settings
 */
import { describe, expect, it } from 'vitest';
import {
  filterSettingsNavItems,
  resolveSettingsSubpageMeta,
  SETTINGS_NAV_ITEMS,
  settingsNavHref,
} from './settingsNavModel';

describe('settingsNavModel', () => {
  it('has a stable non-empty catalog including emby and update', () => {
    expect(SETTINGS_NAV_ITEMS.length).toBeGreaterThanOrEqual(10);
    expect(SETTINGS_NAV_ITEMS.some((i) => i.id === 'emby-settings')).toBe(true);
    expect(SETTINGS_NAV_ITEMS.some((i) => i.id === 'update-settings')).toBe(true);
  });

  it('builds settings hash', () => {
    expect(settingsNavHref('display-settings')).toBe('#tab-settings/display-settings');
  });

  it('filters by title description or id', () => {
    const hits = filterSettingsNavItems(SETTINGS_NAV_ITEMS, 'webdav');
    expect(hits.some((i) => i.id === 'webdav-settings')).toBe(true);
    expect(filterSettingsNavItems(SETTINGS_NAV_ITEMS, '不存在的词')).toEqual([]);
  });

  it('resolves subpage shell meta for known and unknown sections', () => {
    const display = resolveSettingsSubpageMeta('display-settings');
    expect(display.title).toContain('显示');
    expect(display.panelRootId).toBe('display-settings');

    const unknown = resolveSettingsSubpageMeta('future-settings');
    expect(unknown.panelRootId).toBe('future-settings');
    expect(unknown.title).toBe('设置');
  });
});
