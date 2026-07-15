/**
 * @file mediaBrowseModel.test.ts
 * @description 媒体库浏览模型纯函数测试
 * @module apps/dashboard/pages/media
 */
import { describe, expect, it } from 'vitest';
import {
  filterMediaItems,
  heroItems,
  MEDIA_PREVIEW_ITEMS,
  relativeCarouselPos,
  subPathToFilter,
} from './mediaBrowseModel';

describe('mediaBrowseModel', () => {
  it('filters by source and query', () => {
    const emby = filterMediaItems(MEDIA_PREVIEW_ITEMS, 'emby', '');
    expect(emby.every((i) => i.source === 'emby')).toBe(true);
    const q = filterMediaItems(MEDIA_PREVIEW_ITEMS, 'all', 'ssis');
    expect(q.some((i) => i.code.startsWith('SSIS'))).toBe(true);
  });

  it('maps hash subpath to page filter', () => {
    expect(subPathToFilter('emby')).toBe('emby');
    expect(subPathToFilter(undefined)).toBe('all');
  });

  it('computes wrapped carousel positions', () => {
    expect(relativeCarouselPos(0, 0, 5)).toBe(0);
    expect(relativeCarouselPos(4, 0, 5)).toBe(-1);
    expect(relativeCarouselPos(1, 0, 5)).toBe(1);
  });

  it('exposes a non-empty hero strip from a catalog', () => {
    expect(heroItems(MEDIA_PREVIEW_ITEMS).length).toBeGreaterThan(0);
    expect(MEDIA_PREVIEW_ITEMS.length).toBeGreaterThanOrEqual(8);
  });
});
