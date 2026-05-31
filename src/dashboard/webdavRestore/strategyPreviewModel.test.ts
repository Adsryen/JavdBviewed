import { describe, expect, it } from 'vitest';
import { buildStrategyPreviewHtml } from './strategyPreviewModel';

const diffResult: any = {
  videoRecords: {
    summary: {
      totalLocal: 1200,
      totalCloud: 900,
      cloudOnlyCount: 12,
      localOnlyCount: 34,
      conflictCount: 7,
    },
  },
  actorRecords: {
    summary: {
      totalLocal: 80,
      totalCloud: 70,
      cloudOnlyCount: 3,
      conflictCount: 2,
    },
  },
  newWorks: {
    subscriptions: {
      summary: {
        cloudOnlyCount: 5,
        conflictCount: 1,
      },
    },
    records: {
      summary: {
        cloudOnlyCount: 9,
        conflictCount: 4,
      },
    },
  },
};

describe('WebDAV restore strategy preview model', () => {
  it('builds smart merge preview', () => {
    const html = buildStrategyPreviewHtml('smart', diffResult);

    expect(html).toContain('将会保留');
    expect(html).toContain('本地视频记录：1,200 条');
    expect(html).toContain('云端新增新作品记录：9 条');
    expect(html).toContain('冲突演员记录：2 个');
  });

  it('builds local strategy preview', () => {
    const html = buildStrategyPreviewHtml('local', diffResult);

    expect(html).toContain('保持现状');
    expect(html).toContain('本地演员收藏：80 个（保持不变）');
  });

  it('builds cloud strategy preview with data loss warning', () => {
    const html = buildStrategyPreviewHtml('cloud', diffResult);

    expect(html).toContain('完全恢复');
    expect(html).toContain('视频记录：恢复到 900 条');
    expect(html).toContain('本地独有的 34 条视频记录将会丢失');
  });

  it('builds manual strategy preview with estimated handling time', () => {
    const html = buildStrategyPreviewHtml('manual', diffResult);

    expect(html).toContain('手动控制');
    expect(html).toContain('需要处理的视频冲突：7 个');
    expect(html).toContain('预计处理时间：1 分钟');
  });

  it('returns an empty preview for unknown strategies', () => {
    expect(buildStrategyPreviewHtml('unknown', diffResult)).toBe('');
  });
});
