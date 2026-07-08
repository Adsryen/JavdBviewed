/**
 * @file listSorting.ts
 * @description 列表排序增强纯逻辑
 * @module features/listEnhancement
 */
import { parseRatingStatsText } from './popularityEffects';
import type {
  ListSortingAppendStrategy,
  ListSortingConfig,
  ListSortingPositionStrategy,
  ListSortMode,
} from '../domain/config';

export type {
  ListSortingAppendStrategy,
  ListSortingConfig,
  ListSortingPositionStrategy,
  ListSortMode,
} from '../domain/config';

const ORIGINAL_INDEX_ATTR = 'data-x-list-sort-original-index';

export interface ListSortableItem {
  element: HTMLElement;
  originalIndex: number;
  score: number | null;
  ratingCount: number | null;
}

export interface NativeSortCapabilities {
  hasNativeToolbar: boolean;
  activeLabel: string | null;
  hasRatingSort: boolean;
  hasRatingCountSort: boolean;
}

type SortField = 'score' | 'ratingCount';
type SortDirection = 'desc' | 'asc';

interface SortCriterion {
  field: SortField;
  direction: SortDirection;
}

function parseOriginalIndex(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readRatingText(item: HTMLElement): string {
  return item.querySelector('.score .value')?.textContent || item.querySelector('.score')?.textContent || '';
}

export function readSortableItems(root: ParentNode): ListSortableItem[] {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('.movie-list .item'));
  const existingIndexes = elements
    .map(element => parseOriginalIndex(element.getAttribute(ORIGINAL_INDEX_ATTR)))
    .filter((index): index is number => index !== null);
  let nextOriginalIndex = existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 0;

  return elements.map((element) => {
    let originalIndex = parseOriginalIndex(element.getAttribute(ORIGINAL_INDEX_ATTR));
    if (originalIndex === null) {
      originalIndex = nextOriginalIndex;
      nextOriginalIndex += 1;
      element.setAttribute(ORIGINAL_INDEX_ATTR, String(originalIndex));
    }

    const stats = parseRatingStatsText(readRatingText(element));
    return {
      element,
      originalIndex,
      score: stats.score,
      ratingCount: stats.count,
    };
  });
}

function compareNullableNumberDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function compareNullableNumberAsc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function getSortCriteria(mode: ListSortMode): SortCriterion[] {
  if (mode === 'rating-desc') return [{ field: 'score', direction: 'desc' }];
  if (mode === 'rating-asc') return [{ field: 'score', direction: 'asc' }];
  if (mode === 'rating-count-desc') return [{ field: 'ratingCount', direction: 'desc' }];
  if (mode === 'rating-count-asc') return [{ field: 'ratingCount', direction: 'asc' }];
  if (mode === 'rating-desc-count-desc') {
    return [
      { field: 'score', direction: 'desc' },
      { field: 'ratingCount', direction: 'desc' },
    ];
  }
  if (mode === 'rating-desc-count-asc') {
    return [
      { field: 'score', direction: 'desc' },
      { field: 'ratingCount', direction: 'asc' },
    ];
  }
  if (mode === 'rating-asc-count-desc') {
    return [
      { field: 'score', direction: 'asc' },
      { field: 'ratingCount', direction: 'desc' },
    ];
  }
  if (mode === 'rating-asc-count-asc') {
    return [
      { field: 'score', direction: 'asc' },
      { field: 'ratingCount', direction: 'asc' },
    ];
  }
  if (mode === 'rating-count-desc-score-desc') {
    return [
      { field: 'ratingCount', direction: 'desc' },
      { field: 'score', direction: 'desc' },
    ];
  }
  if (mode === 'rating-count-desc-score-asc') {
    return [
      { field: 'ratingCount', direction: 'desc' },
      { field: 'score', direction: 'asc' },
    ];
  }
  if (mode === 'rating-count-asc-score-desc') {
    return [
      { field: 'ratingCount', direction: 'asc' },
      { field: 'score', direction: 'desc' },
    ];
  }
  if (mode === 'rating-count-asc-score-asc') {
    return [
      { field: 'ratingCount', direction: 'asc' },
      { field: 'score', direction: 'asc' },
    ];
  }
  return [];
}

function compareByCriterion(a: ListSortableItem, b: ListSortableItem, criterion: SortCriterion): number {
  const aValue = criterion.field === 'score' ? a.score : a.ratingCount;
  const bValue = criterion.field === 'score' ? b.score : b.ratingCount;
  return criterion.direction === 'desc'
    ? compareNullableNumberDesc(aValue, bValue)
    : compareNullableNumberAsc(aValue, bValue);
}

export function sortSortableItems(items: ListSortableItem[], mode: ListSortMode): ListSortableItem[] {
  const sorted = [...items];
  const criteria = getSortCriteria(mode);
  sorted.sort((a, b) => {
    for (const criterion of criteria) {
      const compared = compareByCriterion(a, b, criterion);
      if (compared !== 0) return compared;
    }

    return a.originalIndex - b.originalIndex;
  });
  return sorted;
}

function normalizeSortText(value: string | null | undefined): string {
  return String(value || '').replace(/\s+/g, '');
}

export function detectNativeSortCapabilities(root: ParentNode): NativeSortCapabilities {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.toolbar .buttons.has-addons a, .buttons.has-addons a'));
  let activeLabel: string | null = null;
  let hasRatingSort = false;
  let hasRatingCountSort = false;

  links.forEach((link) => {
    const label = normalizeSortText(link.textContent);
    const href = link.getAttribute('href') || '';

    if (activeLabel === null && link.classList.contains('is-selected')) {
      activeLabel = label || null;
    }

    if (label.includes('评分') || label.includes('評分') || href.includes('sort_type=1')) {
      hasRatingSort = true;
    }

    if (label.includes('评价人数') || label.includes('評價人數')) {
      hasRatingCountSort = true;
    }
  });

  return {
    hasNativeToolbar: links.length > 0,
    activeLabel,
    hasRatingSort,
    hasRatingCountSort,
  };
}

export function getOriginalIndexAttributeName(): string {
  return ORIGINAL_INDEX_ATTR;
}
