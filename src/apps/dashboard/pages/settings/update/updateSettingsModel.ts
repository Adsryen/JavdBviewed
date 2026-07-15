/**
 * @file updateSettingsModel.ts
 * @description 版本与关于页纯数据模型
 * @module apps/dashboard/pages/settings/update
 */
import type { ExtensionSettings } from '../../../../../types';

export type UpdateSettingsFormState = {
  autoUpdateCheck: boolean;
  /** 小时数字符串，与遗留 select value 对齐 */
  updateCheckInterval: string;
  includePrerelease: boolean;
};

export const DEFAULT_UPDATE_SETTINGS_FORM: UpdateSettingsFormState = {
  autoUpdateCheck: true,
  updateCheckInterval: '24',
  includePrerelease: false,
};

export const UPDATE_INTERVAL_OPTIONS: { value: string; label: string }[] = [
  { value: '6', label: '每 6 小时' },
  { value: '12', label: '每 12 小时' },
  { value: '24', label: '每 24 小时' },
  { value: '72', label: '每 3 天' },
  { value: '168', label: '每周' },
];

/**
 * 从完整设置映射为表单
 */
export function mapSettingsToUpdateForm(
  settings: Partial<ExtensionSettings> | null | undefined,
): UpdateSettingsFormState {
  return {
    autoUpdateCheck: (settings as any)?.autoUpdateCheck !== false,
    updateCheckInterval: String((settings as any)?.updateCheckInterval || '24'),
    includePrerelease: (settings as any)?.includePrerelease === true,
  };
}

/**
 * 合并表单回设置对象
 */
export function applyUpdateFormToSettings(
  current: ExtensionSettings,
  form: UpdateSettingsFormState,
): ExtensionSettings {
  return {
    ...current,
    autoUpdateCheck: form.autoUpdateCheck,
    updateCheckInterval: form.updateCheckInterval,
    includePrerelease: form.includePrerelease,
  } as ExtensionSettings;
}

/**
 * 格式化上次检查时间
 */
export function formatLastUpdateCheck(iso: string | null | undefined): string {
  if (!iso) return '从未检查';
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return '从未检查';
  }
}
