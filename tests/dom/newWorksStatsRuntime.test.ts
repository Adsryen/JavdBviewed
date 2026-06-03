import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachNewWorksStatsCardListeners,
  renderNewWorksStatsRuntime,
} from '../../src/dashboard/tabs/newWorksStatsRuntime';
import { buildNewWorksStatsHtml } from '../../src/dashboard/tabs/newWorksStatsViewModel';
import type { NewWorksFilters } from '../../src/dashboard/tabs/newWorksStatsRuntime';
import type { NewWorksStats } from '../../src/types';

function stats(overrides: Partial<NewWorksStats> = {}): NewWorksStats {
  return {
    totalSubscriptions: 3,
    activeSubscriptions: 2,
    totalNewWorks: 11,
    unreadWorks: 5,
    todayDiscovered: 1,
    lastCheckTime: 1780000000000,
    ...overrides,
  };
}

function renderStatsHost() {
  document.body.innerHTML = `
    <input id="newWorksSearchInput" value="Alice">
    <select id="newWorksFilterSelect">
      <option value="all">all</option>
      <option value="unread">unread</option>
    </select>
    <select id="newWorksSortSelect">
      <option value="discoveredAt_desc">discoveredAt_desc</option>
      <option value="releaseDate_desc">releaseDate_desc</option>
    </select>
    <button id="manageSubscriptionsBtn"></button>
    <div id="newWorksStatsContainer">${buildNewWorksStatsHtml({
      totalSubscriptions: 2,
      activeSubscriptions: 1,
      totalNewWorks: 10,
      unreadWorks: 4,
      todayDiscovered: 3,
    })}</div>
  `;
}

describe('new works stats runtime', () => {
  beforeEach(() => {
    renderStatsHost();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('applies unread filter, resets search and renders first page', () => {
    const filters: NewWorksFilters = {
      search: 'Alice',
      filter: 'all',
      sort: 'releaseDate_desc',
    };
    const setPage = vi.fn();
    const render = vi.fn();

    attachNewWorksStatsCardListeners(document.getElementById('newWorksStatsContainer')!, filters, {
      setPage,
      render,
      openSubscriptionManager: vi.fn(),
    });

    document.querySelector<HTMLElement>('[data-filter="unread"]')?.click();

    expect(filters).toEqual({
      search: '',
      filter: 'unread',
      sort: 'discoveredAt_desc',
    });
    expect((document.getElementById('newWorksSearchInput') as HTMLInputElement).value).toBe('');
    expect((document.getElementById('newWorksFilterSelect') as HTMLSelectElement).value).toBe('unread');
    expect((document.getElementById('newWorksSortSelect') as HTMLSelectElement).value).toBe('discoveredAt_desc');
    expect(setPage).toHaveBeenCalledWith(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-filter="unread"]')?.classList.contains('active')).toBe(true);
  });

  it('opens subscription manager for subscription stat cards after clearing search', () => {
    const filters: NewWorksFilters = {
      search: 'Alice',
      filter: 'unread',
      sort: 'releaseDate_desc',
    };
    const openSubscriptionManager = vi.fn();
    const render = vi.fn();

    attachNewWorksStatsCardListeners(document.getElementById('newWorksStatsContainer')!, filters, {
      setPage: vi.fn(),
      render,
      openSubscriptionManager,
    });

    document.querySelector<HTMLElement>('[data-filter="active"]')?.click();

    expect(filters.search).toBe('');
    expect((document.getElementById('newWorksSearchInput') as HTMLInputElement).value).toBe('');
    expect(openSubscriptionManager).toHaveBeenCalledTimes(1);
    expect(render).not.toHaveBeenCalled();
  });

  it('renders stats, updates manage button badge and last check time', async () => {
    document.body.innerHTML = `
      <button id="manageSubscriptionsBtn"></button>
      <div id="newWorksStatsContainer"></div>
    `;
    const filters: NewWorksFilters = {
      search: '',
      filter: 'all',
      sort: 'discoveredAt_desc',
    };
    const getStats = vi.fn(async () => stats());
    const updateLastCheckTimeDisplay = vi.fn();

    await renderNewWorksStatsRuntime({
      filters,
      deps: {
        getStats,
        setPage: vi.fn(),
        render: vi.fn(),
        openSubscriptionManager: vi.fn(),
        updateLastCheckTimeDisplay,
        logInfo: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
      },
    });

    expect(getStats).toHaveBeenCalledTimes(1);
    expect(document.getElementById('newWorksStatsContainer')?.textContent).toContain('订阅演员');
    expect(document.getElementById('newWorksStatsContainer')?.textContent).toContain('11');
    expect(document.getElementById('manageSubscriptionsBtn')?.innerHTML).toContain('<span class="badge">3</span>');
    expect(updateLastCheckTimeDisplay).toHaveBeenCalledWith(1780000000000);
  });

  it('logs missing stats container without fetching', async () => {
    document.body.innerHTML = '';
    const getStats = vi.fn();
    const logWarn = vi.fn();

    await renderNewWorksStatsRuntime({
      filters: { search: '', filter: 'all', sort: 'discoveredAt_desc' },
      deps: {
        getStats,
        setPage: vi.fn(),
        render: vi.fn(),
        openSubscriptionManager: vi.fn(),
        updateLastCheckTimeDisplay: vi.fn(),
        logInfo: vi.fn(),
        logWarn,
        logError: vi.fn(),
      },
    });

    expect(logWarn).toHaveBeenCalledWith('未找到统计信息容器');
    expect(getStats).not.toHaveBeenCalled();
  });

  it('renders stats error state when loading fails', async () => {
    document.body.innerHTML = '<div id="newWorksStatsContainer"></div>';
    const logError = vi.fn();

    await renderNewWorksStatsRuntime({
      filters: { search: '', filter: 'all', sort: 'discoveredAt_desc' },
      deps: {
        getStats: vi.fn(async () => { throw new Error('stats failed'); }),
        setPage: vi.fn(),
        render: vi.fn(),
        openSubscriptionManager: vi.fn(),
        updateLastCheckTimeDisplay: vi.fn(),
        logInfo: vi.fn(),
        logWarn: vi.fn(),
        logError,
      },
    });

    expect(logError).toHaveBeenCalledWith('渲染统计信息失败:', expect.any(Error));
    expect(document.getElementById('newWorksStatsContainer')?.textContent).toContain('加载统计信息失败');
  });
});
