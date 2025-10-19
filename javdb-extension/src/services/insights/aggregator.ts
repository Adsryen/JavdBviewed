import { ViewsDaily, ReportStats, TagStat, TrendPoint, Changes } from "../../types/insights";

export interface AggregateOptions {
  topN?: number;
}

export function aggregateMonthly(days: ViewsDaily[], opts: AggregateOptions = {}): ReportStats {
  const topN = opts.topN ?? 10;
  // Sort days by date ascending to ensure stable trend
  const ordered = (days || []).slice().sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')));

  // Sum tags
  const tagTotals: Record<string, number> = {};
  const trend: TrendPoint[] = [];

  for (const d of ordered) {
    let dayTotal = 0;
    for (const [tag, cnt] of Object.entries(d.tags || {})) {
      tagTotals[tag] = (tagTotals[tag] ?? 0) + (cnt ?? 0);
      dayTotal += cnt ?? 0;
    }
    trend.push({ date: d.date, total: dayTotal });
  }

  const totalAll = Object.values(tagTotals).reduce((a, b) => a + b, 0) || 1;
  const tagsTop: TagStat[] = Object.entries(tagTotals)
    .map(([name, count]) => ({ name, count, ratio: count / totalAll }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  const changes: Changes = { newTags: [], rising: [], falling: [] };
  // Placeholder: real change detection needs previous month data.

  return { tagsTop, trend, changes };
}
