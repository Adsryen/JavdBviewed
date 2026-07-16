/**
 * @file insightsSettingsModel.ts
 * @description 报告（Insights）设置纯数据模型：默认值、映射、校验
 * @module apps/dashboard/pages/settings/insights
 */
import type { ExtensionSettings } from '../../../../../types';

export type InsightsStatusScope = 'viewed' | 'viewed_browsed' | 'viewed_browsed_want';
export type InsightsSource = 'views' | 'compare' | 'auto';

export type InsightsSettingsFormState = {
  topN: number;
  changeThresholdRatio: number;
  minTagCount: number;
  risingLimit: number;
  fallingLimit: number;
  statusScope: InsightsStatusScope;
  autoMonthlyEnabled: boolean;
  autoCompensateOnStartupEnabled: boolean;
  source: InsightsSource;
  minMonthlySamples: number;
  autoMonthlyMinuteOfDay: number;
};

export const DEFAULT_INSIGHTS_SETTINGS_FORM: InsightsSettingsFormState = {
  topN: 10,
  changeThresholdRatio: 0.08,
  minTagCount: 3,
  risingLimit: 5,
  fallingLimit: 5,
  statusScope: 'viewed',
  autoMonthlyEnabled: false,
  autoCompensateOnStartupEnabled: false,
  source: 'views',
  minMonthlySamples: 10,
  autoMonthlyMinuteOfDay: 10,
};

export const INSIGHTS_SOURCE_OPTIONS = [
  { value: 'views', label: '仅观看记录' },
  { value: 'compare', label: '对比模式（观看 vs 浏览）' },
  { value: 'auto', label: '自动选择' },
] as const;

export const INSIGHTS_STATUS_SCOPE_OPTIONS = [
  { value: 'viewed', label: '仅已观看' },
  { value: 'viewed_browsed', label: '已观看 + 已浏览' },
  { value: 'viewed_browsed_want', label: '已观看 + 已浏览 + 想看' },
] as const;

function parseIntSafe(v: unknown, def: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : def;
}

function parseFloatSafe(v: unknown, def: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : def;
}

/**
 * 从完整设置映射为表单
 */
export function mapSettingsToInsightsForm(
  settings: Partial<ExtensionSettings> | null | undefined,
): InsightsSettingsFormState {
  const ins = (settings?.insights || {}) as Partial<InsightsSettingsFormState>;
  const statusScope = String(ins.statusScope ?? 'viewed');
  const source = String(ins.source ?? 'views');
  return {
    topN: parseIntSafe(ins.topN, 10),
    changeThresholdRatio: parseFloatSafe(ins.changeThresholdRatio, 0.08),
    minTagCount: parseIntSafe(ins.minTagCount, 3),
    risingLimit: parseIntSafe(ins.risingLimit, 5),
    fallingLimit: parseIntSafe(ins.fallingLimit, 5),
    statusScope: (['viewed', 'viewed_browsed', 'viewed_browsed_want'].includes(statusScope)
      ? statusScope
      : 'viewed') as InsightsStatusScope,
    autoMonthlyEnabled: !!ins.autoMonthlyEnabled,
    autoCompensateOnStartupEnabled: !!ins.autoCompensateOnStartupEnabled,
    source: (['views', 'compare', 'auto'].includes(source) ? source : 'views') as InsightsSource,
    minMonthlySamples: parseIntSafe(ins.minMonthlySamples, 10),
    autoMonthlyMinuteOfDay: Number.isFinite(ins.autoMonthlyMinuteOfDay as number)
      ? Number(ins.autoMonthlyMinuteOfDay)
      : 10,
  };
}

/**
 * 将表单合并回 ExtensionSettings
 */
export function applyInsightsFormToSettings(
  current: ExtensionSettings,
  form: InsightsSettingsFormState,
): ExtensionSettings {
  return {
    ...current,
    insights: {
      ...(current.insights || {}),
      topN: form.topN,
      changeThresholdRatio: form.changeThresholdRatio,
      minTagCount: form.minTagCount,
      risingLimit: form.risingLimit,
      fallingLimit: form.fallingLimit,
      statusScope: form.statusScope,
      autoMonthlyEnabled: form.autoMonthlyEnabled,
      autoCompensateOnStartupEnabled: form.autoCompensateOnStartupEnabled,
      source: form.source,
      minMonthlySamples: form.minMonthlySamples,
      autoMonthlyMinuteOfDay: form.autoMonthlyMinuteOfDay,
    },
  };
}

/**
 * 校验表单（对齐遗留 InsightsSettings）
 */
export function validateInsightsForm(form: InsightsSettingsFormState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!Number.isFinite(form.topN) || form.topN < 1 || form.topN > 50) {
    errors.push('TopN 需在 1-50 之间');
  }
  if (
    !Number.isFinite(form.changeThresholdRatio) ||
    form.changeThresholdRatio < 0 ||
    form.changeThresholdRatio > 1
  ) {
    errors.push('显著变化阈值需在 0-1 之间');
  }
  if (!Number.isFinite(form.minTagCount) || form.minTagCount < 0 || form.minTagCount > 999) {
    errors.push('最小计数需在 0-999 之间');
  }
  if (!Number.isFinite(form.risingLimit) || form.risingLimit < 0 || form.risingLimit > 50) {
    errors.push('上升标签展示条数需在 0-50 之间');
  }
  if (!Number.isFinite(form.fallingLimit) || form.fallingLimit < 0 || form.fallingLimit > 50) {
    errors.push('下降标签展示条数需在 0-50 之间');
  }
  if (!['viewed', 'viewed_browsed', 'viewed_browsed_want'].includes(form.statusScope)) {
    errors.push('统计状态口径取值不合法');
  }
  if (!['views', 'compare', 'auto'].includes(form.source)) {
    errors.push('数据源模式取值不合法');
  }
  if (
    !Number.isFinite(form.minMonthlySamples) ||
    form.minMonthlySamples < 0 ||
    form.minMonthlySamples > 999
  ) {
    errors.push('最小样本量需在 0-999 之间');
  }
  if (
    !Number.isFinite(form.autoMonthlyMinuteOfDay) ||
    form.autoMonthlyMinuteOfDay < 0 ||
    form.autoMonthlyMinuteOfDay > 1439
  ) {
    errors.push('触发分钟需在 0-1439 之间');
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * 自动月报提示文案
 */
export function buildInsightsAutoTip(form: InsightsSettingsFormState): string {
  const lines: string[] = [];
  const minute = form.autoMonthlyMinuteOfDay;
  const hh = String(Math.floor(minute / 60)).padStart(2, '0');
  const mm = String(minute % 60).padStart(2, '0');
  if (form.autoMonthlyEnabled) {
    lines.push(`已启用自动月报：每月 1 日 ${hh}:${mm} 自动生成上月报告。`);
  }
  if (form.autoCompensateOnStartupEnabled) {
    lines.push('已启用启动补偿：如错过定时，将在浏览器启动/扩展唤醒时自动补生成。');
  }
  return lines.join(' ');
}
