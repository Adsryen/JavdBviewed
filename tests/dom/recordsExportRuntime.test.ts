import { describe, expect, it, vi } from 'vitest';
import { createRecordsExportRuntime } from '../../src/dashboard/tabs/records/exportRuntime';
import type { VideoRecord } from '../../src/types';

function record(id: string): VideoRecord {
  return { id, title: id, status: 'browsed' } as VideoRecord;
}

describe('records export runtime', () => {
  it('returns local filtered records when server mode is inactive', async () => {
    const localRecords = [record('A')];
    const getExportData = vi.fn();
    const runtime = createRecordsExportRuntime({
      isServerModeActive: () => false,
      getFilteredRecords: () => localRecords,
      getSearchText: () => 'ABC',
      getStatus: () => 'all',
      getSort: () => null,
      selectedTags: new Set<string>(['tag-a']),
      selectedListIds: new Set<string>(['list-a']),
      listNameById: new Map(),
      getAdvancedConditions: () => [],
      queryRecords: vi.fn(),
      showProgress: vi.fn(),
      hideProgress: vi.fn(),
      getExportData,
      exportController: { handleExportRecords: vi.fn() },
    });

    await expect(runtime.getRecordsForExport()).resolves.toEqual(localRecords);
    expect(getExportData).not.toHaveBeenCalled();
  });

  it('passes current server query state into export data provider', async () => {
    const exported = [record('B')];
    const getExportData = vi.fn(async () => exported);
    const selectedTags = new Set<string>(['tag-a']);
    const selectedListIds = new Set<string>(['list-a']);
    const listNameById = new Map([['list-a', 'List A']]);
    const advancedConditions = [{ id: 'cond', field: 'id', op: 'contains', value: 'B' }];

    const runtime = createRecordsExportRuntime({
      isServerModeActive: () => true,
      getFilteredRecords: () => [record('local')],
      getSearchText: () => 'B',
      getStatus: () => 'viewed',
      getSort: () => ({ field: 'updatedAt', direction: 'desc' }),
      selectedTags,
      selectedListIds,
      listNameById,
      getAdvancedConditions: () => advancedConditions,
      queryRecords: vi.fn(),
      showProgress: vi.fn(),
      hideProgress: vi.fn(),
      getExportData,
      exportController: { handleExportRecords: vi.fn() },
    });

    await expect(runtime.getRecordsForExport()).resolves.toEqual(exported);
    expect(getExportData).toHaveBeenCalledWith(expect.objectContaining({
      serverModeActive: true,
      searchText: 'B',
      status: 'viewed',
      sort: { field: 'updatedAt', direction: 'desc' },
      selectedTags,
      selectedListIds,
      listNameById,
      advancedConditions,
    }));
  });

  it('delegates export button handling to export controller', async () => {
    const handleExportRecords = vi.fn();
    const runtime = createRecordsExportRuntime({
      isServerModeActive: () => false,
      getFilteredRecords: () => [],
      getSearchText: () => '',
      getStatus: () => 'all',
      getSort: () => null,
      selectedTags: new Set<string>(),
      selectedListIds: new Set<string>(),
      listNameById: new Map(),
      getAdvancedConditions: () => [],
      queryRecords: vi.fn(),
      showProgress: vi.fn(),
      hideProgress: vi.fn(),
      getExportData: vi.fn(),
      exportController: { handleExportRecords },
    });

    await runtime.handleExportRecords();

    expect(handleExportRecords).toHaveBeenCalledTimes(1);
  });
});
