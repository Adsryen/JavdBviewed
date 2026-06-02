import { aggregateMonthly as defaultAggregateMonthly } from '../../../features/insights/aggregator';
import { aggregateCompareFromRecords as defaultAggregateCompareFromRecords } from '../../../features/insights/compareAggregator';
import type { VideoRecord } from '../../../types';
import type { ReportStats, ViewsDaily } from '../../../types/insights';
import type { MonthRangePeriod, PreviousPeriod } from './reportPeriodModel';
import { buildPreviousPeriod } from './reportPeriodModel';

export type InsightsAggregationMode = 'views' | 'compare' | 'views-fallback';

export interface InsightsStatsAggregationResult {
  stats: ReportStats;
  days: ViewsDaily[] | any[];
  previousDays: ViewsDaily[] | any[];
  previousPeriod: PreviousPeriod;
  modeUsed: InsightsAggregationMode;
  baselineCount: number;
  newCount: number;
}

interface BuildInsightsStatsInput {
  period: MonthRangePeriod;
  insightsSettings?: any;
  dbInsViewsRange: (start: string, end: string) => Promise<any[]>;
  fetchAllVideoRecordsPaged: (pageSize?: number) => Promise<VideoRecord[] | any[]>;
  aggregateMonthly?: typeof defaultAggregateMonthly | ((days: any[], options?: any) => any);
  aggregateCompareFromRecords?: typeof defaultAggregateCompareFromRecords | ((records: any[], startMs: number, endMs: number, options?: any) => any);
  statusScopeFallback?: 'viewed' | 'viewed_browsed' | 'viewed_browsed_want';
  onFallback?: (message: string) => void;
  addTrace?: (level: 'info' | 'warn' | 'error', tag: string, message?: string, data?: any) => void;
}

function buildAggregateOptions(insightsSettings: any, previousDays?: any[], statusScope?: string): any {
  return {
    topN: insightsSettings.topN ?? 10,
    previousDays,
    changeThresholdRatio: insightsSettings.changeThresholdRatio,
    minTagCount: insightsSettings.minTagCount,
    risingLimit: insightsSettings.risingLimit,
    fallingLimit: insightsSettings.fallingLimit,
    ...(statusScope ? { statusScope } : {}),
  };
}

export async function buildInsightsStatsForPeriod(input: BuildInsightsStatsInput): Promise<InsightsStatsAggregationResult> {
  const insightsSettings = input.insightsSettings || {};
  const aggregateMonthly = input.aggregateMonthly ?? defaultAggregateMonthly;
  const aggregateCompareFromRecords = input.aggregateCompareFromRecords ?? defaultAggregateCompareFromRecords;
  const previousPeriod = buildPreviousPeriod(input.period.startDate, input.period.endDate);
  const days = await input.dbInsViewsRange(input.period.periodStart, input.period.periodEnd);
  const previousDays = await input.dbInsViewsRange(previousPeriod.previousStart, previousPeriod.previousEnd);
  const source: 'views' | 'compare' | 'auto' = (insightsSettings.source as any) || 'auto';
  const statusScope = String((insightsSettings.statusScope as any) || input.statusScopeFallback || 'viewed');
  const startMs = input.period.startDate.getTime();
  const endMs = input.period.endDate.getTime();
  let stats: ReportStats;
  let modeUsed: InsightsAggregationMode = 'views';
  let baselineCount = 0;
  let newCount = 0;

  if (source === 'views') {
    stats = aggregateMonthly(days, buildAggregateOptions(insightsSettings, previousDays));
    modeUsed = 'views';
  } else {
    const all = await input.fetchAllVideoRecordsPaged(800);
    const ret = aggregateCompareFromRecords(
      all,
      startMs,
      endMs,
      buildAggregateOptions(insightsSettings, undefined, statusScope),
    );
    stats = ret.stats;
    baselineCount = ret.baselineCount;
    newCount = ret.newCount;
    const minSamples = Number(insightsSettings.minMonthlySamples ?? 10);
    if (source === 'auto' && newCount < minSamples) {
      stats = aggregateMonthly(days, buildAggregateOptions(insightsSettings, previousDays));
      modeUsed = 'views-fallback';
      input.onFallback?.(`compare 样本不足（${newCount} < 阈值 ${minSamples}），已回退到“观看日表”口径。`);
    } else {
      modeUsed = 'compare';
    }
    try {
      input.addTrace?.('info', 'COMPARE', 'mode', {
        modeUsed,
        baselineCount,
        newCount,
        thresholds: { minMonthlySamples: insightsSettings.minMonthlySamples ?? 10 },
      });
    } catch {}
  }

  return {
    stats,
    days,
    previousDays,
    previousPeriod,
    modeUsed,
    baselineCount,
    newCount,
  };
}
