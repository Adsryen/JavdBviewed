import { ViewsDaily, ReportStats, TagStat, TrendPoint, Changes } from "../../types/insights";

export interface AggregateOptions {
  topN?: number;
  // 用于显著变化计算的上月数据（可选）
  previousDays?: ViewsDaily[];
  // 显著变化阈值（按占比绝对变化），默认 0.08 = 8%
  changeThresholdRatio?: number;
  // 过滤噪声：最小计数阈值（当前或上月均小于该值则忽略），默认 3
  minTagCount?: number;
  // rising/falling 输出的最大条数，默认各 5
  risingLimit?: number;
  fallingLimit?: number;
}

export function aggregateMonthly(days: ViewsDaily[], opts: AggregateOptions = {}): ReportStats {
  const topN = opts.topN ?? 10;
  const changeThreshold = Number(opts.changeThresholdRatio ?? 0.08);
  const minTagCount = Number(opts.minTagCount ?? 3);
  const risingLimit = Number(opts.risingLimit ?? 5);
  const fallingLimit = Number(opts.fallingLimit ?? 5);

  // 1) 排序，构建当前月的趋势与总计
  const ordered = (days || []).slice().sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')));
  const tagTotals: Record<string, number> = {};
  const trend: TrendPoint[] = [];
  for (const d of ordered) {
    let dayTotal = 0;
    for (const [tag, cnt] of Object.entries(d.tags || {})) {
      const v = Number(cnt ?? 0) || 0;
      tagTotals[tag] = (tagTotals[tag] ?? 0) + v;
      dayTotal += v;
    }
    trend.push({ date: d.date, total: dayTotal });
  }

  const totalAll = Math.max(1, Object.values(tagTotals).reduce((a, b) => a + b, 0));
  const tagsTop: TagStat[] = Object.entries(tagTotals)
    .map(([name, count]) => ({ name, count, ratio: count / totalAll }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  // 2) 显著变化：对比上月（如提供）
  const changes: Changes = { newTags: [], rising: [], falling: [] };
  const prevDays = opts.previousDays || [];
  if (Array.isArray(prevDays) && prevDays.length > 0) {
    const prevTotals: Record<string, number> = {};
    for (const d of prevDays) {
      for (const [tag, cnt] of Object.entries(d.tags || {})) {
        prevTotals[tag] = (prevTotals[tag] ?? 0) + (Number(cnt ?? 0) || 0);
      }
    }
    const prevTotalAll = Math.max(1, Object.values(prevTotals).reduce((a, b) => a + b, 0));

    // 新增标签：当前有、上月无
    const newTags = Object.keys(tagTotals).filter(k => !prevTotals[k] && tagTotals[k] >= minTagCount);

    // 计算各标签的占比变化
    type DiffItem = { name: string; diff: number; cur: number; prev: number; };
    const diffs: DiffItem[] = [];
    const allTags = new Set<string>([...Object.keys(tagTotals), ...Object.keys(prevTotals)]);
    for (const tag of allTags) {
      const cur = tagTotals[tag] || 0;
      const prev = prevTotals[tag] || 0;
      // 忽略计数过小的噪声标签
      if (cur < minTagCount && prev < minTagCount) continue;
      const curR = cur / totalAll;
      const prevR = prev / prevTotalAll;
      const diff = curR - prevR; // 正数=上升，负数=下降
      if (Math.abs(diff) >= changeThreshold) {
        diffs.push({ name: tag, diff, cur, prev });
      }
    }

    const rising = diffs
      .filter(d => d.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, risingLimit)
      .map(d => d.name);
    const falling = diffs
      .filter(d => d.diff < 0)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, fallingLimit)
      .map(d => d.name);

    changes.newTags = newTags;
    changes.rising = rising;
    changes.falling = falling;
  }

  return { tagsTop, trend, changes };
}
