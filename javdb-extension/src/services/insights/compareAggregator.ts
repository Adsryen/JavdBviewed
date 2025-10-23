import type { VideoRecord } from "../../types";
import type { ReportStats, TrendPoint, Changes, TagStat } from "../../types/insights";

export interface CompareAggregateOptions {
  topN?: number;
  changeThresholdRatio?: number;
  minTagCount?: number;
  risingLimit?: number;
  fallingLimit?: number;
  statusScope?: 'viewed' | 'viewed_browsed' | 'viewed_browsed_want';
}

function allowedStatuses(scope: CompareAggregateOptions['statusScope']): Array<VideoRecord['status']> {
  switch (scope) {
    case 'viewed_browsed':
      return ['viewed', 'browsed'];
    case 'viewed_browsed_want':
      return ['viewed', 'browsed', 'want'];
    case 'viewed':
    default:
      return ['viewed'];
  }
}

function ymd(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function aggregateCompareFromRecords(
  records: VideoRecord[],
  startMs: number,
  endMs: number,
  opts: CompareAggregateOptions = {}
): { stats: ReportStats; baselineCount: number; newCount: number } {
  const topN = opts.topN ?? 10;
  const changeThreshold = Number(opts.changeThresholdRatio ?? 0.08);
  const minTagCount = Number(opts.minTagCount ?? 3);
  const risingLimit = Number(opts.risingLimit ?? 5);
  const fallingLimit = Number(opts.fallingLimit ?? 5);
  const statuses = allowedStatuses(opts.statusScope || 'viewed');

  const inScope = (r: VideoRecord): boolean => statuses.includes(r.status);
  const inMonth = (r: VideoRecord): boolean => typeof r.updatedAt === 'number' && r.updatedAt >= startMs && r.updatedAt <= endMs;
  const beforeMonth = (r: VideoRecord): boolean => typeof r.updatedAt === 'number' && r.updatedAt < startMs;

  const newRecs = (records || []).filter(r => r && inScope(r) && inMonth(r));
  const baseRecs = (records || []).filter(r => r && inScope(r) && beforeMonth(r));

  // tagsTop: 针对当月新增
  const tagTotals: Record<string, number> = {};
  for (const r of newRecs) {
    const tags = Array.isArray(r.tags) ? r.tags : [];
    for (const t of tags) {
      const name = String(t || '').trim();
      if (!name) continue;
      tagTotals[name] = (tagTotals[name] ?? 0) + 1;
    }
  }
  const totalAll = Math.max(1, Object.values(tagTotals).reduce((a, b) => a + b, 0));
  const tagsTop: TagStat[] = Object.entries(tagTotals)
    .map(([name, count]) => ({ name, count, ratio: count / totalAll }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  // trend: 以新增记录的“每日标签总数”作为当日 total
  const trendMap: Record<string, number> = {};
  for (const r of newRecs) {
    const key = ymd(r.updatedAt);
    const tags = Array.isArray(r.tags) ? r.tags.length : 0;
    trendMap[key] = (trendMap[key] ?? 0) + tags;
  }
  const trend: TrendPoint[] = Object.keys(trendMap)
    .sort()
    .map(d => ({ date: d, total: trendMap[d] }));

  // changes: 对比“基线”与“新增”的占比变化
  const prevTotals: Record<string, number> = {};
  for (const r of baseRecs) {
    for (const t of (Array.isArray(r.tags) ? r.tags : [])) {
      const name = String(t || '').trim();
      if (!name) continue;
      prevTotals[name] = (prevTotals[name] ?? 0) + 1;
    }
  }
  const prevTotalAll = Math.max(1, Object.values(prevTotals).reduce((a, b) => a + b, 0));

  const newTags = Object.keys(tagTotals).filter(k => !prevTotals[k] && tagTotals[k] >= minTagCount);
  type DiffItem = { name: string; diff: number; cur: number; prev: number; curR: number; prevR: number };
  const diffs: DiffItem[] = [];
  const allTags = new Set<string>([...Object.keys(tagTotals), ...Object.keys(prevTotals)]);
  for (const tag of allTags) {
    const cur = tagTotals[tag] || 0;
    const prev = prevTotals[tag] || 0;
    if (cur < minTagCount && prev < minTagCount) continue;
    const curR = cur / totalAll;
    const prevR = prev / prevTotalAll;
    const diff = curR - prevR; // 正=上升
    if (Math.abs(diff) >= changeThreshold) diffs.push({ name: tag, diff, cur, prev, curR, prevR });
  }
  const rising = diffs.filter(d => d.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, risingLimit).map(d => d.name);
  const falling = diffs.filter(d => d.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, fallingLimit).map(d => d.name);
  const changes: Changes = { newTags, rising, falling };
  changes.risingDetailed = diffs
    .filter(d => d.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, risingLimit)
    .map(d => ({ name: d.name, cur: d.cur, prev: d.prev, curRatio: d.curR, prevRatio: d.prevR, diffRatio: d.diff }));
  changes.fallingDetailed = diffs
    .filter(d => d.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, fallingLimit)
    .map(d => ({ name: d.name, cur: d.cur, prev: d.prev, curRatio: d.curR, prevRatio: d.prevR, diffRatio: d.diff }));
  changes.newTagsDetailed = newTags.map(n => ({ name: n, count: tagTotals[n] || 0 }));

  // 指标：集中度/分散度/趋势与样本量
  const ratios = Object.values(tagTotals).map(c => (c / totalAll)).filter(r => r > 0);
  const hhi = ratios.reduce((s, r) => s + r * r, 0);
  const entropy = -ratios.reduce((s, r) => s + r * Math.log(r), 0);
  const topRatiosSorted = Object.values(tagTotals).sort((a, b) => b - a).map(c => c / totalAll);
  const concentrationTop3 = (topRatiosSorted[0] || 0) + (topRatiosSorted[1] || 0) + (topRatiosSorted[2] || 0);
  const daysCount = trend.length;
  let trendSlope = 0;
  if (trend.length >= 2) {
    const n = trend.length;
    const meanX = (n - 1) / 2;
    const meanY = trend.reduce((s, p) => s + p.total, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const dx = i - meanX;
      const dy = trend[i].total - meanY;
      num += dx * dy;
      den += dx * dx;
    }
    trendSlope = den !== 0 ? (num / den) : 0;
  }

  const stats: ReportStats = {
    tagsTop,
    trend,
    changes,
    metrics: {
      totalAll,
      prevTotalAll,
      concentrationTop3,
      hhi,
      entropy,
      trendSlope,
      daysCount,
      baselineCount: baseRecs.length,
      newCount: newRecs.length,
    }
  };
  return { stats, baselineCount: baseRecs.length, newCount: newRecs.length };
}
