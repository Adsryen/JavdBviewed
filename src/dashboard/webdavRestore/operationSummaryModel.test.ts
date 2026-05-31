import { describe, expect, it } from 'vitest';
import { buildOperationSummaryItems } from './operationSummaryModel';

describe('WebDAV restore operation summary model', () => {
  it('builds operation summary items from merge summary', () => {
    const items = buildOperationSummaryItems({
      videoRecords: { added: 1, updated: 2, kept: 3 },
      actorRecords: { added: 4, updated: 5, kept: 6 },
      newWorks: {
        subscriptions: { added: 7, updated: 8 },
        records: { added: 9, updated: 10 },
      },
    });

    expect(items.map(item => item.label)).toEqual([
      '新增视频记录',
      '更新视频记录',
      '保留视频记录',
      '新增演员收藏',
      '更新演员收藏',
      '保留演员收藏',
      '新增新作品订阅',
      '更新新作品订阅',
      '新增新作品记录',
      '更新新作品记录',
    ]);
    expect(items.map(item => item.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(items[0]).toMatchObject({ iconClass: 'fas fa-plus' });
    expect(items[5]).toMatchObject({ iconClass: 'fas fa-user-check' });
  });

  it('uses zero for missing optional new works summary', () => {
    const items = buildOperationSummaryItems({
      videoRecords: { added: 1, updated: 2, kept: 3 },
      actorRecords: { added: 4, updated: 5, kept: 6 },
    });

    expect(items.slice(6).map(item => item.value)).toEqual([0, 0, 0, 0]);
  });
});
