import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachNewWorkItemListeners,
  clearNewWorksSelection,
  renderNewWorksListRuntime,
  selectAllCurrentNewWorksPage,
  syncNewWorksBatchOperations,
} from '../../src/dashboard/tabs/newWorksListRuntime';
import type { NewWorkRecord } from '../../src/types';

function work(overrides: Partial<NewWorkRecord> = {}): NewWorkRecord {
  return {
    id: 'work-1',
    actorId: 'actor-1',
    actorName: 'Alice',
    title: 'New Work',
    javdbUrl: 'https://javdb.com/v/abc',
    coverImage: 'https://img.example.com/cover.jpg',
    tags: ['高清'],
    discoveredAt: new Date('2026-05-02T00:00:00+08:00').getTime(),
    releaseDate: '2026-05-01',
    isRead: false,
    ...overrides,
  };
}

function renderList() {
  document.body.innerHTML = `
    <span id="selectedCountLabel"></span>
    <button id="batchOpenSelectedBtn"></button>
    <button id="batchDeleteSelectedBtn"></button>
    <button id="clearSelectionBtn" disabled></button>
    <ul>
      <li class="new-work-item unread" data-work-id="work-1" data-javdb-url="https://javdb.com/v/1">
        <div class="new-work-checkbox"><input type="checkbox"></div>
        <button class="new-work-action-btn" data-action="mark-read">标为已读</button>
      </li>
      <li class="new-work-item read" data-work-id="work-2" data-javdb-url="https://javdb.com/v/2">
        <div class="new-work-checkbox"><input type="checkbox"></div>
        <button class="new-work-action-btn" data-action="visit">去看看</button>
        <button class="new-work-action-btn" data-action="delete">移除</button>
      </li>
    </ul>
  `;
}

describe('new works list runtime', () => {
  beforeEach(() => {
    renderList();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('syncs batch operation buttons with selected count', () => {
    const selected = new Set(['work-1']);

    syncNewWorksBatchOperations(selected);

    expect(document.getElementById('selectedCountLabel')?.textContent).toBe('已选 1');
    expect((document.getElementById('batchOpenSelectedBtn') as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById('batchDeleteSelectedBtn') as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById('clearSelectionBtn') as HTMLButtonElement).disabled).toBe(false);
  });

  it('selects all current page works and clears selection', () => {
    const selected = new Set<string>();

    selectAllCurrentNewWorksPage(selected);
    expect([...selected].sort()).toEqual(['work-1', 'work-2']);
    expect(document.querySelectorAll('.new-work-item.selected')).toHaveLength(2);
    expect(Array.from(document.querySelectorAll<HTMLInputElement>('.new-work-item input')).every(input => input.checked)).toBe(true);

    clearNewWorksSelection(selected);
    expect(selected.size).toBe(0);
    expect(document.querySelectorAll('.new-work-item.selected')).toHaveLength(0);
    expect(Array.from(document.querySelectorAll<HTMLInputElement>('.new-work-item input')).every(input => !input.checked)).toBe(true);
  });

  it('toggles selection from checkbox and item body clicks', async () => {
    const selected = new Set<string>();
    const updateBatchOperations = vi.fn();

    attachNewWorkItemListeners(selected, {
      markWorksAsRead: vi.fn(),
      visitWork: vi.fn(),
      deleteWorks: vi.fn(),
      updateBatchOperations,
    });
    updateBatchOperations.mockClear();

    const firstItem = document.querySelector<HTMLElement>('[data-work-id="work-1"]')!;
    const firstCheckbox = firstItem.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

    firstCheckbox.checked = true;
    firstCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    expect(selected.has('work-1')).toBe(true);
    expect(firstItem.classList.contains('selected')).toBe(true);

    firstItem.click();
    expect(selected.has('work-1')).toBe(false);
    expect(firstCheckbox.checked).toBe(false);
    expect(firstItem.classList.contains('selected')).toBe(false);
    expect(updateBatchOperations).toHaveBeenCalledTimes(2);
  });

  it('routes action button clicks without changing card selection', async () => {
    const selected = new Set<string>();
    const markWorksAsRead = vi.fn(async () => undefined);
    const visitWork = vi.fn(async () => undefined);
    const deleteWorks = vi.fn(async () => undefined);

    attachNewWorkItemListeners(selected, {
      markWorksAsRead,
      visitWork,
      deleteWorks,
      updateBatchOperations: vi.fn(),
    });

    document.querySelector<HTMLElement>('[data-work-id="work-1"] [data-action="mark-read"]')?.click();
    document.querySelector<HTMLElement>('[data-work-id="work-2"] [data-action="visit"]')?.click();
    document.querySelector<HTMLElement>('[data-work-id="work-2"] [data-action="delete"]')?.click();
    await Promise.resolve();

    expect(markWorksAsRead).toHaveBeenCalledWith(['work-1']);
    expect(visitWork).toHaveBeenCalledWith('work-2');
    expect(deleteWorks).toHaveBeenCalledWith(['work-2']);
    expect(selected.size).toBe(0);
  });

  it('renders fetched works, pagination and item listeners', async () => {
    document.body.innerHTML = `
      <div id="newWorksList"></div>
      <div id="newWorksPagination"></div>
      <span id="selectedCountLabel"></span>
      <button id="batchOpenSelectedBtn"></button>
      <button id="batchDeleteSelectedBtn"></button>
      <button id="clearSelectionBtn"></button>
    `;
    const selected = new Set<string>(['work-1']);
    const getNewWorks = vi.fn(async () => ({
      works: [work()],
      total: 30,
    }));
    const setPage = vi.fn();
    const render = vi.fn(async () => undefined);
    const visitWork = vi.fn(async () => undefined);

    await renderNewWorksListRuntime({
      filters: { search: 'alice', filter: 'unread', sort: 'discoveredAt_desc' },
      page: 1,
      pageSize: 20,
      selectedWorks: selected,
      deps: {
        getNewWorks,
        setPage,
        render,
        updateBatchOpenUnreadButton: vi.fn(),
        markWorksAsRead: vi.fn(),
        visitWork,
        deleteWorks: vi.fn(),
        updateBatchOperations: () => syncNewWorksBatchOperations(selected),
        logInfo: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
      },
    });

    expect(getNewWorks).toHaveBeenCalledWith({
      search: 'alice',
      filter: 'unread',
      sort: 'discoveredAt_desc',
      page: 1,
      pageSize: 20,
    });
    expect(document.getElementById('newWorksList')?.textContent).toContain('New Work');
    expect(document.querySelector('.new-work-item')?.classList.contains('selected')).toBe(true);
    expect(document.querySelector('.page-button[data-page="2"]')).not.toBeNull();

    document.querySelector<HTMLElement>('[data-action="visit"]')?.click();
    document.querySelector<HTMLElement>('.page-button[data-page="2"]')?.click();
    await Promise.resolve();

    expect(visitWork).toHaveBeenCalledWith('work-1');
    expect(setPage).toHaveBeenCalledWith(2);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('renders empty state and clears pagination for empty results', async () => {
    document.body.innerHTML = `
      <div id="newWorksList"></div>
      <div id="newWorksPagination">old pagination</div>
    `;

    await renderNewWorksListRuntime({
      filters: { search: '', filter: 'all', sort: 'discoveredAt_desc' },
      page: 1,
      pageSize: 20,
      selectedWorks: new Set(),
      deps: {
        getNewWorks: vi.fn(async () => ({ works: [], total: 0 })),
        setPage: vi.fn(),
        render: vi.fn(),
        updateBatchOpenUnreadButton: vi.fn(),
        markWorksAsRead: vi.fn(),
        visitWork: vi.fn(),
        deleteWorks: vi.fn(),
        updateBatchOperations: vi.fn(),
        logInfo: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
      },
    });

    expect(document.getElementById('newWorksList')?.textContent).toContain('暂无新作品');
    expect(document.getElementById('newWorksPagination')?.innerHTML).toBe('');
  });

  it('logs missing list container without fetching', async () => {
    document.body.innerHTML = '';
    const getNewWorks = vi.fn();
    const logWarn = vi.fn();

    await renderNewWorksListRuntime({
      filters: { search: '', filter: 'all', sort: 'discoveredAt_desc' },
      page: 1,
      pageSize: 20,
      selectedWorks: new Set(),
      deps: {
        getNewWorks,
        setPage: vi.fn(),
        render: vi.fn(),
        updateBatchOpenUnreadButton: vi.fn(),
        markWorksAsRead: vi.fn(),
        visitWork: vi.fn(),
        deleteWorks: vi.fn(),
        updateBatchOperations: vi.fn(),
        logInfo: vi.fn(),
        logWarn,
        logError: vi.fn(),
      },
    });

    expect(logWarn).toHaveBeenCalledWith('未找到新作品列表容器');
    expect(getNewWorks).not.toHaveBeenCalled();
  });

  it('renders error state when fetching fails', async () => {
    document.body.innerHTML = '<div id="newWorksList"></div>';
    const logError = vi.fn();

    await renderNewWorksListRuntime({
      filters: { search: '', filter: 'all', sort: 'discoveredAt_desc' },
      page: 1,
      pageSize: 20,
      selectedWorks: new Set(),
      deps: {
        getNewWorks: vi.fn(async () => { throw new Error('load failed'); }),
        setPage: vi.fn(),
        render: vi.fn(),
        updateBatchOpenUnreadButton: vi.fn(),
        markWorksAsRead: vi.fn(),
        visitWork: vi.fn(),
        deleteWorks: vi.fn(),
        updateBatchOperations: vi.fn(),
        logInfo: vi.fn(),
        logWarn: vi.fn(),
        logError,
      },
    });

    expect(logError).toHaveBeenCalledWith('渲染新作品列表失败:', expect.any(Error));
    expect(document.getElementById('newWorksList')?.textContent).toContain('加载新作品列表失败');
  });
});
