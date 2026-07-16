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
  readCoverViewMode,
  relativeCarouselPos,
  resolveCoverImageUrl,
  resumeMediaItems,
  subPathToFilter,
  writeCoverViewMode,
  type MediaBrowseItem,
} from './mediaBrowseModel';

describe('mediaBrowseModel', () => {
  it('filters by source and query', () => {
    const emby = filterMediaItems(MEDIA_PREVIEW_ITEMS, 'emby', '');
    expect(emby.every((i) => i.source === 'emby')).toBe(true);
    const q = filterMediaItems(MEDIA_PREVIEW_ITEMS, 'all', 'ssis');
    expect(q.some((i) => i.code.startsWith('SSIS'))).toBe(true);
  });

  it('filters by watch state', () => {
    const items: MediaBrowseItem[] = [
      { ...MEDIA_PREVIEW_ITEMS[0], watchState: 'watched' },
      { ...MEDIA_PREVIEW_ITEMS[1], watchState: 'in_progress' },
      { ...MEDIA_PREVIEW_ITEMS[2], watchState: 'in_library' },
    ];
    expect(filterMediaItems(items, 'all', '', 'watched')).toHaveLength(1);
    expect(filterMediaItems(items, 'all', '', 'in_progress')).toHaveLength(1);
    expect(filterMediaItems(items, 'all', '', 'not_watched')).toHaveLength(1);
  });

  it('orders resume items by lastPlayedAt', () => {
    const items: MediaBrowseItem[] = [
      {
        ...MEDIA_PREVIEW_ITEMS[0],
        watchState: 'in_progress',
        userData: { played: false, positionTicks: 1, runtimeTicks: 10, percent: 20, lastPlayedAt: 100 },
      },
      {
        ...MEDIA_PREVIEW_ITEMS[1],
        watchState: 'in_progress',
        userData: { played: false, positionTicks: 1, runtimeTicks: 10, percent: 40, lastPlayedAt: 200 },
      },
    ];
    const resume = resumeMediaItems(items, 8);
    expect(resume[0].code).toBe(MEDIA_PREVIEW_ITEMS[1].code);
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

  it('resolves cover image by view mode with fallbacks', () => {
    const item: MediaBrowseItem = {
      ...MEDIA_PREVIEW_ITEMS[0],
      coverImageUrl: 'http://x/primary-fallback',
      imageUrls: {
        Primary: 'http://x/primary',
        Thumb: 'http://x/thumb',
        Backdrop: 'http://x/backdrop',
      },
    };
    expect(resolveCoverImageUrl(item, 'poster')).toBe('http://x/primary');
    expect(resolveCoverImageUrl(item, 'thumb')).toBe('http://x/thumb');
    expect(resolveCoverImageUrl(item, 'backdrop')).toBe('http://x/backdrop');
    // 缺某种类型时回退
    expect(resolveCoverImageUrl({ ...item, imageUrls: { Primary: 'http://x/primary' } }, 'thumb')).toBe(
      'http://x/primary',
    );
    expect(resolveCoverImageUrl({ ...item, imageUrls: undefined }, 'poster')).toBe(
      'http://x/primary-fallback',
    );
  });

  it('persists cover view mode in localStorage', () => {
    const store: Record<string, string> = {};
    const ls = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    const original = (globalThis as any).localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
    try {
      writeCoverViewMode('poster');
      expect(readCoverViewMode()).toBe('poster');
      writeCoverViewMode('thumb');
      expect(readCoverViewMode()).toBe('thumb');
      writeCoverViewMode('backdrop');
      expect(readCoverViewMode()).toBe('backdrop');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
    }
  });
});
