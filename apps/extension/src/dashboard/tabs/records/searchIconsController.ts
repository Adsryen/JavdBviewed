import type { SearchEngineTemplate } from '../../../features/externalSearch/domain/searchEngines';
import {
  buildSearchEngineUrl,
  getSearchEnginesForVideo,
  resolveSearchEngineIcon,
} from '../../../features/externalSearch/domain/searchEngines';

export interface CreateRecordsSearchIconsContainerOptions {
  engines: unknown;
  videoId: string;
  fallbackIconUrl: string;
  buildUrl?: (urlTemplate: string, videoId: string) => string;
  resolveIcon?: (engine: SearchEngineTemplate) => string;
  getEnginesForVideo?: (
    engines: unknown,
    videoId: string,
    context: 'records',
  ) => SearchEngineTemplate[];
}

type RenderableSearchEngineTemplate = SearchEngineTemplate & {
  name: string;
  urlTemplate: string;
};

function getRenderableSearchEngineCandidates(engines: unknown): RenderableSearchEngineTemplate[] {
  if (!Array.isArray(engines)) return [];

  return engines.filter((engine): engine is RenderableSearchEngineTemplate => {
    if (!engine || typeof engine !== 'object') {
      console.warn('[Records] 无效的搜索引擎配置:', engine);
      return false;
    }

    const candidate = engine as SearchEngineTemplate;
    if (!candidate.urlTemplate || !candidate.name) {
      console.warn('[Records] 无效的搜索引擎配置:', engine);
      return false;
    }

    return true;
  });
}

export function createRecordsSearchIconsContainer(
  options: CreateRecordsSearchIconsContainerOptions,
): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'video-search-icons';

  const buildUrl = options.buildUrl || buildSearchEngineUrl;
  const resolveIcon = options.resolveIcon || resolveSearchEngineIcon;
  const getEnginesForVideo = options.getEnginesForVideo || getSearchEnginesForVideo;
  const engines = getEnginesForVideo(
    getRenderableSearchEngineCandidates(options.engines),
    options.videoId,
    'records',
  );

  engines.forEach((engine) => {
    try {
      const urlTemplate = String(engine.urlTemplate || '').trim();
      const name = String(engine.name || '').trim();
      if (!urlTemplate || !name) {
        console.warn('[Records] 无效的搜索引擎配置:', engine);
        return;
      }

      const link = document.createElement('a');
      link.href = buildUrl(urlTemplate, options.videoId);
      link.target = '_blank';
      link.title = `Search on ${name}`;

      const image = document.createElement('img');
      image.src = resolveIcon(engine);
      image.alt = name;
      image.onerror = () => {
        image.src = options.fallbackIconUrl;
      };

      link.appendChild(image);
      container.appendChild(link);
    } catch (error) {
      console.error('[Records] 创建搜索引擎图标时出错:', error, engine);
    }
  });

  return container;
}
