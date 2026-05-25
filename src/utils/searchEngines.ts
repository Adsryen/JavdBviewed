export interface SearchEngineTemplate {
  id?: string;
  name?: string;
  icon?: string;
  urlTemplate?: string;
  [key: string]: any;
}

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
};

const BUNDLED_SEARCH_ENGINE_IDS = new Set(Object.keys(DEFAULT_SEARCH_ENGINE_ICONS));

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

function isFallbackSearchEngineIcon(icon: unknown): boolean {
  const rawIcon = String(icon || '').trim();
  if (!rawIcon) return true;
  return rawIcon === FALLBACK_SEARCH_ENGINE_ICON || rawIcon.endsWith(`/${FALLBACK_SEARCH_ENGINE_ICON}`);
}

export function normalizeSearchEngineUrlTemplate(urlTemplate: unknown): string {
  return String(urlTemplate || '')
    .trim()
    .replace(/\{\{\s*id\s*\}\}/gi, '{{ID}}')
    .replace(/\/+$/, '')
    .toLowerCase();
}

export function buildSearchEngineUrl(urlTemplate: string, videoId: string): string {
  return String(urlTemplate || '').replace(/\{\{\s*id\s*\}\}/gi, encodeURIComponent(videoId));
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
