/**
 * @file tabContentIds.ts
 * @description Dashboard 各标签内容容器的稳定 id（外壳与导航共用）
 * @module dashboard/tabs
 */
export const DASHBOARD_TAB_CONTENT_IDS = [
  'tab-home',
  'tab-records',
  'tab-lists',
  'tab-actors',
  'tab-new-works',
  'tab-recycle-bin',
  'tab-media',
  'tab-backup',
  'tab-sync',
  'tab-drive115-tasks',
  'tab-insights',
  'tab-settings',
  'tab-logs',
] as const;

export type DashboardTabContentId = (typeof DASHBOARD_TAB_CONTENT_IDS)[number];
