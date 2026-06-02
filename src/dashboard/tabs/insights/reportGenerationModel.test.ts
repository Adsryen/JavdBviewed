import { describe, expect, it } from 'vitest';
import type { ReportStats } from '../../../types/insights';
import {
  buildReportGenerationFields,
  buildReportPlaceholderFields,
  resolveInsightsModelOverride,
} from './reportGenerationModel';

const sampleStats: ReportStats = {
  tagsTop: [
    { name: '剧情<强>', count: 6, ratio: 0.6 },
    { name: '美少女', count: 4, ratio: 0.4 },
  ],
  trend: [],
  changes: {
    newTags: ['新鲜'],
    rising: ['剧情'],
    falling: ['纯爱'],
    risingDetailed: [{ name: '剧情', cur: 6, prev: 2, curRatio: 0.6, prevRatio: 0.35, diffRatio: 0.25 }],
    fallingDetailed: [{ name: '纯爱', cur: 1, prev: 5, curRatio: 0.1, prevRatio: 0.35, diffRatio: -0.25 }],
  },
  metrics: {
    totalAll: 10,
    concentrationTop3: 0.75,
    trendSlope: 0.2,
    daysCount: 2,
  },
};

describe('insights report generation model', () => {
  it('builds rich report fields for preview generation', () => {
    const fields = buildReportGenerationFields({
      stats: sampleStats,
      startDate: new Date('2026-05-01T00:00:00+08:00'),
      endDate: new Date('2026-05-31T23:59:59+08:00'),
      startText: '2026-05-01',
      endText: '2026-05-31',
      daysCount: 3,
      modeUsed: 'compare',
      baselineCount: 20,
      newCount: 8,
      personaName: '医生',
      baseHref: 'chrome-extension://ext/',
      generatedAt: '2026/6/2 15:00:00',
    });

    expect(fields.reportTitle).toBe('我的5月观影标签报告');
    expect(fields.periodText).toBe('统计范围：2026-05-01 ~ 2026-05-31');
    expect(fields.summary).toContain('Top3 约 75.0%');
    expect(fields.summary).toContain('样本量：新增 8 / 基线 20');
    expect(fields.insightList).toContain('风格变化：偏好从「纯爱」向「剧情」迁移');
    expect(fields.insightList).toContain('新增样本：8；基线样本：20');
    expect(fields.rankingRows).toContain('剧情&lt;强&gt;');
    expect(fields.totalViews).toBe('10');
    expect(fields.activeDays).toBe('2');
    expect(fields.avgPerDay).toBe('5.0');
    expect(fields.totalTags).toBe('2');
    expect(fields.personaName).toBe('医生');
    expect(fields.baseHref).toBe('chrome-extension://ext/');
    expect(JSON.parse(fields.statsJSON).metrics.totalAll).toBe(10);
  });

  it('builds placeholder fields for save fallback', () => {
    const fields = buildReportPlaceholderFields({
      stats: sampleStats,
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      daysCount: 3,
      personaName: '医生',
      baseHref: 'chrome-extension://ext/',
      generatedAt: '2026/6/2 15:00:00',
    });

    expect(fields.reportTitle).toBe('我的观影标签报告');
    expect(fields.periodText).toBe('统计范围：2026-05-01 ~ 2026-05-31');
    expect(fields.summary).toBe('（占位）基于本地统计与模板生成的摘要。');
    expect(fields.insightList).toContain('累计观看天数：3 天');
    expect(fields.rankingRows).toContain('剧情&lt;强&gt;');
    expect(fields.viewerProfile).toContain('建议先生成预览');
  });

  it('resolves page model override from selector state', () => {
    expect(resolveInsightsModelOverride({
      hasSelector: true,
      selectedValue: '__custom__',
      customValue: '  gpt-custom  ',
      fallbackOverride: 'page-model',
    })).toBe('gpt-custom');

    expect(resolveInsightsModelOverride({
      hasSelector: true,
      selectedValue: 'gpt-4.1',
      customValue: 'gpt-custom',
      fallbackOverride: 'page-model',
    })).toBe('gpt-4.1');

    expect(resolveInsightsModelOverride({
      hasSelector: false,
      selectedValue: '',
      customValue: '',
      fallbackOverride: 'page-model',
    })).toBe('page-model');
  });
});
