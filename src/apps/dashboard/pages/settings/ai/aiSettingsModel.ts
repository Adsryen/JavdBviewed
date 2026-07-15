/**
 * @file aiSettingsModel.ts
 * @description AI 设置纯数据模型：默认值、映射、校验
 * @module apps/dashboard/pages/settings/ai
 */
import type { ExtensionSettings } from '../../../../../types';
import type { AISettings } from '../../../../../types/ai';
import { DEFAULT_AI_SETTINGS } from '../../../../../types/ai';

export type AiSettingsFormState = {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
  systemPrompt: string;
  timeout: number;
  autoRetryEmpty: boolean;
  autoRetryMax: number;
  errorRetryEnabled: boolean;
  errorRetryMax: number;
};

export const DEFAULT_AI_SETTINGS_FORM: AiSettingsFormState = {
  enabled: DEFAULT_AI_SETTINGS.enabled,
  apiUrl: DEFAULT_AI_SETTINGS.apiUrl,
  apiKey: DEFAULT_AI_SETTINGS.apiKey,
  selectedModel: DEFAULT_AI_SETTINGS.selectedModel,
  temperature: DEFAULT_AI_SETTINGS.temperature,
  maxTokens: DEFAULT_AI_SETTINGS.maxTokens,
  streamEnabled: DEFAULT_AI_SETTINGS.streamEnabled,
  systemPrompt: DEFAULT_AI_SETTINGS.systemPrompt,
  timeout: DEFAULT_AI_SETTINGS.timeout,
  autoRetryEmpty: DEFAULT_AI_SETTINGS.autoRetryEmpty,
  autoRetryMax: DEFAULT_AI_SETTINGS.autoRetryMax,
  errorRetryEnabled: DEFAULT_AI_SETTINGS.errorRetryEnabled ?? false,
  errorRetryMax: DEFAULT_AI_SETTINGS.errorRetryMax ?? 2,
};

function parseNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function parseIntSafe(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 从完整设置 / AI 子对象映射为表单
 */
export function mapSettingsToAiForm(
  settings: Partial<ExtensionSettings> | Partial<AISettings> | null | undefined,
): AiSettingsFormState {
  // 兼容直接传入 ai 子对象，或完整 ExtensionSettings
  const aiSource =
    settings && typeof settings === 'object' && 'ai' in (settings as object)
      ? ((settings as Partial<ExtensionSettings>).ai as Partial<AISettings> | undefined)
      : (settings as Partial<AISettings> | null | undefined);

  const ai = { ...DEFAULT_AI_SETTINGS, ...(aiSource || {}) };

  return {
    enabled: !!ai.enabled,
    apiUrl: String(ai.apiUrl ?? ''),
    apiKey: String(ai.apiKey ?? ''),
    selectedModel: String(ai.selectedModel ?? ''),
    temperature: parseNumber(ai.temperature, DEFAULT_AI_SETTINGS_FORM.temperature),
    maxTokens: parseIntSafe(ai.maxTokens, DEFAULT_AI_SETTINGS_FORM.maxTokens),
    streamEnabled: ai.streamEnabled !== false,
    systemPrompt: String(ai.systemPrompt ?? DEFAULT_AI_SETTINGS_FORM.systemPrompt),
    timeout: parseIntSafe(ai.timeout, DEFAULT_AI_SETTINGS_FORM.timeout),
    autoRetryEmpty: !!ai.autoRetryEmpty,
    autoRetryMax: parseIntSafe(ai.autoRetryMax, DEFAULT_AI_SETTINGS_FORM.autoRetryMax),
    errorRetryEnabled: !!ai.errorRetryEnabled,
    errorRetryMax: parseIntSafe(ai.errorRetryMax, DEFAULT_AI_SETTINGS_FORM.errorRetryMax),
  };
}

/**
 * 表单 → AISettings
 */
export function formToAiSettings(form: AiSettingsFormState): AISettings {
  return {
    enabled: form.enabled,
    apiUrl: form.apiUrl.trim(),
    apiKey: form.apiKey.trim(),
    selectedModel: form.selectedModel,
    temperature: form.temperature,
    maxTokens: form.maxTokens,
    streamEnabled: form.streamEnabled,
    systemPrompt: form.systemPrompt,
    timeout: form.timeout,
    autoRetryEmpty: form.autoRetryEmpty,
    autoRetryMax: form.autoRetryMax,
    errorRetryEnabled: form.errorRetryEnabled,
    errorRetryMax: form.errorRetryMax,
  };
}

/**
 * 对话参数子集（遗留自动保存范围）
 */
export function getConversationParamsPartial(
  form: AiSettingsFormState,
): Partial<AISettings> {
  return {
    temperature: form.temperature,
    maxTokens: form.maxTokens,
    timeout: form.timeout,
    streamEnabled: form.streamEnabled,
    systemPrompt: form.systemPrompt,
    autoRetryEmpty: form.autoRetryEmpty,
    autoRetryMax: form.autoRetryMax,
    errorRetryEnabled: form.errorRetryEnabled,
    errorRetryMax: form.errorRetryMax,
  };
}

/**
 * 合并表单回完整设置对象
 */
export function applyAiFormToSettings(
  current: ExtensionSettings,
  form: AiSettingsFormState,
): ExtensionSettings {
  return {
    ...current,
    ai: formToAiSettings(form),
  };
}

/**
 * 校验 AI 表单（对齐遗留 doValidateSettings）
 */
export function validateAiForm(form: AiSettingsFormState): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (form.enabled) {
    if (!form.apiKey.trim()) {
      errors.push('API密钥不能为空');
    }
    if (form.apiUrl.trim() && !isValidUrl(form.apiUrl.trim())) {
      errors.push('API服务地址URL格式无效');
    }
    // 遗留校验写的是 1-4000，但 HTML max 为 1000000；保存时允许更宽
    if (!Number.isFinite(form.maxTokens) || form.maxTokens < 1 || form.maxTokens > 1_000_000) {
      errors.push('最大令牌数必须在1-1000000之间');
    }
    if (!Number.isFinite(form.temperature) || form.temperature < 0 || form.temperature > 2) {
      errors.push('温度值必须在0-2之间');
    }
    if (!Number.isFinite(form.timeout) || form.timeout < 5 || form.timeout > 600) {
      errors.push('请求超时时间必须在5-600秒之间');
    }
    if (!Number.isFinite(form.autoRetryMax) || form.autoRetryMax < 0 || form.autoRetryMax > 10) {
      errors.push('自动重试次数必须在0-10之间');
    }
    if (!Number.isFinite(form.errorRetryMax) || form.errorRetryMax < 0 || form.errorRetryMax > 10) {
      errors.push('错误重试次数必须在0-10之间');
    }
    if (!form.selectedModel) {
      warnings.push('建议选择一个AI模型');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * 简单 URL 校验
 */
export function isValidUrl(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 模型选项标签
 */
export function formatModelOptionLabel(id: string, name?: string): string {
  if (name && name !== id) return `${name} (${id})`;
  return id || '未知模型';
}

/**
 * 导出用设置（剥离 apiKey）
 */
export function toExportableAiSettings(form: AiSettingsFormState): Omit<AISettings, 'apiKey'> & {
  apiKey?: never;
} {
  const full = formToAiSettings(form);
  const { apiKey: _omit, ...rest } = full;
  return rest;
}

/**
 * 合并导入的 JSON（保留当前 apiKey）
 */
export function mergeImportedAiSettings(
  current: AiSettingsFormState,
  imported: Partial<AISettings> | Record<string, unknown>,
): AiSettingsFormState {
  const keepKey = current.apiKey;
  const merged = mapSettingsToAiForm({
    ...formToAiSettings(current),
    ...(imported as Partial<AISettings>),
    apiKey: keepKey,
  });
  return merged;
}
