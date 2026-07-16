import { describe, expect, it } from 'vitest';
import {
  buildCloudPreviewStatItems,
  buildCloudPreviewStats,
  buildExtraStatItemHtml,
} from './previewStatsModel';

describe('WebDAV restore preview stats model', () => {
  it('uses background preview counts before cloud data fallback', () => {
    const stats = buildCloudPreviewStats({
      cloudData: {
        data: { a: {}, b: {} },
        actorRecords: { actorA: {} },
        idb: {
          magnets: [{ id: 'm1' }, { id: 'm2' }],
          magnetPushLogs: [{ id: 'p1' }],
        },
      },
      previewCounts: {
        viewed: 9,
        actors: 8,
        magnets: 7,
        magnetPushLogs: 6,
      },
    });

    expect(stats).toEqual({
      videoCount: 9,
      actorCount: 8,
      newWorksSubscriptionCount: 0,
      newWorksRecordCount: 0,
      magnetCount: 7,
      magnetPushLogCount: 6,
    });
  });

  it('falls back to storageAll and IndexedDB arrays for preview stats', () => {
    const stats = buildCloudPreviewStats({
      cloudData: {
        storageAll: {
          viewed: { a: {}, b: {}, c: {} },
          actor_records: { actorA: {}, actorB: {} },
          new_works_subscriptions: { subA: {} },
          new_works_records: { recA: {}, recB: {} },
        },
        idb: {
          magnets: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
          magnetPushLogs: [{ id: 'p1' }, { id: 'p2' }],
        },
      },
      previewCounts: {},
    });

    expect(stats).toEqual({
      videoCount: 3,
      actorCount: 2,
      newWorksSubscriptionCount: 1,
      newWorksRecordCount: 2,
      magnetCount: 3,
      magnetPushLogCount: 2,
    });
  });

  it('builds DOM target mapping for fixed and extra stat items', () => {
    const items = buildCloudPreviewStatItems({
      videoCount: 1,
      actorCount: 2,
      newWorksSubscriptionCount: 3,
      newWorksRecordCount: 4,
      magnetCount: 5,
      magnetPushLogCount: 6,
    });

    expect(items).toEqual([
      { id: 'quickVideoCount', label: '观看记录', value: 1, fixed: true },
      { id: 'quickActorCount', label: '演员记录', value: 2, fixed: true },
      { id: 'quickNewWorksSubsCount', label: '新作品订阅', value: 3, fixed: true },
      { id: 'quickNewWorksRecsCount', label: '新作品记录', value: 4, fixed: true },
      { id: 'quickMagnetCount', label: '磁链缓存', value: 5, fixed: false },
      { id: 'quickMagnetPushLogCount', label: '磁力推送日志', value: 6, fixed: false },
    ]);
  });

  it('builds escaped extra stat item html', () => {
    const html = buildExtraStatItemHtml({
      id: 'quickMagnetCount',
      label: '磁链 <缓存>',
      value: 5,
      fixed: false,
    });

    expect(html).toContain('<span class="stat-number" id="quickMagnetCount">5</span>');
    expect(html).toContain('<span class="stat-label">磁链 &lt;缓存&gt;</span>');
  });
});
