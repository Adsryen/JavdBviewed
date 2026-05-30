import {
  buildSearchEngineUrl,
  getSearchEngineCategory,
  getSearchEnginesForVideo,
  resolveSearchEngineIcon,
  type SearchEngineTemplate,
} from '../domain/searchEngines';
import type { DetailSearchLink } from '../domain/types';

export function buildDetailSearchLinks(
  videoId: string,
  searchEngines: unknown,
  category?: string,
): DetailSearchLink[] {
  if (!videoId) return [];

  const engines = getSearchEnginesForVideo(searchEngines, videoId, 'detail');
  return engines
    .filter((engine: SearchEngineTemplate) => String(engine.name || '').trim() && String(engine.urlTemplate || '').trim())
    .filter((engine: SearchEngineTemplate) => {
      if (!category) return true;
      return getSearchEngineCategory(engine) === category;
    })
    .map((engine: SearchEngineTemplate) => ({
      name: String(engine.name).trim(),
      url: buildSearchEngineUrl(String(engine.urlTemplate), videoId),
      icon: resolveSearchEngineIcon(engine),
      category: getSearchEngineCategory(engine),
    }));
}
