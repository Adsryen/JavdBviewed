/**
 * @file searchEngineSettingsModel.ts
 * @description 搜索引擎设置纯数据模型：过滤、校验、增删改、去重
 * @module apps/dashboard/pages/settings/searchEngine
 */
import {
  dedupeSearchEngines,
  filterSearchEnginesByCategory,
  getSearchEngineCategory,
  isBundledSearchEngine,
  resolveSearchEngineIcon,
  SEARCH_ENGINE_CATEGORY_OPTIONS,
  type SearchEngineCategory,
  type SearchEngineTemplate,
} from '../../../../../features/externalSearch/domain/searchEngines';
import type { ExtensionSettings } from '../../../../../types';

export type SearchEngineRow = SearchEngineTemplate & {
  id: string;
  name: string;
  urlTemplate: string;
  icon: string;
  enabled: boolean;
  category: SearchEngineCategory | string;
};

export type SearchEngineFormState = {
  engines: SearchEngineRow[];
  categoryFilter: string;
};

export const DEFAULT_SEARCH_ENGINE_FORM: SearchEngineFormState = {
  engines: [],
  categoryFilter: 'all',
};

export const SEARCH_ENGINE_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  ...SEARCH_ENGINE_CATEGORY_OPTIONS,
] as const;

export { SEARCH_ENGINE_CATEGORY_OPTIONS, isBundledSearchEngine, resolveSearchEngineIcon, getSearchEngineCategory };

const URL_PLACEHOLDER_RE = /\{\{\s*(?:id|fc2_id)\s*\}\}/i;

/**
 * 规范化引擎列表
 */
export function normalizeEngines(raw: unknown): SearchEngineRow[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .filter((item): item is SearchEngineTemplate => !!item && typeof item === 'object')
    .filter((engine) => {
      if (engine.urlTemplate && String(engine.urlTemplate).includes('example.com')) return false;
      if (engine.icon && String(engine.icon).includes('google.com/s2/favicons')) return false;
      return true;
    })
    .map((engine, index) => ({
      ...engine,
      id: String(engine.id || `engine-${index}`),
      name: String(engine.name || ''),
      urlTemplate: String(engine.urlTemplate || ''),
      icon: String(engine.icon || ''),
      enabled: engine.enabled !== false,
      category: getSearchEngineCategory(engine),
    }));
}

/**
 * 从设置映射表单
 */
export function mapSettingsToSearchEngineForm(
  settings: Partial<ExtensionSettings> | null | undefined,
  categoryFilter = 'all',
): SearchEngineFormState {
  return {
    engines: normalizeEngines((settings as any)?.searchEngines),
    categoryFilter,
  };
}

/**
 * 合并表单回设置
 */
export function applySearchEngineFormToSettings(
  current: ExtensionSettings,
  form: SearchEngineFormState,
): ExtensionSettings {
  const { engines } = dedupeSearchEngines(form.engines);
  return {
    ...current,
    searchEngines: engines,
  };
}

/**
 * 按分类过滤可见行
 */
export function getVisibleEngines(form: SearchEngineFormState): SearchEngineRow[] {
  return filterSearchEnginesByCategory(form.engines, form.categoryFilter) as SearchEngineRow[];
}

/**
 * 校验引擎列表
 */
export function validateSearchEngines(engines: SearchEngineRow[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  engines.forEach((engine) => {
    const name = engine.name || '未命名';
    if (engine.name && !engine.urlTemplate) {
      errors.push(`搜索引擎 "${name}" 缺少URL模板`);
    }
    if (engine.urlTemplate && !URL_PLACEHOLDER_RE.test(engine.urlTemplate)) {
      warnings.push(`搜索引擎 "${name}" 的URL模板中缺少 {{ID}} 或 {{FC2_ID}} 占位符`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * 校验新增引擎输入
 */
export function validateNewSearchEngine(input: {
  name: string;
  urlTemplate: string;
}): { ok: boolean; message?: string } {
  const name = input.name.trim();
  const urlTemplate = input.urlTemplate.trim();
  if (!name || !urlTemplate) {
    return { ok: false, message: '请填写搜索引擎名称和 URL 模板' };
  }
  if (!URL_PLACEHOLDER_RE.test(urlTemplate)) {
    return { ok: false, message: 'URL 模板需要包含 {{ID}} 或 {{FC2_ID}} 占位符' };
  }
  return { ok: true };
}

/**
 * 更新某一引擎字段（内置引擎仅允许改 enabled）
 */
export function updateEngineAt(
  engines: SearchEngineRow[],
  index: number,
  patch: Partial<SearchEngineRow>,
): SearchEngineRow[] {
  if (index < 0 || index >= engines.length) return engines;
  const current = engines[index];
  const next = [...engines];
  if (isBundledSearchEngine(current)) {
    next[index] = {
      ...current,
      enabled: patch.enabled !== undefined ? patch.enabled !== false : current.enabled,
    };
    return next;
  }
  next[index] = {
    ...current,
    ...patch,
    id: current.id,
    category: patch.category
      ? getSearchEngineCategory({ ...current, category: patch.category })
      : current.category,
  };
  return next;
}

/**
 * 删除引擎（内置不可删）
 */
export function removeEngineAt(
  engines: SearchEngineRow[],
  index: number,
): { engines: SearchEngineRow[]; blocked: boolean } {
  if (index < 0 || index >= engines.length) return { engines, blocked: false };
  if (isBundledSearchEngine(engines[index])) {
    return { engines, blocked: true };
  }
  const next = [...engines];
  next.splice(index, 1);
  return { engines: next, blocked: false };
}

/**
 * 新增引擎并去重
 */
export function addSearchEngine(
  engines: SearchEngineRow[],
  input: {
    name: string;
    urlTemplate: string;
    icon?: string;
    category?: string;
  },
): {
  engines: SearchEngineRow[];
  duplicate?: { keptName: string; duplicateName: string };
} {
  const newEngine: SearchEngineRow = {
    id: `engine-${Date.now()}`,
    name: input.name.trim(),
    urlTemplate: input.urlTemplate.trim(),
    icon: (input.icon || 'assets/alternate-search.png').trim() || 'assets/alternate-search.png',
    enabled: true,
    category: input.category || 'search',
  };

  const deduped = dedupeSearchEngines([...engines, newEngine]);
  const duplicate = deduped.duplicates.find((item) => item.removed === newEngine);
  if (duplicate) {
    return {
      engines: engines,
      duplicate: {
        keptName: duplicate.keptName,
        duplicateName: duplicate.duplicateName,
      },
    };
  }

  return {
    engines: normalizeEngines(deduped.engines),
  };
}

/**
 * 对当前列表去重
 */
export function dedupeEngineList(engines: SearchEngineRow[]): {
  engines: SearchEngineRow[];
  duplicates: { keptName: string; duplicateName: string }[];
} {
  const result = dedupeSearchEngines(engines);
  return {
    engines: normalizeEngines(result.engines),
    duplicates: result.duplicates.map((d) => ({
      keptName: d.keptName,
      duplicateName: d.duplicateName,
    })),
  };
}
