/**
 * @file listSorting.test.ts
 * @description 列表排序增强测试 —— 已加载影片排序、原站排序识别、页间提示
 * @module tests/dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  detectNativeSortCapabilities,
  getAvailableListSortModes,
  readSortableItems,
  sortSortableItems,
} from '../../src/features/listEnhancement/application/listSorting';
import {
  createListSortingController,
} from '../../src/features/listEnhancement/ui/listSortingControls';
import { listEnhancementManager } from '../../src/features/listEnhancement/listEnhancementManager';

function mountMovieList(): void {
  document.body.innerHTML = `
    <div class="movie-list">
      <div class="item" data-case="low-count">
        <div class="video-title"><strong>AAA-001</strong> Low Count</div>
        <div class="score"><span class="value">4.8 分，由 12 人评价</span></div>
      </div>
      <div class="item" data-case="high-count">
        <div class="video-title"><strong>BBB-002</strong> High Count</div>
        <div class="score"><span class="value">4.2 分，由 860 人评价</span></div>
      </div>
      <div class="item" data-case="missing-score">
        <div class="video-title"><strong>CCC-003</strong> Missing Score</div>
        <div class="score"><span class="value">暂无评分</span></div>
      </div>
      <div class="item" data-case="same-score">
        <div class="video-title"><strong>DDD-004</strong> Same Score</div>
        <div class="score"><span class="value">4.8 分，由 500 人评价</span></div>
      </div>
    </div>
  `;
}

function itemCases(items: ReturnType<typeof readSortableItems>): string[] {
  return items.map(item => item.element.dataset.case || '');
}

describe('list sorting helpers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads sortable stats and assigns stable original indexes', () => {
    mountMovieList();

    const items = readSortableItems(document);

    expect(items).toHaveLength(4);
    expect(items.map(item => item.originalIndex)).toEqual([0, 1, 2, 3]);
    expect(items[0]).toMatchObject({ score: 4.8, ratingCount: 12 });
    expect(items[2]).toMatchObject({ score: null, ratingCount: null });
    expect(items[3].element.getAttribute('data-x-list-sort-original-index')).toBe('3');
  });

  it('sorts loaded items by rating score and keeps same-score items stable', () => {
    mountMovieList();
    const sorted = sortSortableItems(readSortableItems(document), 'rating-desc');

    expect(itemCases(sorted)).toEqual([
      'low-count',
      'same-score',
      'high-count',
      'missing-score',
    ]);
  });

  it('sorts loaded items by rating count and sends missing counts to the end', () => {
    mountMovieList();
    const sorted = sortSortableItems(readSortableItems(document), 'rating-count-desc');

    expect(itemCases(sorted)).toEqual([
      'high-count',
      'same-score',
      'low-count',
      'missing-score',
    ]);
  });

  it('restores the native loaded order by original index', () => {
    mountMovieList();
    const items = readSortableItems(document);
    const reversed = [...items].reverse();

    expect(itemCases(sortSortableItems(reversed, 'original'))).toEqual([
      'low-count',
      'high-count',
      'missing-score',
      'same-score',
    ]);
  });

  it('detects native rating sort and hides duplicate plugin modes', () => {
    document.body.innerHTML = `
      <div class="toolbar">
        <div class="button-group">
          <div class="buttons has-addons">
            <a class="button is-small is-info is-selected" href="/actors/8VJya">发布日期倒序</a>
            <a class="button is-small" href="/actors/8VJya?sort_type=1">评分倒序</a>
            <a class="button is-small" href="/actors/8VJya?sort_type=2">热度倒序</a>
          </div>
        </div>
      </div>
    `;

    const capabilities = detectNativeSortCapabilities(document);

    expect(capabilities).toEqual({
      hasNativeToolbar: true,
      activeLabel: '发布日期倒序',
      hasRatingSort: true,
      hasRatingCountSort: false,
    });
    expect(getAvailableListSortModes(capabilities)).toEqual([
      'original',
      'rating-count-desc',
    ]);
  });
});

describe('list sorting controller', () => {
  afterEach(() => {
    listEnhancementManager.updateConfig({
      sorting: { enabled: false, appendStrategy: 'prompt', autoResortPosition: 'preserve' },
    });
    document.body.innerHTML = '';
  });

  it('renders compact controls after native toolbar and hides duplicate rating mode', () => {
    document.body.innerHTML = `
      <div class="toolbar" id="native-toolbar">
        <div class="buttons has-addons">
          <a class="button is-small is-info is-selected" href="/actors/8VJya">发布日期倒序</a>
          <a class="button is-small" href="/actors/8VJya?sort_type=1">评分倒序</a>
        </div>
      </div>
      <div class="movie-list"></div>
    `;

    const controller = createListSortingController({
      document,
      window,
      config: { enabled: true, appendStrategy: 'prompt', autoResortPosition: 'preserve' },
    });
    controller.init();

    const toolbar = document.querySelector<HTMLElement>('.x-list-sort-toolbar');
    expect(toolbar).not.toBeNull();
    expect(document.getElementById('native-toolbar')?.nextElementSibling).toBe(toolbar);
    expect(toolbar?.textContent).toContain('原站顺序');
    expect(toolbar?.textContent).toContain('评价人数多优先');
    expect(toolbar?.textContent).not.toContain('评分高优先');
  });

  it('sorts DOM items from the plugin toolbar and explains the loaded-scope result', () => {
    document.body.innerHTML = `
      <div class="toolbar">
        <div class="buttons has-addons">
          <a class="button is-small is-info is-selected" href="/?vft=1&vst=2">磁鏈更新排序</a>
          <a class="button is-small" href="/?vft=1&vst=1">发布日期排序</a>
        </div>
      </div>
    `;
    mountMovieList();

    const controller = createListSortingController({
      document,
      window,
      config: { enabled: true, appendStrategy: 'prompt', autoResortPosition: 'preserve' },
    });
    controller.init();

    document.querySelector<HTMLButtonElement>('[data-list-sort-mode="rating-count-desc"]')?.click();

    const orderedCases = Array.from(document.querySelectorAll<HTMLElement>('.movie-list .item'))
      .map(item => item.dataset.case || '');
    expect(orderedCases).toEqual([
      'high-count',
      'same-score',
      'low-count',
      'missing-score',
    ]);
    expect(document.querySelector('.x-list-sort-notice')?.textContent).toContain('已经加载');
    expect(document.querySelector('.x-list-sort-notice')?.textContent).toContain('原站');
  });

  it('keeps one page prompt and accumulates appended items while plugin sorting is active', () => {
    mountMovieList();
    const controller = createListSortingController({
      document,
      window,
      config: { enabled: true, appendStrategy: 'prompt', autoResortPosition: 'preserve' },
    });
    controller.init();
    controller.applySort('rating-count-desc');

    const firstNewItem = document.createElement('div');
    firstNewItem.className = 'item';
    firstNewItem.dataset.case = 'new-a';
    firstNewItem.innerHTML = '<div class="score">5.0 分，由 1 人评价</div>';
    const secondNewItem = document.createElement('div');
    secondNewItem.className = 'item';
    secondNewItem.dataset.case = 'new-b';
    secondNewItem.innerHTML = '<div class="score">5.0 分，由 2 人评价</div>';
    const movieList = document.querySelector('.movie-list');
    movieList?.append(firstNewItem, secondNewItem);

    controller.handleItemsAppended({
      source: 'fetched',
      page: 2,
      appended: 2,
      items: [firstNewItem, secondNewItem],
    });

    expect(document.querySelectorAll('.x-list-sort-page-prompt')).toHaveLength(1);
    expect(document.querySelector('.x-list-sort-page-prompt')?.textContent).toContain('2');

    const thirdNewItem = document.createElement('div');
    thirdNewItem.className = 'item';
    thirdNewItem.dataset.case = 'new-c';
    thirdNewItem.innerHTML = '<div class="score">5.0 分，由 3 人评价</div>';
    movieList?.append(thirdNewItem);

    controller.handleItemsAppended({
      source: 'fetched',
      page: 3,
      appended: 1,
      items: [thirdNewItem],
    });

    expect(document.querySelectorAll('.x-list-sort-page-prompt')).toHaveLength(1);
    expect(document.querySelector('.x-list-sort-page-prompt')?.textContent).toContain('3');
  });

  it('does not render manager sorting controls before list enhancement initializes', () => {
    mountMovieList();

    listEnhancementManager.updateConfig({
      enabled: true,
      sorting: { enabled: true, appendStrategy: 'prompt', autoResortPosition: 'preserve' },
    });

    expect(document.querySelector('.x-list-sort-toolbar')).toBeNull();
  });
});
