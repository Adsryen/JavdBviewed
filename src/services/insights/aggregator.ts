import { ViewsDaily, ReportStats, TagStat, TrendPoint, Changes } from "../../types/insights";
import { isValueableTag } from "../../utils/tagFilter";

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
      // 过滤无价值标签
      if (!isValueableTag(tag)) continue;
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
        // 过滤无价值标签
        if (!isValueableTag(tag)) continue;
        prevTotals[tag] = (prevTotals[tag] ?? 0) + (Number(cnt ?? 0) || 0);
      }
    }
    const prevTotalAll = Math.max(1, Object.values(prevTotals).reduce((a, b) => a + b, 0));

    // 新增标签：当前有、上月无
    const newTags = Object.keys(tagTotals).filter(k => !prevTotals[k] && tagTotals[k] >= minTagCount);

    // 计算各标签的占比变化
    type DiffItem = { name: string; diff: number; cur: number; prev: number; curR: number; prevR: number };
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
        diffs.push({ name: tag, diff, cur, prev, curR, prevR });
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
    // 详细变化项（供文案更具体量化）
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
  }

  // 3) 聚合指标（集中度、分散度、走势）
  const ratios = Object.values(tagTotals).map(c => (c / totalAll)).filter(r => r > 0);
  const hhi = ratios.reduce((s, r) => s + r * r, 0);
  const entropy = -ratios.reduce((s, r) => s + r * Math.log(r), 0);
  const topRatiosSorted = Object.values(tagTotals).sort((a, b) => b - a).map(c => c / totalAll);
  const concentrationTop3 = (topRatiosSorted[0] || 0) + (topRatiosSorted[1] || 0) + (topRatiosSorted[2] || 0);
  const daysCount = ordered.length;
  // 趋势斜率（最小二乘，x=0..n-1，y=day total）
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

  return {
    tagsTop,
    trend,
    changes,
    metrics: {
      totalAll,
      concentrationTop3,
      hhi,
      entropy,
      trendSlope,
      daysCount,
    }
  };
}
