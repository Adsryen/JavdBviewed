import { describe, expect, it } from 'vitest';
import { buildSamplePreviewFields } from './samplePreviewModel';

describe('insights sample preview model', () => {
  it('builds sample preview fields with visual report values', () => {
    const fields = buildSamplePreviewFields({
      personaName: '医生',
      baseHref: 'chrome-extension://ext/',
      generatedAt: '2026/6/2 15:50:00',
    });

    expect(fields.reportTitle).toBe('我的观影标签月报（示例）');
    expect(fields.periodText).toBe('统计范围：2026-04-01 ~ 2026-04-30（示例数据）');
    expect(fields.personaName).toBe('医生');
    expect(fields.baseHref).toBe('chrome-extension://ext/');
    expect(fields.generatedAt).toBe('2026/6/2 15:50:00');
    expect(fields.rankingRows).toContain('<td>剧情</td><td>18</td><td>24.0%</td>');
    expect(fields.reportBadge).toBe('Sample Wrapped');
    expect(fields.totalViews).toBe('74');
    expect(fields.activeDays).toBe('6');
    expect(fields.summary).toContain('生成自己的月报时');
    expect(fields.methodology).toContain('按本地观看记录去重后统计');
    expect(fields.viewerProfile).toContain('生成自己的月报时');
    expect(fields.summary).not.toContain('真实报告会');
    expect(fields.summary).not.toContain('AI 文案');
    expect(fields.methodology).not.toContain('真实报告会');
    expect(fields.viewerProfile).not.toContain('真实报告会');
    expect(JSON.parse(fields.statsJSON).metrics.totalAll).toBe(74);
  });
});
