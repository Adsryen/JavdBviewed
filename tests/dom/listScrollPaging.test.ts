import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appendFetchedMovieItems,
  buildScrollPagingNextPageUrl,
  createListScrollPagingController,
  createScrollLoadingIndicator,
  removeScrollLoadingIndicator,
  resolveScrollPagingPageInfo,
  setScrollLoadingIndicatorVisible,
  shouldTriggerScrollPaging,
} from '../../src/features/listEnhancement/application/scrollPaging';

describe('list scroll paging helpers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('resolves page info from super ranking state first', () => {
    const link = document.createElement('a');
    link.className = 'pagination-link';
    link.href = 'https://javdb.com/?page=9';
    document.body.appendChild(link);

    expect(resolveScrollPagingPageInfo({
      superRankingPageInfo: { page: 2, maxPage: 5 },
      search: '?page=1',
      paginationLinks: document.querySelectorAll('.pagination-link'),
    })).toEqual({ currentPage: 2, maxPage: 5 });
  });

  it('parses current and max page from URL and pagination links', () => {
    document.body.innerHTML = `
      <a class="pagination-link" href="https://javdb.com/?page=2">2</a>
      <a class="pagination-link" href="https://javdb.com/?page=8">8</a>
    `;

    expect(resolveScrollPagingPageInfo({
      superRankingPageInfo: null,
      search: '?page=3',
      paginationLinks: document.querySelectorAll('.pagination-link'),
    })).toEqual({ currentPage: 3, maxPage: 8 });
  });

  it('detects whether scroll position should load next page', () => {
    expect(shouldTriggerScrollPaging({
      isLoadingNextPage: false,
      currentPage: 2,
      maxPage: 4,
      scrollTop: 800,
      windowHeight: 600,
      documentHeight: 1500,
      threshold: 120,
    })).toBe(true);

    expect(shouldTriggerScrollPaging({
      isLoadingNextPage: false,
      currentPage: 4,
      maxPage: 4,
      scrollTop: 800,
      windowHeight: 600,
      documentHeight: 1500,
      threshold: 120,
    })).toBe(false);
  });

  it('updates next page url and controls the loading indicator lifecycle', () => {
    expect(buildScrollPagingNextPageUrl('https://javdb.com/search?q=abc&page=2', 3))
      .toBe('https://javdb.com/search?q=abc&page=3');

    const indicator = createScrollLoadingIndicator(document);
    expect(indicator.id).toBe('scroll-loading-indicator');
    expect(indicator.style.display).toBe('none');

    setScrollLoadingIndicatorVisible(document, true);
    expect(indicator.style.display).toBe('flex');

    removeScrollLoadingIndicator(document);
    expect(document.getElementById('scroll-loading-indicator')).toBeNull();
  });

  it('appends fetched movie items into current movie list', () => {
    document.body.innerHTML = '<div class="movie-list"><div class="item">old</div></div>';

    const appended = appendFetchedMovieItems(document, `
      <div class="movie-list">
        <div class="item">new-a</div>
        <div class="item">new-b</div>
      </div>
    `);

    expect(appended).toBe(2);
    expect(Array.from(document.querySelectorAll('.movie-list .item')).map(el => el.textContent?.trim()))
      .toEqual(['old', 'new-a', 'new-b']);
  });

  it('loads a fetched next page through the controller', async () => {
    document.body.innerHTML = `
      <div class="movie-list"></div>
      <a class="pagination-link" href="https://javdb.com/search?q=abc&page=2">2</a>
    `;
    const pushState = vi.fn();
    const processVisibleItems = vi.fn();
    const clearActorCaches = vi.fn();

    const controller = createListScrollPagingController({
      document,
      window,
      threshold: 200,
      logger: vi.fn(),
      getSuperRankingPageInfo: () => null,
      appendSuperRankingPage: async () => ({ handled: false, appended: 0, page: 0, maxPage: 0 }),
      fetchText: async () => '<div class="movie-list"><div class="item">new</div></div>',
      processVisibleItems,
      clearActorCaches,
      pushState,
    });

    controller.init();
    await controller.loadNextPage();

    expect(document.querySelectorAll('.movie-list .item')).toHaveLength(1);
    expect(pushState).toHaveBeenCalledWith('http://localhost:3000/?page=2');
    expect(processVisibleItems).toHaveBeenCalledTimes(1);
    expect(clearActorCaches).toHaveBeenCalledTimes(1);
  });
});
