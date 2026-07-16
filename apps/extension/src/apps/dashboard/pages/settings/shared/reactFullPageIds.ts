/**
 * @file reactFullPageIds.ts
 * @description 完整 React 内容页 id 集合
 * @module apps/dashboard/pages/settings/shared
 *
 * 产品决策（2026-07-15）：设置子页内容保持遗留 partial + 原 CSS/弹窗交互，
 * 仅索引页与返回壳走 React。完整 React 内容页代码保留在 pages/settings/* 供后续渐进迁移，
 * 默认不接入路由，避免覆盖已微调样式。
 */

/** hash 子路径 id；仅名单内走完整 React 内容页（默认尽量少，避免覆盖已微调 partial） */
export const REACT_FULL_SETTINGS_PAGE_IDS = new Set<string>([
  // Cloud 为新能力，无遗留 partial 样式负担
  'cloud-settings',
]);
/**
 * 是否为完整 React 设置子页
 */
export function isReactFullSettingsPage(subSection: string | null | undefined): boolean {
  if (!subSection) return false;
  return REACT_FULL_SETTINGS_PAGE_IDS.has(subSection);
}
