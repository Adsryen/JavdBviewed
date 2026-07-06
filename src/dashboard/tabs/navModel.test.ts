/**
 * @file navModel.test.ts
 * @description Dashboard 9C 导航模型测试
 * @module dashboard/tabs
 */
import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_NAV_GROUPS,
  buildDashboardNavHash,
  getDefaultNavState,
  resolveDashboardNavState,
} from './navModel';

describe('Dashboard 9C navigation model', () => {
  it('defines the accepted top-level groups with full second-level labels', () => {
    expect(DASHBOARD_NAV_GROUPS.map(group => group.label)).toEqual([
      '首页',
      '资料库',
      '媒体库',
      '同步与任务',
      '分析与诊断',
      '设置',
    ]);

    const library = DASHBOARD_NAV_GROUPS.find(group => group.id === 'library');
    expect(library?.items.map(item => item.label)).toEqual([
      '番号库',
      '演员库',
      '新作品',
      '收藏中心',
      '回收站',
    ]);

    const analysis = DASHBOARD_NAV_GROUPS.find(group => group.id === 'analysis');
    expect(analysis?.items.map(item => item.label)).toEqual(['报告', '日志']);
  });

  it('resolves old direct tab hashes to the correct group and item', () => {
    expect(resolveDashboardNavState('#tab-records')).toMatchObject({
      groupId: 'library',
      itemId: 'records',
      tabId: 'tab-records',
    });

    expect(resolveDashboardNavState('#tab-drive115-tasks')).toMatchObject({
      groupId: 'sync',
      itemId: 'drive115-tasks',
      tabId: 'tab-drive115-tasks',
    });

    expect(resolveDashboardNavState('#tab-insights')).toMatchObject({
      groupId: 'analysis',
      itemId: 'insights',
      tabId: 'tab-insights',
    });

    expect(resolveDashboardNavState('#tab-logs')).toMatchObject({
      groupId: 'analysis',
      itemId: 'logs',
      tabId: 'tab-logs',
    });
  });

  it('resolves media source hashes to tab-media with the matching source subpath', () => {
    expect(resolveDashboardNavState('#tab-media/emby')).toEqual({
      groupId: 'media',
      itemId: 'media-emby',
      tabId: 'tab-media',
      subPath: 'emby',
    });

    expect(buildDashboardNavHash({ tabId: 'tab-media', subPath: 'jellyfin' })).toBe('#tab-media/jellyfin');
  });

  it('keeps settings subpage hashes under the settings group', () => {
    expect(resolveDashboardNavState('#tab-settings/drive115-settings')).toEqual({
      groupId: 'settings',
      itemId: 'settings-center',
      tabId: 'tab-settings',
      subPath: 'drive115-settings',
    });
  });

  it('falls back to the home overview state for empty or unknown hashes', () => {
    expect(resolveDashboardNavState('')).toEqual(getDefaultNavState());
    expect(resolveDashboardNavState('#unknown-tab')).toEqual(getDefaultNavState());
  });
});
