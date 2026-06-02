import { describe, expect, it, vi } from 'vitest';
import { createRecordsListViewController } from '../../src/dashboard/tabs/records/listViewController';
import type { CreateRecordsItemElementOptions } from '../../src/dashboard/tabs/records/itemController';
import type { RenderRecordsListOptions } from '../../src/dashboard/tabs/records/listRenderer';
import type { VideoRecord } from '../../src/types';

function createRecord(id: string): VideoRecord {
  return { id, title: `title-${id}`, status: 'browsed' } as VideoRecord;
}

describe('records list view controller', () => {
  it('passes current list state into renderer and item factory', () => {
    document.body.innerHTML = '<ul id="videoList"></ul>';
    const videoList = document.getElementById('videoList') as HTMLUListElement;
    const selectedRecordIds = new Set<string>(['A']);
    const selectedTags = new Set<string>(['tag-a']);
    const selectedListIds = new Set<string>(['list-a']);
    const listNameById = new Map([['list-a', 'List A']]);
    const renderList = vi.fn((options: RenderRecordsListOptions) => {
      options.createItemElement(createRecord('A'));
    });
    const createItemElement = vi.fn((options: CreateRecordsItemElementOptions) => {
      const item = document.createElement('li');
      item.dataset.recordId = options.record.id;
      return item;
    });

    const controller = createRecordsListViewController({
      videoList,
      getSourceRecords: () => [createRecord('A')],
      isServerModeActive: () => false,
      getCurrentPage: () => 2,
      getRecordsPerPage: () => 20,
      getViewMode: () => 'card',
      getCoversEnabled: () => true,
      coverRuntime: {
        setupObserver: vi.fn(),
        teardownObserver: vi.fn(),
        getTooltipElement: () => null,
        getObserver: () => null,
      },
      updateSearchResultCount: vi.fn(),
      ensureListMetaLoaded: vi.fn(),
      selectedRecordIds,
      selectedTags,
      selectedListIds,
      listNameById,
      getSearchEngines: () => [{ name: 'JavDB' }],
      fallbackIconUrl: 'fallback.png',
      escapeHtml: value => value,
      bindImageTooltip: vi.fn(),
      onToggleRecordSelection: vi.fn(),
      onFilterChanged: vi.fn(),
      refreshTags: vi.fn(),
      refreshLists: vi.fn(),
      actionCallbacks: {
        onToggleFavorite: vi.fn(),
        onEdit: vi.fn(),
        onRefresh: vi.fn(),
        onDelete: vi.fn(),
        onOpenListPicker: vi.fn(),
      },
      renderList,
      createItemElement,
    });

    controller.render();

    expect(renderList).toHaveBeenCalledWith(expect.objectContaining({
      videoList,
      sourceRecords: [expect.objectContaining({ id: 'A' })],
      serverModeActive: false,
      currentPage: 2,
      recordsPerPage: 20,
      viewMode: 'card',
      coversEnabled: true,
    }));
    expect(createItemElement).toHaveBeenCalledWith(expect.objectContaining({
      record: expect.objectContaining({ id: 'A' }),
      viewMode: 'card',
      coversEnabled: true,
      selectedRecordIds,
      selectedTags,
      selectedListIds,
      listNameById,
      searchEngines: [{ name: 'JavDB' }],
      fallbackIconUrl: 'fallback.png',
    }));
  });

  it('toggles tag and list filters while preserving callback order', () => {
    document.body.innerHTML = '<ul id="videoList"></ul>';
    const calls: string[] = [];
    const selectedTags = new Set<string>();
    const selectedListIds = new Set<string>(['list-a']);
    let capturedItemOptions: CreateRecordsItemElementOptions | null = null;

    const controller = createRecordsListViewController({
      videoList: document.getElementById('videoList') as HTMLUListElement,
      getSourceRecords: () => [createRecord('A')],
      isServerModeActive: () => false,
      getCurrentPage: () => 1,
      getRecordsPerPage: () => 10,
      getViewMode: () => 'list',
      getCoversEnabled: () => false,
      coverRuntime: {
        setupObserver: vi.fn(),
        teardownObserver: vi.fn(),
        getTooltipElement: () => null,
        getObserver: () => null,
      },
      updateSearchResultCount: vi.fn(),
      ensureListMetaLoaded: vi.fn(),
      selectedRecordIds: new Set<string>(),
      selectedTags,
      selectedListIds,
      listNameById: new Map(),
      getSearchEngines: () => [],
      fallbackIconUrl: 'fallback.png',
      escapeHtml: value => value,
      bindImageTooltip: vi.fn(),
      onToggleRecordSelection: vi.fn(),
      onFilterChanged: () => calls.push('onFilterChanged'),
      refreshTags: () => calls.push('refreshTags'),
      refreshLists: () => calls.push('refreshLists'),
      actionCallbacks: {
        onToggleFavorite: vi.fn(),
        onEdit: vi.fn(),
        onRefresh: vi.fn(),
        onDelete: vi.fn(),
        onOpenListPicker: vi.fn(),
      },
      renderList: options => options.createItemElement(createRecord('A')),
      createItemElement: options => {
        capturedItemOptions = options;
        return document.createElement('li');
      },
    });

    controller.render();
    capturedItemOptions?.onToggleTagFilter('tag-a');
    capturedItemOptions?.onToggleListFilter('list-a');

    expect(selectedTags.has('tag-a')).toBe(true);
    expect(selectedListIds.has('list-a')).toBe(false);
    expect(calls).toEqual(['onFilterChanged', 'refreshTags', 'onFilterChanged', 'refreshLists']);
  });
});
