export interface SearchEngineTemplate {
  id?: string;
  name?: string;
  icon?: string;
  urlTemplate?: string;
  enabled?: boolean;
  category?: SearchEngineCategory | string;
  match?: 'all' | 'fc2' | 'jav' | string;
  context?: 'all' | 'detail' | 'records' | string;
  contexts?: Array<'all' | 'detail' | 'records' | string>;
  [key: string]: any;
}

export type SearchEngineCategory = 'search' | 'resource' | 'subtitle';
export type SearchEngineCategoryFilter = SearchEngineCategory | 'all' | string;

export interface SearchEngineDuplicate {
  kept: SearchEngineTemplate;
  removed: SearchEngineTemplate;
  reason: 'id' | 'urlTemplate';
  keptName: string;
  duplicateName: string;
}

export interface DedupeSearchEnginesResult {
  engines: SearchEngineTemplate[];
  duplicates: SearchEngineDuplicate[];
}

const FALLBACK_SEARCH_ENGINE_ICON = 'assets/alternate-search.png';

const DEFAULT_SEARCH_ENGINE_ICONS: Record<string, string> = {
  javdb: 'assets/javdb.ico',
  javbus: 'assets/javbus.ico',
  sehuatang: 'assets/sehuatang.ico',
  btsow: 'assets/btsow.png',
  javlib: 'assets/javlibrary.ico',
  jable: 'assets/jable.ico',
  missav: 'assets/missav.ico',
  '123av': 'assets/123av.png',
  google: 'assets/google.ico',
  dmm: 'assets/dmm.ico',
  sukebei: 'assets/sukebei.png',
  subtitlecat: 'assets/subtitlecat.ico',
  'xunlei-subtitle': 'assets/xunlei.png',
  fc2ppvdb: 'assets/fc2ppvdb.ico',
  fc2db: 'assets/fc2db.png',
};

const BUNDLED_SEARCH_ENGINE_IDS = new Set(Object.keys(DEFAULT_SEARCH_ENGINE_ICONS));

const DEFAULT_SEARCH_ENGINE_CATEGORIES: Record<string, SearchEngineCategory> = {
  javdb: 'search',
  javbus: 'search',
  sehuatang: 'search',
  btsow: 'search',
  javlib: 'search',
  google: 'search',
  jable: 'resource',
  missav: 'resource',
  '123av': 'resource',
  dmm: 'resource',
  sukebei: 'resource',
  fc2ppvdb: 'resource',
  fc2db: 'resource',
  subtitlecat: 'subtitle',
  'xunlei-subtitle': 'subtitle',
};

export const SEARCH_ENGINE_CATEGORY_OPTIONS: Array<{ value: SearchEngineCategory; label: string }> = [
  { value: 'search', label: '搜索' },
  { value: 'resource', label: '资源站' },
  { value: 'subtitle', label: '字幕' },
];

export function isBundledSearchEngine(engineOrId: SearchEngineTemplate | string | undefined | null): boolean {
  const id = typeof engineOrId === 'string'
    ? engineOrId
    : engineOrId?.id;
  return BUNDLED_SEARCH_ENGINE_IDS.has(String(id || '').trim().toLowerCase());
}

function getDefaultSearchEngineIcon(engine: SearchEngineTemplate | undefined | null): string {
  const id = String(engine?.id || '').trim().toLowerCase();
  return id ? DEFAULT_SEARCH_ENGINE_ICONS[id] || '' : '';
}

function getDefaultSearchEngineCategory(engine: SearchEngineTemplate | undefined | null): SearchEngineCategory | '' {
  const id = String(engine?.id || '').trim().toLowerCase();
  return id ? DEFAULT_SEARCH_ENGINE_CATEGORIES[id] || '' : '';
}

function isFallbackSearchEngineIcon(icon: unknown): boolean {
  const rawIcon = String(icon || '').trim();
  if (!rawIcon) return true;
  return rawIcon === FALLBACK_SEARCH_ENGINE_ICON || rawIcon.endsWith(`/${FALLBACK_SEARCH_ENGINE_ICON}`);
}

export function normalizeSearchEngineUrlTemplate(urlTemplate: unknown): string {
  return String(urlTemplate || '')
    .trim()
    .replace(/\{\{\s*fc2_id\s*\}\}/gi, '{{FC2_ID}}')
    .replace(/\{\{\s*id\s*\}\}/gi, '{{ID}}')
    .replace(/\/+$/, '')
    .toLowerCase();
}

export function buildSearchEngineUrl(urlTemplate: string, videoId: string): string {
  const fc2Id = extractFc2NumericId(videoId) || '';
  return String(urlTemplate || '')
    .replace(/\{\{\s*fc2_id\s*\}\}/gi, encodeURIComponent(fc2Id))
    .replace(/\{\{\s*id\s*\}\}/gi, encodeURIComponent(videoId));
}

export function extractFc2NumericId(videoId: string): string | null {
  const raw = String(videoId || '').trim();
  if (!raw) return null;

  const match = raw
    .toUpperCase()
    .replace(/[\s_]+/g, '-')
    .match(/^FC2-?(?:PPV-?)?(\d{5,10})$/);

  return match?.[1] || null;
}

export function isFc2VideoId(videoId: string): boolean {
  return extractFc2NumericId(videoId) !== null;
}

export function getSearchEngineCategory(engine: SearchEngineTemplate | undefined | null): SearchEngineCategory {
  const rawCategory = String(engine?.category || '').trim().toLowerCase();
  if (rawCategory === 'resource' || rawCategory === 'subtitle' || rawCategory === 'search') {
    return rawCategory;
  }
  return getDefaultSearchEngineCategory(engine) || 'search';
}

export function getSearchEngineCategoryLabel(category: SearchEngineCategoryFilter): string {
  const normalized = String(category || '').trim().toLowerCase();
  if (normalized === 'all') return '全部';
  return SEARCH_ENGINE_CATEGORY_OPTIONS.find(item => item.value === normalized)?.label || '搜索';
}

export function filterSearchEnginesByCategory<T extends SearchEngineTemplate>(
  searchEngines: T[],
  category: SearchEngineCategoryFilter,
): T[] {
  const normalized = String(category || 'all').trim().toLowerCase();
  if (!normalized || normalized === 'all') return searchEngines;
  return searchEngines.filter(engine => getSearchEngineCategory(engine) === normalized);
}

function supportsSearchEngineContext(
  engine: SearchEngineTemplate,
  context: 'detail' | 'records' | 'all',
): boolean {
  const rawContexts = Array.isArray(engine.contexts)
    ? engine.contexts
    : engine.context
      ? [engine.context]
      : [];

  if (rawContexts.length === 0 || context === 'all') return true;

  const contexts = rawContexts.map(item => String(item || '').trim().toLowerCase());
  return contexts.includes('all') || contexts.includes(context);
}

function matchesSearchEngineVideo(
  engine: SearchEngineTemplate,
  videoId: string,
): boolean {
  const match = String(engine.match || 'all').trim().toLowerCase();
  if (!match || match === 'all') return true;
  if (match === 'fc2') return isFc2VideoId(videoId);
  if (match === 'jav') return !isFc2VideoId(videoId);
  return true;
}

export function isSearchEngineEnabled(engine: SearchEngineTemplate | undefined | null): boolean {
  return engine?.enabled !== false;
}

export function getSearchEnginesForVideo(
  searchEngines: unknown,
  videoId: string,
  context: 'detail' | 'records' | 'all' = 'all',
): SearchEngineTemplate[] {
  const { engines } = dedupeSearchEngines(searchEngines);
  return engines.filter((engine) =>
    isSearchEngineEnabled(engine)
    && supportsSearchEngineContext(engine, context)
    && matchesSearchEngineVideo(engine, videoId),
  );
}

function resolveExtensionAssetUrl(path: string): string {
  if (path.startsWith('assets/') && typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }
  return path;
}

export function resolveSearchEngineIcon(engine: SearchEngineTemplate | undefined | null): string {
  const defaultIcon = getDefaultSearchEngineIcon(engine);
  const icon = isFallbackSearchEngineIcon(engine?.icon) && defaultIcon
    ? defaultIcon
    : String(engine?.icon || '').trim() || defaultIcon || FALLBACK_SEARCH_ENGINE_ICON;
  return resolveExtensionAssetUrl(icon);
}

export function migrateSearchEngineTemplateIcon(engine: SearchEngineTemplate): SearchEngineTemplate {
  const defaultIcon = getDefaultSearchEngineIcon(engine);
  if (!defaultIcon || !isFallbackSearchEngineIcon(engine.icon)) {
    return engine;
  }
  return {
    ...engine,
    icon: defaultIcon,
  };
}

export function dedupeSearchEngines(searchEngines: unknown): DedupeSearchEnginesResult {
  const engines = Array.isArray(searchEngines) ? searchEngines : [];
  const seenIds = new Map<string, SearchEngineTemplate>();
  const seenUrls = new Map<string, SearchEngineTemplate>();
  const unique: SearchEngineTemplate[] = [];
  const duplicates: SearchEngineDuplicate[] = [];

  engines.forEach((rawEngine) => {
    if (!rawEngine || typeof rawEngine !== 'object') return;

    const engine = rawEngine as SearchEngineTemplate;
    const id = String(engine.id || '').trim().toLowerCase();
    const urlKey = normalizeSearchEngineUrlTemplate(engine.urlTemplate);

    if (id && seenIds.has(id)) {
      const kept = seenIds.get(id)!;
      duplicates.push({
        kept,
        removed: engine,
        reason: 'id',
        keptName: String(kept.name || kept.id || '已存在项'),
        duplicateName: String(engine.name || engine.id || '重复项'),
      });
      return;
    }

    if (urlKey && seenUrls.has(urlKey)) {
      const kept = seenUrls.get(urlKey)!;
      duplicates.push({
        kept,
        removed: engine,
        reason: 'urlTemplate',
        keptName: String(kept.name || kept.id || '已存在项'),
        duplicateName: String(engine.name || engine.id || '重复项'),
      });
      return;
    }

    unique.push(engine);
    if (id) seenIds.set(id, engine);
    if (urlKey) seenUrls.set(urlKey, engine);
  });

  return { engines: unique, duplicates };
}
