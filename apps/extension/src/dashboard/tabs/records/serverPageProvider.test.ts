import { describe, expect, it, vi } from 'vitest';
import { loadRecordsServerPage } from './serverPageProvider';
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

describe('records server page provider', () => {
  it('uses query mode when filters require a full query', async () => {
    const queryRecords = vi.fn().mockResolvedValue({ items: [record('AAA-001')], total: 1 });
    const pageRecords = vi.fn();

    const result = await loadRecordsServerPage({
      currentPage: 2,
      recordsPerPage: 20,
      searchText: 'AAA tag:字幕',
      status: 'viewed',
      sort: { orderBy: 'id', order: 'asc' },
      selectedTags: new Set(['高清']),
      selectedListIds: new Set(),
      listNameById: new Map(),
      advancedConditions: [],
      favoritesFilterActive: true,
      queryRecords,
      pageRecords,
      now: (() => {
        let value = 100;
        return () => {
          value += 12;
          return value;
        };
      })(),
    });

    expect(result.items.map(item => item.id)).toEqual(['AAA-001']);
    expect(result.total).toBe(1);
    expect(result.durationMs).toBe(12);
    expect(pageRecords).not.toHaveBeenCalled();
    expect(queryRecords).toHaveBeenCalledWith(expect.objectContaining({
      search: 'AAA',
      status: 'viewed',
      tags: ['高清', '字幕'],
      orderBy: 'id',
      order: 'asc',
      offset: 20,
      limit: 20,
      isFavorite: true,
    }));
  });

  it('uses fast page mode for simple status and updatedAt sort', async () => {
    const queryRecords = vi.fn();
    const pageRecords = vi.fn().mockResolvedValue({ items: [record('BBB-001')], total: 5 });

    const result = await loadRecordsServerPage({
      currentPage: 1,
      recordsPerPage: 10,
      searchText: '',
      status: 'all',
      sort: { orderBy: 'updatedAt', order: 'desc' },
      selectedTags: new Set(),
      selectedListIds: new Set(),
      listNameById: new Map(),
      advancedConditions: [],
      favoritesFilterActive: false,
      queryRecords,
      pageRecords,
      now: (() => {
        let value = 0;
        return () => {
          value += 5;
          return value;
        };
      })(),
    });

    expect(result.items.map(item => item.id)).toEqual(['BBB-001']);
    expect(result.total).toBe(5);
    expect(result.durationMs).toBe(5);
    expect(queryRecords).not.toHaveBeenCalled();
    expect(pageRecords).toHaveBeenCalledWith({
      offset: 0,
      limit: 10,
      orderBy: 'updatedAt',
      order: 'desc',
    });
  });
});
