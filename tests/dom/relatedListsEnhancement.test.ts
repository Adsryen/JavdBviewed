import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoDetailEnhancer } from '../../src/features/videoDetail';
import { relatedListsService } from '../../src/features/relatedLists';

describe('VideoDetailEnhancer related lists enhancement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    (window as any).__JDB_VERBOSE = false;

    const oldThemeObserver = (window as any).__jdb_related_lists_theme_observer__ as MutationObserver | undefined;
    oldThemeObserver?.disconnect();
    delete (window as any).__jdb_related_lists_theme_observer__;
  });

  it('syncs related lists panel theme from JavDB data-theme', async () => {
    const enhancer = new VideoDetailEnhancer() as any;
    const panel = document.createElement('div');

    expect(enhancer.applyRelatedListsTheme(panel)).toBe('light');
    expect(panel.dataset.jdbTheme).toBe('light');

    enhancer.bindRelatedListsThemeObserver(panel);
    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.dataset.jdbTheme).toBe('dark');
  });

  it('renders previous and next pagination controls', () => {
    const enhancer = new VideoDetailEnhancer() as any;
    const panel = document.createElement('div');
    const loadRelatedLists = vi.spyOn(enhancer, 'loadRelatedLists').mockResolvedValue(undefined);

    enhancer.renderRelatedListsFooter(panel, 'NQ6pPb', 2, true, 20, 5);

    const pageInfo = panel.querySelector('.jdb-related-lists-page-info')?.textContent || '';
    expect(pageInfo).toContain('2 / 5');
    expect(pageInfo).toContain('20');

    panel.querySelector<HTMLButtonElement>('[data-jdb-related-page-prev]')?.click();
    panel.querySelector<HTMLButtonElement>('[data-jdb-related-page-next]')?.click();

    expect(loadRelatedLists).toHaveBeenCalledWith(panel, 'NQ6pPb', 1);
    expect(loadRelatedLists).toHaveBeenCalledWith(panel, 'NQ6pPb', 3);
  });

  it('disables pagination at the first and last page', () => {
    const enhancer = new VideoDetailEnhancer() as any;
    const panel = document.createElement('div');

    enhancer.renderRelatedListsFooter(panel, 'NQ6pPb', 1, false, 8);

    expect(panel.querySelector<HTMLButtonElement>('[data-jdb-related-page-prev]')?.disabled).toBe(true);
    expect(panel.querySelector<HTMLButtonElement>('[data-jdb-related-page-next]')?.disabled).toBe(true);
    const pageInfo = panel.querySelector('.jdb-related-lists-page-info')?.textContent || '';
    expect(pageInfo).toContain('1');
    expect(pageInfo).toContain('8');
  });

  it('loads related lists with 10 items per page and renders matching indexes', async () => {
    const enhancer = new VideoDetailEnhancer() as any;
    const panel = document.createElement('div');
    const items = Array.from({ length: 12 }, (_, index) => ({
      relatedId: `list-${index + 1}`,
      name: `清单 ${index + 1}`,
      movieCount: index + 1,
      collectionCount: index + 2,
      viewCount: index + 3,
      createTime: '2026-05-24',
    }));
    const getRelatedLists = vi.spyOn(relatedListsService, 'getRelatedLists').mockResolvedValue({
      success: true,
      data: items,
      page: 2,
      totalPages: 3,
      hasMore: true,
    });

    await enhancer.loadRelatedLists(panel, 'NQ6pPb', 2);

    expect(getRelatedLists).toHaveBeenCalledWith('NQ6pPb', 2, 10);
    expect(panel.querySelector('.jdb-related-lists-banner')?.textContent).toContain('已为您解锁全部相关清单');
    expect(panel.querySelector('.jdb-related-lists-banner')?.textContent).toContain('本页显示 10 条');
    expect(panel.querySelectorAll('.jdb-related-list-card')).toHaveLength(10);
    expect(panel.querySelector('.jdb-related-list-index')?.textContent).toBe('#11');
    expect(Array.from(panel.querySelectorAll('.jdb-related-list-index')).at(-1)?.textContent).toBe('#20');
    expect(panel.textContent).not.toContain('清单 11');
  });
});
