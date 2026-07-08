import { describe, expect, it, vi } from 'vitest';
import type { VideoRecord } from '../../../types';
import type { ReportStats, ViewsDaily } from '../../../types/insights';
import { buildInsightsStatsForPeriod } from './reportAggregationRuntime';
import { buildMonthRangePeriod } from './reportPeriodModel';

function makeStats(totalAll: number): ReportStats {
  return {
    tagsTop: [],
    trend: [],
    changes: { newTags: [], rising: [], falling: [] },
    metrics: {
      totalAll,
      daysCount: 0,
    },
  };
}

describe('insights report aggregation runtime', () => {
  it('uses views source without loading all records', async () => {
    const period = buildMonthRangePeriod('2026-05', '2026-05');
    const dbInsViewsRange = vi.fn(async (start: string, end: string) => [{ date: start, tags: { 剧情: 3 }, movies: [end] }]);
    const fetchAllVideoRecordsPaged = vi.fn();
    const monthlyStats = makeStats(1);
    const aggregateMonthly = vi.fn(() => monthlyStats);

    const result = await buildInsightsStatsForPeriod({
      period,
      insightsSettings: {
        source: 'views',
        topN: 12,
        changeThresholdRatio: 0.2,
        minTagCount: 4,
        risingLimit: 3,
        fallingLimit: 2,
      },
      dbInsViewsRange,
      fetchAllVideoRecordsPaged,
      aggregateMonthly,
      aggregateCompareFromRecords: vi.fn(),
    });

    expect(result.modeUsed).toBe('views');
    expect(result.stats).toBe(monthlyStats);
    expect(fetchAllVideoRecordsPaged).not.toHaveBeenCalled();
    expect(aggregateMonthly).toHaveBeenCalledWith(
      [{ date: '2026-05-01', tags: { 剧情: 3 }, movies: ['2026-05-31'] }],
      expect.objectContaining({
        topN: 12,
        previousDays: [{ date: '2026-03-30', tags: { 剧情: 3 }, movies: ['2026-04-30'] }],
        changeThresholdRatio: 0.2,
        minTagCount: 4,
        risingLimit: 3,
        fallingLimit: 2,
      }),
    );
  });

  it('passes compare aggregation parameters from settings', async () => {
    const period = buildMonthRangePeriod('2026-05', '2026-05');
    const records: VideoRecord[] = [
      {
        id: 'record-1',
        title: '影片 1',
        status: 'browsed',
        tags: ['剧情'],
        createdAt: 1,
        updatedAt: new Date('2026-05-03T00:00:00+08:00').getTime(),
      },
    ];
    const compareStats = makeStats(2);
    const aggregateCompareFromRecords = vi.fn(() => ({
      stats: compareStats,
      baselineCount: 11,
      newCount: 8,
    }));

    const result = await buildInsightsStatsForPeriod({
      period,
      insightsSettings: {
        source: 'compare',
        topN: 9,
        changeThresholdRatio: 0.15,
        minTagCount: 2,
        risingLimit: 4,
        fallingLimit: 6,
        statusScope: 'viewed_browsed',
      },
      dbInsViewsRange: vi.fn(async (): Promise<ViewsDaily[]> => []),
      fetchAllVideoRecordsPaged: vi.fn(async () => records),
      aggregateMonthly: vi.fn(),
      aggregateCompareFromRecords,
    });

    expect(result.modeUsed).toBe('compare');
    expect(aggregateCompareFromRecords).toHaveBeenCalledWith(
      records,
      new Date('2026-05-01T00:00:00+08:00').getTime(),
      new Date('2026-05-31T23:59:59.999+08:00').getTime(),
      {
        topN: 9,
        previousDays: undefined,
        changeThresholdRatio: 0.15,
        minTagCount: 2,
        risingLimit: 4,
        fallingLimit: 6,
        statusScope: 'viewed_browsed',
      },
    );
  });

  it('falls back from auto compare to views when new sample count is below threshold', async () => {
    const period = buildMonthRangePeriod('2026-05', '2026-05');
    const onFallback = vi.fn();
    const addTrace = vi.fn();
    const fallbackStats = makeStats(3);
    const aggregateMonthly = vi.fn(() => fallbackStats);
    const aggregateCompareFromRecords = vi.fn(() => ({
      stats: makeStats(4),
      baselineCount: 9,
      newCount: 2,
    }));

    const result = await buildInsightsStatsForPeriod({
      period,
      insightsSettings: { source: 'auto', minMonthlySamples: 5, statusScope: 'viewed' },
      dbInsViewsRange: vi.fn(async () => []),
      fetchAllVideoRecordsPaged: vi.fn(async () => []),
      aggregateMonthly,
      aggregateCompareFromRecords,
      onFallback,
      addTrace,
    });

    expect(result.modeUsed).toBe('views-fallback');
    expect(result.stats).toBe(fallbackStats);
    expect(result.baselineCount).toBe(9);
    expect(result.newCount).toBe(2);
    expect(onFallback).toHaveBeenCalledWith('compare 样本不足（2 < 阈值 5），已回退到“观看日表”口径。');
    expect(addTrace).toHaveBeenCalledWith('info', 'COMPARE', 'mode', expect.objectContaining({
      modeUsed: 'views-fallback',
      baselineCount: 9,
      newCount: 2,
    }));
    expect(aggregateMonthly).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        previousDays: [],
        topN: 10,
        changeThresholdRatio: undefined,
        minTagCount: undefined,
        risingLimit: undefined,
        fallingLimit: undefined,
      }),
    );
  });

  it('uses defaults when persisted insights settings contain unsupported values', async () => {
    const period = buildMonthRangePeriod('2026-05', '2026-05');
    const aggregateMonthly = vi.fn(() => makeStats(5));
    const aggregateCompareFromRecords = vi.fn(() => ({
      stats: makeStats(6),
      baselineCount: 0,
      newCount: 2,
    }));

    const result = await buildInsightsStatsForPeriod({
      period,
      insightsSettings: {
        source: 'unexpected',
        statusScope: 'all-status',
        minMonthlySamples: 'not-a-number',
      },
      statusScopeFallback: 'viewed_browsed',
      dbInsViewsRange: vi.fn(async (): Promise<ViewsDaily[]> => []),
      fetchAllVideoRecordsPaged: vi.fn(async (): Promise<VideoRecord[]> => []),
      aggregateMonthly,
      aggregateCompareFromRecords,
    });

    expect(result.modeUsed).toBe('views-fallback');
    expect(aggregateCompareFromRecords).toHaveBeenCalledWith(
      [],
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({
        statusScope: 'viewed_browsed',
      }),
    );
  });
});
