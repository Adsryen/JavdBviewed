/**
 * @file settingsTitleMap.ts
 * @description 设置子路径 → 短展示名（与 settings panelId 对齐）
 * @module dashboard/lastPage
 */

/** panelId / hash subPath → 用户可见短名 */
export const SETTINGS_SUBPATH_TITLES: Readonly<Record<string, string>> = {
  'display-settings': '显示设置',
  'search-engine-settings': '搜索引擎',
  'enhancement-settings': '功能增强',
  'emby-settings': 'Emby/Jellyfin',
  'webdav-settings': 'WebDAV 冷备份',
  'cloud-settings': 'Cloud 多端同步',
  'sync-settings': '同步设置',  'drive115-settings': '115网盘设置',
  'insights-settings': '报告设置',
  'log-settings': '日志设置',
  'logging-settings': '日志设置',
  'advanced-settings': '高级配置',
  'network-test-settings': '网络测试',
  'update-settings': '版本与关于',
  'about-settings': '版本与关于',
  'ai-settings': 'AI设置',
  'privacy-settings': '隐私保护',
  'global-actions': '全局操作',
};

export function resolveSettingsSubPathTitle(subPath: string): string {
  const key = subPath.trim();
  return SETTINGS_SUBPATH_TITLES[key] || key || '设置';
}
