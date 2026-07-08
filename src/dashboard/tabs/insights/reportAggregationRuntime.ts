import {
  aggregateMonthly as defaultAggregateMonthly,
  type AggregateOptions,
} from '../../../features/insights/aggregator';
import {
  aggregateCompareFromRecords as defaultAggregateCompareFromRecords,
  type CompareAggregateOptions,
} from '../../../features/insights/compareAggregator';
import type { VideoRecord } from '../../../types';
import type { ReportStats, ViewsDaily } from '../../../types/insights';
import type { MonthRangePeriod, PreviousPeriod } from './reportPeriodModel';
import { buildPreviousPeriod } from './reportPeriodModel';

export type InsightsAggregationMode = 'views' | 'compare' | 'views-fallback';

export interface InsightsStatsAggregationResult {
  stats: ReportStats;
  days: ViewsDaily[];
  previousDays: ViewsDaily[];
  previousPeriod: PreviousPeriod;
  modeUsed: InsightsAggregationMode;
  baselineCount: number;
  newCount: number;
}

type InsightsAggregationSource = 'views' | 'compare' | 'auto';
type InsightsStatusScope = NonNullable<CompareAggregateOptions['statusScope']>;

interface InsightsSettingsInput {
  topN?: unknown;
  changeThresholdRatio?: unknown;
  minTagCount?: unknown;
  risingLimit?: unknown;
  fallingLimit?: unknown;
  source?: unknown;
  statusScope?: unknown;
  minMonthlySamples?: unknown;
}

interface NormalizedInsightsSettings {
  topN: number;
  changeThresholdRatio?: number;
  minTagCount?: number;
  risingLimit?: number;
  fallingLimit?: number;
  source: InsightsAggregationSource;
  statusScope: InsightsStatusScope;
  minMonthlySamples: number;
}

interface CompareAggregationResult {
  stats: ReportStats;
  baselineCount: number;
  newCount: number;
}

interface BuildInsightsStatsInput {
  period: MonthRangePeriod;
  insightsSettings?: InsightsSettingsInput | null;
  dbInsViewsRange: (start: string, end: string) => Promise<ViewsDaily[]>;
  fetchAllVideoRecordsPaged: (pageSize?: number) => Promise<VideoRecord[]>;
  aggregateMonthly?: (days: ViewsDaily[], options?: AggregateOptions) => ReportStats;
  aggregateCompareFromRecords?: (
    records: VideoRecord[],
    startMs: number,
    endMs: number,
    options?: CompareAggregateOptions,
  ) => CompareAggregationResult;
  statusScopeFallback?: 'viewed' | 'viewed_browsed' | 'viewed_browsed_want';
  onFallback?: (message: string) => void;
  addTrace?: (level: 'info' | 'warn' | 'error', tag: string, message?: string, data?: unknown) => void;
}

function readFiniteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number'
    ? value
    : (typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined);
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}

function readNumberInRange(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = readFiniteNumber(value);
  if (parsed === undefined || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

function readOptionalNumberInRange(value: unknown, min: number, max: number): number | undefined {
  const parsed = readFiniteNumber(value);
  if (parsed === undefined || parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
}

function resolveSource(value: unknown): InsightsAggregationSource {
  return value === 'views' || value === 'compare' || value === 'auto' ? value : 'auto';
}

function isStatusScope(value: unknown): value is InsightsStatusScope {
  return value === 'viewed' || value === 'viewed_browsed' || value === 'viewed_browsed_want';
}

function normalizeInsightsSettings(
  input: InsightsSettingsInput | null | undefined,
  statusScopeFallback?: InsightsStatusScope,
): NormalizedInsightsSettings {
  return {
    topN: readNumberInRange(input?.topN, 10, 1, 50),
    changeThresholdRatio: readOptionalNumberInRange(input?.changeThresholdRatio, 0, 1),
    minTagCount: readOptionalNumberInRange(input?.minTagCount, 0, 999),
    risingLimit: readOptionalNumberInRange(input?.risingLimit, 0, 50),
    fallingLimit: readOptionalNumberInRange(input?.fallingLimit, 0, 50),
    source: resolveSource(input?.source),
    statusScope: isStatusScope(input?.statusScope)
      ? input.statusScope
      : (statusScopeFallback ?? 'viewed'),
    minMonthlySamples: readNumberInRange(input?.minMonthlySamples, 10, 0, 999),
  };
}

function buildAggregateOptions(insightsSettings: NormalizedInsightsSettings, previousDays?: ViewsDaily[], statusScope?: InsightsStatusScope): AggregateOptions & { statusScope?: InsightsStatusScope } {
  return {
    topN: insightsSettings.topN,
    previousDays,
    changeThresholdRatio: insightsSettings.changeThresholdRatio,
    minTagCount: insightsSettings.minTagCount,
    risingLimit: insightsSettings.risingLimit,
    fallingLimit: insightsSettings.fallingLimit,
    ...(statusScope ? { statusScope } : {}),
  };
}

export async function buildInsightsStatsForPeriod(input: BuildInsightsStatsInput): Promise<InsightsStatsAggregationResult> {
  const insightsSettings = normalizeInsightsSettings(input.insightsSettings, input.statusScopeFallback);
  const aggregateMonthly = input.aggregateMonthly ?? defaultAggregateMonthly;
  const aggregateCompareFromRecords = input.aggregateCompareFromRecords ?? defaultAggregateCompareFromRecords;
  const previousPeriod = buildPreviousPeriod(input.period.startDate, input.period.endDate);
  const days = await input.dbInsViewsRange(input.period.periodStart, input.period.periodEnd);
  const previousDays = await input.dbInsViewsRange(previousPeriod.previousStart, previousPeriod.previousEnd);
  const startMs = input.period.startDate.getTime();
  const endMs = input.period.endDate.getTime();
  let stats: ReportStats;
  let modeUsed: InsightsAggregationMode = 'views';
  let baselineCount = 0;
  let newCount = 0;

  if (insightsSettings.source === 'views') {
    stats = aggregateMonthly(days, buildAggregateOptions(insightsSettings, previousDays));
    modeUsed = 'views';
  } else {
    const all = await input.fetchAllVideoRecordsPaged(800);
    const ret = aggregateCompareFromRecords(
      all,
      startMs,
      endMs,
      buildAggregateOptions(insightsSettings, undefined, insightsSettings.statusScope),
    );
    stats = ret.stats;
    baselineCount = ret.baselineCount;
    newCount = ret.newCount;
    if (insightsSettings.source === 'auto' && newCount < insightsSettings.minMonthlySamples) {
      stats = aggregateMonthly(days, buildAggregateOptions(insightsSettings, previousDays));
      modeUsed = 'views-fallback';
      input.onFallback?.(`compare 样本不足（${newCount} < 阈值 ${insightsSettings.minMonthlySamples}），已回退到“观看日表”口径。`);
    } else {
      modeUsed = 'compare';
    }
    try {
      input.addTrace?.('info', 'COMPARE', 'mode', {
        modeUsed,
        baselineCount,
        newCount,
        thresholds: { minMonthlySamples: insightsSettings.minMonthlySamples },
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
