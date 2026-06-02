import { describe, expect, it, vi } from 'vitest';
import { buildInsightsStatsForPeriod } from './reportAggregationRuntime';
import { buildMonthRangePeriod } from './reportPeriodModel';

describe('insights report aggregation runtime', () => {
  it('uses views source without loading all records', async () => {
    const period = buildMonthRangePeriod('2026-05', '2026-05');
    const dbInsViewsRange = vi.fn(async (start: string, end: string) => [{ start, end }]);
    const fetchAllVideoRecordsPaged = vi.fn();
    const aggregateMonthly = vi.fn(() => ({ kind: 'monthly' }));

    const result = await buildInsightsStatsForPeriod({
      period,
      insightsSettings: { source: 'views', topN: 12 },
      dbInsViewsRange,
      fetchAllVideoRecordsPaged,
      aggregateMonthly,
      aggregateCompareFromRecords: vi.fn(),
    });

    expect(result.modeUsed).toBe('views');
    expect(result.stats).toEqual({ kind: 'monthly' });
    expect(fetchAllVideoRecordsPaged).not.toHaveBeenCalled();
    expect(aggregateMonthly).toHaveBeenCalledWith(
      [{ start: '2026-05-01', end: '2026-05-31' }],
      expect.objectContaining({
        topN: 12,
        previousDays: [{ start: '2026-03-30', end: '2026-04-30' }],
      }),
    );
  });

  it('falls back from auto compare to views when new sample count is below threshold', async () => {
    const period = buildMonthRangePeriod('2026-05', '2026-05');
    const onFallback = vi.fn();
    const addTrace = vi.fn();
    const aggregateMonthly = vi.fn(() => ({ kind: 'monthly-fallback' }));
    const aggregateCompareFromRecords = vi.fn(() => ({
      stats: { kind: 'compare' },
      baselineCount: 9,
      newCount: 2,
    }));

    const result = await buildInsightsStatsForPeriod({
      period,
      insightsSettings: { source: 'auto', minMonthlySamples: 5, statusScope: 'viewed' },
      dbInsViewsRange: vi.fn(async () => []),
      fetchAllVideoRecordsPaged: vi.fn(async () => [{ id: 'record-1' } as any]),
      aggregateMonthly,
      aggregateCompareFromRecords,
      onFallback,
      addTrace,
    });

    expect(result.modeUsed).toBe('views-fallback');
    expect(result.stats).toEqual({ kind: 'monthly-fallback' });
    expect(result.baselineCount).toBe(9);
    expect(result.newCount).toBe(2);
    expect(onFallback).toHaveBeenCalledWith('compare 样本不足（2 < 阈值 5），已回退到“观看日表”口径。');
    expect(addTrace).toHaveBeenCalledWith('info', 'COMPARE', 'mode', expect.objectContaining({
      modeUsed: 'views-fallback',
      baselineCount: 9,
      newCount: 2,
    }));
  });
});
