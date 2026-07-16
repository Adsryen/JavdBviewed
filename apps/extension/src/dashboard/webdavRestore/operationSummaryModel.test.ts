import { describe, expect, it } from 'vitest';
import {
  buildOperationSummaryHtml,
  buildOperationSummaryItems,
  buildRestoreResultModalCloseState,
  buildRestoreResultModalShowState,
} from './operationSummaryModel';

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

  it('builds operation summary html', () => {
    const html = buildOperationSummaryHtml([
      { label: '新增视频记录', value: 1, iconClass: 'fas fa-plus' },
      { label: '保留演员收藏', value: 2, iconClass: 'fas fa-user-check' },
    ]);

    expect(html).toContain('summary-item');
    expect(html).toContain('fas fa-plus');
    expect(html).toContain('新增视频记录');
    expect(html).toContain('1');
    expect(html).toContain('fas fa-user-check');
    expect(html).toContain('保留演员收藏');
    expect(html).toContain('2');
  });

  it('builds restore result modal visibility states', () => {
    expect(buildRestoreResultModalShowState()).toEqual({
      currentModalId: 'webdavRestoreModal',
      resultModalId: 'restoreResultModal',
      currentModalClassNamesToAdd: ['hidden'],
      resultModalClassNamesToRemove: ['hidden'],
      resultModalClassNamesToAdd: ['visible'],
    });

    expect(buildRestoreResultModalCloseState()).toEqual({
      resultModalId: 'restoreResultModal',
      resultModalClassNamesToAdd: ['hidden'],
      resultModalClassNamesToRemove: ['visible'],
      reloadDelayMs: 500,
    });
  });
});
