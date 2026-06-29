/**
 * @file trendUtils.ts
 * @description 新作品趋势工具 —— 每日统计快照的合并与趋势数据点计算
 * @module platform/storage
 */

/** 趋势日期范围 */
export type TrendDateRange = { date: string; startMs: number; endMs: number };
/** 趋势模式：cumulative=累计值, daily=每日增量 */
export type TrendMode = 'cumulative' | 'daily';
/** 每日统计数据 */
export type TrendDailyStats = { total: number; unread: number };
/** 趋势数据点 */
export type TrendPoint = { date: string; total: number; unread: number };
/** 趋势快照 */
export type TrendSnapshot = { date: string; total: number; unread: number };

/** 合并每日统计快照与实时数据（实时数据优先） */
export function mergeNewWorksDailyStatForTrend(
  snapshot: TrendDailyStats | undefined,
  live: TrendDailyStats,
): TrendDailyStats {
  if (!snapshot) {
    return {
      total: Number(live.total) || 0,
      unread: Number(live.unread) || 0,
    };
  }

  return {
    total: Math.max(Number(snapshot.total) || 0, Number(live.total) || 0),
    unread: Math.max(Number(snapshot.unread) || 0, Number(live.unread) || 0),
  };
}

export function buildNewWorksTrendPointsFromDailyMap(
  dates: readonly TrendDateRange[],
  dailyMap: ReadonlyMap<string, TrendDailyStats>,
  mode: TrendMode = 'cumulative',
): TrendPoint[] {
  const points: TrendPoint[] = [];
  let cumulativeTotal = 0;
  let cumulativeUnread = 0;

  for (const d of dates) {
    const day = dailyMap.get(d.date) || { total: 0, unread: 0 };
    if (mode === 'daily') {
      points.push({ date: d.date, total: day.total, unread: day.unread });
      continue;
    }

    cumulativeTotal += day.total;
    cumulativeUnread += day.unread;
    points.push({ date: d.date, total: cumulativeTotal, unread: cumulativeUnread });
  }

  return points;
}

export function buildNewWorksTrendPointsFromSnapshots(
  dates: readonly TrendDateRange[],
  snapshots: readonly TrendSnapshot[],
  mode: TrendMode = 'cumulative',
): TrendPoint[] {
  const dailyMap = new Map<string, TrendDailyStats>();
  for (const snapshot of snapshots) {
    if (!snapshot?.date) continue;
    dailyMap.set(snapshot.date, { total: Number(snapshot.total) || 0, unread: Number(snapshot.unread) || 0 });
  }
  return buildNewWorksTrendPointsFromDailyMap(dates, dailyMap, mode);
}
