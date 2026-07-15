/**
 * @file reactFullPageIds.ts
 * @description 已完整 React 化（跳过 partial + 遗留 init）的设置子页 id 集合
 * @module apps/dashboard/pages/settings/shared
 */

/** hash 子路径 id，如 display-settings */
export const REACT_FULL_SETTINGS_PAGE_IDS = new Set<string>([
  'display-settings',
  'insights-settings',
  'sync-settings',
  'global-actions',
  'advanced-settings',
  'log-settings',
  'update-settings',
  'about-settings',
  'privacy-settings',
  'search-engine-settings',
  'ai-settings',
]);

/**
 * 是否为完整 React 设置子页
 */
export function isReactFullSettingsPage(subSection: string | null | undefined): boolean {
  if (!subSection) return false;
  return REACT_FULL_SETTINGS_PAGE_IDS.has(subSection);
}
