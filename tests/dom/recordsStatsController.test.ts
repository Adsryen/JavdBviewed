import { describe, expect, it, vi } from 'vitest';
import { createRecordsStatsController } from '../../src/dashboard/tabs/records/statsController';
import type { VideoRecord } from '../../src/types';
import type { RecordsAdvancedCondition } from '../../src/dashboard/tabs/records/advancedConditionModel';

function createRecord(partial: Partial<VideoRecord>): VideoRecord {
  return {
    id: partial.id || 'ABC-001',
    title: partial.title || 'title',
    status: partial.status || 'browsed',
    tags: partial.tags || [],
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
    releaseDate: partial.releaseDate,
    javdbUrl: partial.javdbUrl,
    javdbImage: partial.javdbImage,
    date: partial.date,
    lists: partial.lists,
    listIds: partial.listIds,
    rating: partial.rating,
    favorite: partial.favorite,
    manuallyEditedFields: partial.manuallyEditedFields,
  };
}

function buildFixture(options: { serverMode?: boolean; records?: VideoRecord[] } = {}) {
  document.body.innerHTML = `
    <input id="searchInput" value="ABC tag:old" />
    <select id="filterSelect">
      <option value="all">全部</option>
      <option value="viewed">已观看</option>
      <option value="browsed">已浏览</option>
      <option value="want">我想看</option>
    </select>
    <div id="recordsStatsContainer"></div>
  `;

  const selectedTags = new Set(['字幕']);
  const tokenSelectedTags = new Set(['高清']);
  const selectedListIds = new Set(['list-1']);
  const tokenSelectedListIds = new Set(['list-2']);
  const advancedConditions: RecordsAdvancedCondition[] = [
    { id: 'cond-old', field: 'title', op: 'contains', value: 'old' },
  ];
  const refreshTagsFilter = vi.fn();
  const refreshListsFilter = vi.fn();
  const renderAdvancedConditions = vi.fn();
  const onFilterApplied = vi.fn();

  const controller = createRecordsStatsController({
    container: document.getElementById('recordsStatsContainer'),
    searchInput: document.getElementById('searchInput') as HTMLInputElement,
    filterSelect: document.getElementById('filterSelect') as HTMLSelectElement,
    selectedTags,
    tokenSelectedTags,
    selectedListIds,
    tokenSelectedListIds,
    refreshTagsFilter,
    refreshListsFilter,
    setAdvancedConditions: (conditions) => {
      advancedConditions.splice(0, advancedConditions.length, ...conditions);
    },
    renderAdvancedConditions,
    onFilterApplied,
    getRecords: () => options.records || [],
    isServerModeActive: () => Boolean(options.serverMode),
    loadServerStats: vi.fn(async () => ({
      total: 12,
      byStatus: { viewed: 3, browsed: 4, want: 5 },
      last7Days: 6,
      last30Days: 7,
    })),
    now: () => new Date('2026-06-01T00:00:00Z').getTime(),
  });

  return {
    controller,
    selectedTags,
    tokenSelectedTags,
    selectedListIds,
    tokenSelectedListIds,
    advancedConditions,
    refreshTagsFilter,
    refreshListsFilter,
    renderAdvancedConditions,
    onFilterApplied,
    filterSelect: document.getElementById('filterSelect') as HTMLSelectElement,
    searchInput: document.getElementById('searchInput') as HTMLInputElement,
    container: document.getElementById('recordsStatsContainer') as HTMLElement,
  };
}

describe('records stats controller', () => {
  it('renders memory stats for total, statuses, and recent records', async () => {
    const now = new Date('2026-06-01T00:00:00Z').getTime();
    const { controller, container } = buildFixture({
      records: [
        createRecord({ id: 'A', status: 'viewed', createdAt: now - 2 * 24 * 60 * 60 * 1000 }),
        createRecord({ id: 'B', status: 'browsed', createdAt: now - 10 * 24 * 60 * 60 * 1000 }),
        createRecord({ id: 'C', status: 'want', createdAt: now - 40 * 24 * 60 * 60 * 1000 }),
      ],
    });

    await controller.updateStats();

    const values = Array.from(container.querySelectorAll('.stat-value')).map(node => node.textContent);
    expect(values).toEqual(['3', '1', '1', '1', '1', '2']);
  });

  it('maps server stats when server mode is active', async () => {
    const { controller, container } = buildFixture({ serverMode: true });

    await controller.updateStats();

    const values = Array.from(container.querySelectorAll('.stat-value')).map(node => node.textContent);
    expect(values).toEqual(['12', '3', '4', '5', '6', '7']);
  });

  it('clears quick filters and applies status filters from cards', async () => {
    const fixture = buildFixture();

    await fixture.controller.updateStats();
    fixture.container.querySelector<HTMLElement>('[data-filter="viewed"]')?.click();

    expect(fixture.searchInput.value).toBe('');
    expect([...fixture.selectedTags]).toEqual([]);
    expect([...fixture.tokenSelectedTags]).toEqual([]);
    expect([...fixture.selectedListIds]).toEqual([]);
    expect([...fixture.tokenSelectedListIds]).toEqual([]);
    expect(fixture.filterSelect.value).toBe('viewed');
    expect(fixture.advancedConditions).toEqual([]);
    expect(fixture.refreshTagsFilter).toHaveBeenCalled();
    expect(fixture.refreshListsFilter).toHaveBeenCalled();
    expect(fixture.renderAdvancedConditions).toHaveBeenCalled();
    expect(fixture.onFilterApplied).toHaveBeenCalled();
    expect(fixture.container.querySelector('[data-filter="viewed"]')?.classList.contains('active')).toBe(true);
  });

  it('adds recent advanced conditions from quick date cards', async () => {
    const fixture = buildFixture();

    await fixture.controller.updateStats();
    fixture.container.querySelector<HTMLElement>('[data-filter="thisWeek"]')?.click();

    expect(fixture.filterSelect.value).toBe('all');
    expect(fixture.advancedConditions).toHaveLength(1);
    expect(fixture.advancedConditions[0]).toMatchObject({
      field: 'createdAt',
      op: 'gte',
      value: String(new Date('2026-05-25T00:00:00Z').getTime()),
    });
    expect(fixture.renderAdvancedConditions).toHaveBeenCalled();
    expect(fixture.onFilterApplied).toHaveBeenCalled();
  });

  it('keeps the clicked stats card active after stats DOM refreshes', async () => {
    document.body.innerHTML = `
      <input id="searchInput" />
      <select id="filterSelect">
        <option value="all">全部</option>
        <option value="viewed">已观看</option>
      </select>
      <div id="recordsStatsContainer"></div>
    `;
    let conditions: RecordsAdvancedCondition[] = [];
    let controller: ReturnType<typeof createRecordsStatsController>;
    controller = createRecordsStatsController({
      container: document.getElementById('recordsStatsContainer'),
      searchInput: document.getElementById('searchInput') as HTMLInputElement,
      filterSelect: document.getElementById('filterSelect') as HTMLSelectElement,
      selectedTags: new Set(),
      tokenSelectedTags: new Set(),
      selectedListIds: new Set(),
      tokenSelectedListIds: new Set(),
      refreshTagsFilter: vi.fn(),
      refreshListsFilter: vi.fn(),
      setAdvancedConditions: nextConditions => {
        conditions = nextConditions;
      },
      renderAdvancedConditions: vi.fn(() => conditions),
      onFilterApplied: () => {
        void controller.updateStats();
      },
      getRecords: () => [createRecord({ id: 'A', status: 'viewed' })],
      isServerModeActive: () => false,
      loadServerStats: vi.fn(),
      now: () => new Date('2026-06-01T00:00:00Z').getTime(),
    });

    await controller.updateStats();
    document.querySelector<HTMLElement>('[data-filter="viewed"]')?.click();
    await Promise.resolve();

    expect(document.querySelector('[data-filter="viewed"]')?.classList.contains('active')).toBe(true);
  });
});
