import { describe, expect, it } from 'vitest';
import type { ReportMonthly } from '../../../types/insights';
import {
  buildInsightsHistoryEmptyHtml,
  buildInsightsHistoryListHtml,
} from './historyListModel';

describe('insights history list model', () => {
  it('builds empty state html', () => {
    expect(buildInsightsHistoryEmptyHtml()).toBe('<div style="color:#888; font-size:12px;">暂无历史月报</div>');
  });

  it('builds history list html from reports', () => {
    const reports: ReportMonthly[] = [
      {
        month: '2026-05',
        period: { start: '2026-05-01', end: '2026-05-31' },
        stats: { tagsTop: [], trend: [], changes: { newTags: [], rising: [], falling: [] } },
        html: '<h1 id="report-title">五月报告</h1>',
        createdAt: 1780000000000,
        status: 'final',
        origin: 'manual',
      },
    ];

    const html = buildInsightsHistoryListHtml(reports, {
      titleExtractor: () => '五月报告',
      formatCreatedAt: () => '2026/6/2 15:30:00',
    });

    expect(html).toContain('data-month="2026-05"');
    expect(html).toContain('五月报告');
    expect(html).toContain('2026-05-01 ~ 2026-05-31');
    expect(html).toContain('创建于 2026/6/2 15:30:00');
    expect(html).toContain('data-action="preview"');
  });

  it('escapes report titles and month values', () => {
    const html = buildInsightsHistoryListHtml([
      {
        month: '2026-05" onclick="alert(1)',
        stats: { tagsTop: [], trend: [], changes: { newTags: [], rising: [], falling: [] } },
        html: '<h1 id="report-title">bad</h1>',
        createdAt: 0,
        status: 'final',
        origin: 'manual',
      } as ReportMonthly,
    ], {
      titleExtractor: () => '<script>alert(1)</script>',
      formatCreatedAt: () => '',
    });

    expect(html).toContain('2026-05&quot; onclick=&quot;alert(1)');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
