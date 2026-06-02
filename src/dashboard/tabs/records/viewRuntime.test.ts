import { describe, expect, it, vi } from 'vitest';
import { createRecordsViewRuntime } from './viewRuntime';
import type { VideoRecord } from '../../../types';

function record(id: string): VideoRecord {
  return {
    id,
    title: id,
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
  };
}

describe('records view runtime', () => {
  it('wires list rendering, pagination, and export runtime callbacks', async () => {
    const filteredRecords = [record('AAA-001')];
    const serverPageItems = [record('BBB-002')];
    let currentPage = 1;
    let serverModeActive = false;

    const listViewController = { render: vi.fn() };
    const paginationRuntime = { render: vi.fn() };
    const exportRuntime = {
      handleExportRecords: vi.fn(async () => {}),
      getRecordsForExport: vi.fn(async () => filteredRecords),
    };
    const createListViewController = vi.fn(() => listViewController);
    const createPaginationRuntime = vi.fn(() => paginationRuntime);
    const createExportRuntime = vi.fn(() => exportRuntime);
    const renderPage = vi.fn();

    const runtime = createRecordsViewRuntime({
      videoList: {} as HTMLUListElement,
      paginationContainer: {} as HTMLElement,
      getSourceRecords: () => (serverModeActive ? serverPageItems : filteredRecords),
      isServerModeActive: () => serverModeActive,
      getServerTotal: () => 20,
      getFilteredCount: () => filteredRecords.length,
      getCurrentPage: () => currentPage,
      setCurrentPage: (page) => {
        currentPage = page;
      },
      getRecordsPerPage: () => 10,
      getViewMode: () => 'list',
      getCoversEnabled: () => true,
      coverRuntime: {
        setupObserver: vi.fn(),
        teardownObserver: vi.fn(),
        getTooltipElement: vi.fn(),
        getObserver: vi.fn(),
      },
      updateSearchResultCount: vi.fn(),
      ensureListMetaLoaded: vi.fn(),
      selectedRecordIds: new Set<string>(),
      selectedTags: new Set<string>(),
      selectedListIds: new Set<string>(),
      listNameById: new Map([['list-1', '清单']]),
      getSearchEngines: () => [],
      fallbackIconUrl: 'fallback.png',
      escapeHtml: (value) => value,
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
      getFilteredRecords: () => filteredRecords,
      getSearchText: () => 'AAA',
      getStatus: () => 'all',
      getSort: () => ({ field: 'updatedAt', direction: 'desc' }),
      getAdvancedConditions: () => [],
      queryRecords: vi.fn(),
      showProgress: vi.fn(),
      hideProgress: vi.fn(),
      exportController: {
        handleExportRecords: vi.fn(),
      },
      renderPage,
      createListViewController,
      createPaginationRuntime,
      createExportRuntime,
    });

    runtime.renderVideoList();
    runtime.renderPagination();
    await runtime.handleExportRecords();
    const records = await runtime.getRecordsForExport();

    const listOptions = createListViewController.mock.calls[0][0];
    const paginationOptions = createPaginationRuntime.mock.calls[0][0];
    const exportOptions = createExportRuntime.mock.calls[0][0];
    serverModeActive = true;

    expect(listViewController.render).toHaveBeenCalledTimes(1);
    expect(paginationRuntime.render).toHaveBeenCalledTimes(1);
    expect(exportRuntime.handleExportRecords).toHaveBeenCalledTimes(1);
    expect(records).toEqual(filteredRecords);
    expect(listOptions.getSourceRecords()).toEqual(serverPageItems);
    expect(listOptions.getCurrentPage()).toBe(1);
    expect(listOptions.fallbackIconUrl).toBe('fallback.png');
    paginationOptions.setCurrentPage(2);
    paginationOptions.renderPage();
    expect(currentPage).toBe(2);
    expect(renderPage).toHaveBeenCalledTimes(1);
    expect(exportOptions.getSearchText()).toBe('AAA');
    expect(exportOptions.getStatus()).toBe('all');
    expect(exportOptions.getSort()).toEqual({ field: 'updatedAt', direction: 'desc' });
  });
});
