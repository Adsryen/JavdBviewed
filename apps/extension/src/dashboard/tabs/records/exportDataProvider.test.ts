import { describe, expect, it, vi } from 'vitest';
import { getRecordsForExportData } from './exportDataProvider';
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

describe('records export data provider', () => {
  it('returns filtered records directly in local mode', async () => {
    const filteredRecords = [record('AAA-001')];
    const queryRecords = vi.fn();
    const showProgress = vi.fn();
    const hideProgress = vi.fn();

    const result = await getRecordsForExportData({
      serverModeActive: false,
      filteredRecords,
      searchText: '',
      status: 'all',
      sort: { orderBy: 'updatedAt', order: 'desc' },
      selectedTags: new Set(),
      selectedListIds: new Set(),
      listNameById: new Map(),
      advancedConditions: [],
      queryRecords,
      showProgress,
      hideProgress,
    });

    expect(result).toBe(filteredRecords);
    expect(queryRecords).not.toHaveBeenCalled();
    expect(showProgress).not.toHaveBeenCalled();
  });

  it('queries all matching records in server mode and closes progress modal', async () => {
    const progressModal = {} as HTMLElement;
    const queryRecords = vi.fn().mockResolvedValue({ items: [record('BBB-001')], total: 1 });
    const showProgress = vi.fn(() => progressModal);
    const hideProgress = vi.fn();

    const result = await getRecordsForExportData({
      serverModeActive: true,
      filteredRecords: [],
      searchText: 'BBB tag:字幕 list:收藏',
      status: 'viewed',
      sort: { orderBy: 'id', order: 'asc' },
      selectedTags: new Set(['高清']),
      selectedListIds: new Set(['manual-list']),
      listNameById: new Map([
        ['list-1', '我的收藏'],
      ]),
      advancedConditions: [{ id: 'cond-1', field: 'title', op: 'contains', value: '测试' }],
      queryRecords,
      showProgress,
      hideProgress,
    });

    expect(result.map(item => item.id)).toEqual(['BBB-001']);
    expect(showProgress).toHaveBeenCalledWith('正在准备导出数据...', 1);
    expect(hideProgress).toHaveBeenCalledWith(progressModal);
    expect(queryRecords).toHaveBeenCalledWith(expect.objectContaining({
      search: 'BBB',
      status: 'viewed',
      tags: ['高清', '字幕'],
      listIds: ['manual-list', 'list-1'],
      orderBy: 'id',
      order: 'asc',
      offset: 0,
      limit: 999999,
      adv: [{ field: 'title', op: 'contains', value: '测试' }],
    }));
    expect(queryRecords.mock.calls[0][0].isFavorite).toBeUndefined();
  });
});
