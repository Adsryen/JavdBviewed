import type { SettingsSearchItem, SettingsSearchPageSource } from '../domain/types';
import { DEFAULT_ONLINE_AVAILABILITY_SITES } from '../../onlineAvailability';
import { DEFAULT_SETTINGS } from '../../../utils/config';

type DefaultSearchEngine = {
  id?: string;
  name?: string;
  category?: string;
};

type ExtraItemDefinition = {
  title: string;
  sectionTitle: string;
  targetSelector: string;
  description?: string;
  keywords?: string[];
};

const SEARCH_ENGINE_KEYWORDS_BY_ID: Record<string, string[]> = {
  javdb: ['番号搜索'],
  javbus: ['外部搜索'],
  sehuatang: ['搜索引擎'],
  btsow: ['磁力', '磁链'],
  javlib: ['javlibrary'],
  jable: ['在线可看', '资源'],
  missav: ['在线可看', '资源'],
  '123av': ['在线可看', '资源'],
  google: ['搜索'],
  dmm: ['fanza', '资源'],
  sukebei: ['磁力', '磁链'],
  subtitlecat: ['字幕'],
  'xunlei-subtitle': ['xunlei', '字幕'],
  fc2ppvdb: ['fc2', '破解'],
  fc2db: ['fc2'],
};

function createSearchEngineItems(): ExtraItemDefinition[] {
  const defaultSearchEngines = (DEFAULT_SETTINGS.searchEngines || []) as DefaultSearchEngine[];

  return defaultSearchEngines
    .filter(engine => engine?.name)
    .map(engine => {
      const id = String(engine.id || '').trim().toLowerCase();
      return {
        title: String(engine.name),
        sectionTitle: '搜索引擎列表',
        targetSelector: id
          ? createDataTargetSelector(`search-engine:${id}`)
          : '#search-engine-list',
        keywords: [
          id,
          String(engine.category || ''),
          ...(SEARCH_ENGINE_KEYWORDS_BY_ID[id] || []),
        ].filter(Boolean),
      };
    });
}

function createOnlineAvailabilityItems(): ExtraItemDefinition[] {
  return DEFAULT_ONLINE_AVAILABILITY_SITES.map(site => ({
    title: site.name,
    sectionTitle: '在线可看站点',
    targetSelector: createDataTargetSelector(`online-availability-site:${site.key}`),
    keywords: [
      site.key,
      '在线可看',
      site.key === 'fanza' ? 'dmm' : '',
    ].filter(Boolean),
  }));
}

const MAGNET_CONCURRENCY_ITEMS: ExtraItemDefinition[] = [
  {
    title: '页面内并发',
    sectionTitle: '并发与限流',
    targetSelector: createDataTargetSelector('magnet-concurrency:magnetPageMaxConcurrentRequests'),
    keywords: ['磁力', '并发', '限流', '页面请求'],
  },
  {
    title: '后台全局并发',
    sectionTitle: '并发与限流',
    targetSelector: createDataTargetSelector('magnet-concurrency:magnetBgGlobalMaxConcurrent'),
    keywords: ['磁力', '并发', '限流', '后台'],
  },
  {
    title: '每域并发',
    sectionTitle: '并发与限流',
    targetSelector: createDataTargetSelector('magnet-concurrency:magnetBgPerHostMaxConcurrent'),
    keywords: ['磁力', '并发', '限流', '域名'],
  },
  {
    title: '每域速率',
    sectionTitle: '并发与限流',
    targetSelector: createDataTargetSelector('magnet-concurrency:magnetBgPerHostRateLimitPerMin'),
    keywords: ['磁力', '速率', '限流', '域名'],
  },
];

function createDataTargetSelector(value: string): string {
  return `[data-settings-search-target="${escapeAttributeSelectorValue(value)}"]`;
}

function escapeAttributeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function createSettingsSearchExtraItems(source: SettingsSearchPageSource): SettingsSearchItem[] {
  const definitions = getExtraItemDefinitions(source.pageId);
  return definitions.map((definition) => {
    const searchableText = [
      definition.title,
      definition.description || '',
      definition.sectionTitle,
      ...(definition.keywords || []),
      source.pageTitle,
      source.pageId,
      ...(source.keywords || []),
    ].join(' ');

    return {
      id: `${source.pageId}:${definition.targetSelector}:extra:${definition.title}`,
      pageId: source.pageId,
      pageTitle: source.pageTitle,
      hash: source.hash,
      title: definition.title,
      description: definition.description || '',
      sectionTitle: definition.sectionTitle,
      targetSelector: definition.targetSelector,
      searchableText,
    };
  });
}

function getExtraItemDefinitions(pageId: string): ExtraItemDefinition[] {
  if (pageId === 'search-engine-settings') return createSearchEngineItems();
  if (pageId === 'enhancement-settings') {
    return [
      ...createOnlineAvailabilityItems(),
      ...MAGNET_CONCURRENCY_ITEMS,
    ];
  }
  return [];
}
