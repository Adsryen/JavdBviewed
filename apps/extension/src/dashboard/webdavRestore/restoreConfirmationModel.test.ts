import { describe, expect, it } from 'vitest';
import { buildRestoreConfirmationHtml, getRestoreStrategyLabel } from './restoreConfirmationModel';

describe('WebDAV restore confirmation model', () => {
  it('maps strategy keys to friendly labels', () => {
    expect(getRestoreStrategyLabel('smart')).toBe('智能合并');
    expect(getRestoreStrategyLabel('local')).toBe('保留本地');
    expect(getRestoreStrategyLabel('cloud')).toBe('使用云端');
    expect(getRestoreStrategyLabel('manual')).toBe('手动处理');
    expect(getRestoreStrategyLabel('custom')).toBe('custom');
  });

  it('builds confirmation html from strategy, content selections, and diff summary', () => {
    const html = buildRestoreConfirmationHtml({
      strategy: 'smart',
      selectedContent: ['webdavRestoreSettings', 'webdavRestoreActorRecords'],
      contentLabels: {
        webdavRestoreSettings: '扩展设置',
        webdavRestoreActorRecords: '演员库',
      },
      diffSummary: {
        videoCount: 1200,
        actorCount: 80,
        subscriptionCount: 12,
        recordCount: 34,
      },
    });

    expect(html).toContain('恢复策略');
    expect(html).toContain('智能合并');
    expect(html).toContain('恢复内容');
    expect(html).toContain('<li>扩展设置</li>');
    expect(html).toContain('<li>演员库</li>');
    expect(html).toContain('预期结果');
    expect(html).toContain('视频记录：');
    expect(html).toContain('1,200 条');
    expect(html).toContain('演员收藏：');
    expect(html).toContain('80 个');
    expect(html).toContain('新作品订阅：');
    expect(html).toContain('12 个');
    expect(html).toContain('新作品记录：');
    expect(html).toContain('34 条');
  });

  it('falls back to input identifiers when labels are missing', () => {
    const html = buildRestoreConfirmationHtml({
      strategy: 'cloud',
      selectedContent: ['missing-id'],
      contentLabels: {},
      diffSummary: {
        videoCount: 1,
        actorCount: 2,
        subscriptionCount: 3,
        recordCount: 4,
      },
    });

    expect(html).toContain('<li>missing-id</li>');
  });
});
