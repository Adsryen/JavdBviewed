import { describe, expect, it } from 'vitest';
import {
  buildCurrentReportExportFilename,
  buildInsightsMarkdownPlaceholder,
  buildSelectedReportsJsonFilename,
  getSelectedInsightHistoryMonths,
} from './reportExportModel';

describe('insights report export model', () => {
  it('builds current report export filenames from month inputs', () => {
    expect(buildCurrentReportExportFilename('html', '2026-05', '2026-06'))
      .toBe('javdb-insights-202605~202606.html');
    expect(buildCurrentReportExportFilename('md', '', ''))
      .toBe('javdb-insights-cur~cur.md');
  });

  it('builds selected reports json filename from date', () => {
    expect(buildSelectedReportsJsonFilename(new Date('2026-06-02T10:00:00Z')))
      .toBe('javdb-insights-selected-20260602.json');
  });

  it('builds markdown placeholder for current preview and saved month', () => {
    expect(buildInsightsMarkdownPlaceholder()).toContain('# 观影标签月报（预览）');
    expect(buildInsightsMarkdownPlaceholder('2026-05')).toContain('# 观影标签月报（2026-05）');
  });

  it('reads selected history months from a checkbox container', () => {
    const inputs = [
      { checked: true, getAttribute: () => '2026-05' },
      { checked: false, getAttribute: () => '2026-06' },
      { checked: true, getAttribute: () => '' },
      { checked: true, getAttribute: () => '2026-07' },
    ];
    const container = {
      querySelectorAll: () => inputs,
    };

    expect(getSelectedInsightHistoryMonths(container)).toEqual(['2026-05', '2026-07']);
    expect(getSelectedInsightHistoryMonths(null)).toEqual([]);
  });
});
