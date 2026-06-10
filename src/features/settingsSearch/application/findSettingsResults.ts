import type { SettingsSearchItem, SettingsSearchResult } from '../domain/types';
import { expandSettingsSearchQuery, normalizeSettingsSearchText } from '../domain/aliases';

export function findSettingsResults(index: SettingsSearchItem[], query: string, limit = 12): SettingsSearchResult[] {
  const normalizedQuery = normalizeSettingsSearchText(query);
  const queryTerms = expandSettingsSearchQuery(query);
  if (queryTerms.length === 0) return [];

  const sorted = index
    .map(item => {
      const title = normalizeSettingsSearchText(item.title);
      const pageTitle = normalizeSettingsSearchText(item.pageTitle);
      const sectionTitle = normalizeSettingsSearchText(item.sectionTitle);
      const targetSelector = normalizeSettingsSearchText(item.targetSelector);
      const body = normalizeSettingsSearchText(item.searchableText);

      let score = 0;
      if (title === normalizedQuery) score += 160;
      if (title.includes(normalizedQuery)) score += 110;
      if (targetSelector.includes(normalizedQuery)) score += 95;

      for (const term of queryTerms) {
        if (!term) continue;
        if (title === term) score += 120;
        if (title.includes(term)) score += 80;
        if (sectionTitle.includes(term)) score += 45;
        if (pageTitle.includes(term)) score += 30;
        if (body.includes(term)) score += 15;
      }

      return { ...item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.pageTitle.localeCompare(b.pageTitle, 'zh-Hans') || a.title.localeCompare(b.title, 'zh-Hans'));

  const deduped: SettingsSearchResult[] = [];
  const seenTargets = new Set<string>();
  for (const result of sorted) {
    const key = `${result.pageId}:${result.targetSelector}`;
    if (seenTargets.has(key)) continue;
    seenTargets.add(key);
    deduped.push(result);
    if (deduped.length >= limit) break;
  }

  return deduped;
}
