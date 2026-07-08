/**
 * @file magnetSourceFilterControls.ts
 * @description Magnet source filter controls DOM helper
 * @module features/magnets
 */
import { getResultSources } from '../application/resultMerge';
import type { MagnetResult } from '../domain/types';

export interface MagnetSourceFilterOption {
  key: string;
  label: string;
  count: number;
}

export function normalizeMagnetSourceFilter(source: string): string {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function filterMagnetResultsBySource(results: MagnetResult[], activeFilter: string): MagnetResult[] {
  if (activeFilter === 'all') return results;
  return results.filter((result) => getResultSources(result)
    .some(source => normalizeMagnetSourceFilter(source) === activeFilter));
}

export function getMagnetSourceFilterOptions(results: MagnetResult[]): MagnetSourceFilterOption[] {
  const counts = new Map<string, { label: string; count: number }>();
  results.forEach((result) => {
    getResultSources(result).forEach((source) => {
      const key = normalizeMagnetSourceFilter(source);
      const current = counts.get(key);
      counts.set(key, { label: source, count: (current?.count || 0) + 1 });
    });
  });

  return [
    { key: 'all', label: '\u5168\u90e8', count: results.length },
    ...Array.from(counts.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  ];
}

export function renderMagnetSourceFilterBar(
  container: Element,
  options: MagnetSourceFilterOption[],
  activeFilter: string,
  onFilterChange: (filter: string) => void,
): void {
  if (options.length <= 2) return;

  const bar = document.createElement('div');
  bar.className = 'jdb-magnet-source-filter-bar';

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `jdb-magnet-source-filter${option.key === activeFilter ? ' is-active' : ''}`;
    button.dataset.jdbMagnetSourceFilter = option.key;
    button.textContent = `${option.label} ${option.count}`;
    button.addEventListener('click', () => {
      if (activeFilter === option.key) return;
      onFilterChange(option.key);
    });
    bar.appendChild(button);
  });

  container.appendChild(bar);
}
