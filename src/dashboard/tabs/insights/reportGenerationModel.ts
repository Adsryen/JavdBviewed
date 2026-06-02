import { buildInsightsVisualFields } from '../../../features/insights/visualFields';
import type { ReportStats, TagStat } from '../../../types/insights';
import type { InsightsAggregationMode } from './reportAggregationRuntime';
import { buildChineseMonthLabel, buildChineseMonthLabelFromDateText } from './reportPeriodModel';

const DISCLAIMER_HTML = '<b>免责声明</b>：本报告仅用于个人研究与学术讨论。<br/>涉及“成人/色情”相关标签的统计仅为客观数据分析，不构成鼓励或引导。<br/>报告严格面向成年语境，不涉及未成年人或非法情境；如发现不当内容请立即停止并删除。<br/>可在设置中关闭相关分析或隐藏敏感内容。';

interface BuildReportGenerationFieldsInput {
  stats: ReportStats;
  startDate: Date;
  endDate: Date;
  startText: string;
  endText: string;
  daysCount: number;
  modeUsed: InsightsAggregationMode;
  baselineCount: number;
  newCount: number;
  personaName: string;
  baseHref: string;
  generatedAt: string;
}

interface BuildReportPlaceholderFieldsInput {
  stats: ReportStats;
  periodStart: string;
  periodEnd: string;
  daysCount: number;
  personaName: string;
  baseHref: string;
  generatedAt: string;
}

interface ResolveModelOverrideInput {
  hasSelector: boolean;
  selectedValue?: string | null;
  customValue?: string | null;
  fallbackOverride?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function percent(value: unknown): string {
  const numberValue = typeof value === 'number' && isFinite(value) ? value : (Number(value) || 0);
  return `${(numberValue * 100).toFixed(1)}%`;
}

function getTopList(stats: ReportStats): TagStat[] {
  return Array.isArray(stats?.tagsTop) ? stats.tagsTop : [];
}

function getTotalAll(stats: ReportStats, topList: TagStat[]): number {
  return Number(stats?.metrics?.totalAll) || topList.reduce((sum, item) => sum + (Number(item?.count) || 0), 0) || 1;
}

function buildRankingRows(topList: TagStat[], totalAll: number): string {
  return topList.map((item, index) => {
    const ratio = typeof item?.ratio === 'number' && isFinite(item.ratio)
      ? item.ratio
      : ((Number(item?.count) || 0) / totalAll);
    return `<tr><td>${index + 1}</td><td>${escapeHtml(item?.name)}</td><td>${Number(item?.count) || 0}</td><td>${percent(ratio)}</td></tr>`;
  }).join('');
}

function buildChangeInsights(stats: ReportStats): string[] {
  const changes = stats?.changes || { newTags: [], rising: [], falling: [] };
  const insights: string[] = [];
  if (Array.isArray(changes.newTags) && changes.newTags.length) {
    insights.push(`新出现标签：${changes.newTags.slice(0, 5).join('、')}`);
  }
  if (Array.isArray(changes.rising) && changes.rising.length) {
    insights.push(`明显上升：${changes.rising.slice(0, 5).join('、')}`);
  }
  if (Array.isArray(changes.falling) && changes.falling.length) {
    insights.push(`明显下降：${changes.falling.slice(0, 5).join('、')}`);
  }
  return insights;
}

function buildTopBrief(stats: ReportStats): string {
  return getTopList(stats).slice(0, 5).map((item) => `${item.name}(${item.count})`).join('、');
}

export function buildReportGenerationFields(input: BuildReportGenerationFieldsInput): Record<string, string> {
  const topBrief = buildTopBrief(input.stats);
  const changeInsights = buildChangeInsights(input.stats);
  const methodology = input.modeUsed === 'compare'
    ? '口径：与上月对比，看看这个月新增看的内容，按标签的次数和占比来比较变化。'
    : '口径：按你的观看记录做简单统计，按天汇总后再算本月的前几名、占比和整体趋势（图表和排行由程序生成）。';
  const metrics = (input.stats?.metrics || {}) as NonNullable<ReportStats['metrics']>;
  const top3 = typeof metrics.concentrationTop3 === 'number' && isFinite(metrics.concentrationTop3)
    ? `${(metrics.concentrationTop3 * 100).toFixed(1)}%`
    : '-';
  const concentrationWord = typeof metrics.concentrationTop3 === 'number' && isFinite(metrics.concentrationTop3)
    ? (metrics.concentrationTop3 >= 0.6 ? '较集中' : (metrics.concentrationTop3 <= 0.4 ? '较分散' : '比较均衡'))
    : '-';
  const trend = typeof metrics.trendSlope === 'number'
    ? (metrics.trendSlope > 0.1 ? '上升' : (metrics.trendSlope < -0.1 ? '回落' : '平稳'))
    : '-';
  const risingTop = input.stats?.changes?.risingDetailed?.[0];
  const fallingTop = input.stats?.changes?.fallingDetailed?.[0];
  const styleShift = risingTop && fallingTop
    ? `风格变化：偏好从「${fallingTop.name}」向「${risingTop.name}」迁移（+${(Math.abs(risingTop.diffRatio || 0) * 100).toFixed(1)} 个百分点）`
    : '';
  const extraLine = input.modeUsed === 'compare'
    ? `新增样本：${input.newCount}；基线样本：${input.baselineCount}`
    : `累计观看天数：${input.daysCount} 天`;
  const insightList = [
    topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
    `集中度与分散度：Top3 占比 ${top3}（结构${concentrationWord}）`,
    `趋势：总体 ${trend}`,
    ...(styleShift ? [styleShift] : []),
    extraLine,
    ...changeInsights,
  ].map((item) => `<li>${item}</li>`).join('');
  const topList = getTopList(input.stats);
  const totalAll = getTotalAll(input.stats, topList);
  const monthLabel = buildChineseMonthLabelFromDateText(input.startText, input.endText)
    || buildChineseMonthLabel(input.startDate, input.endDate);

  return {
    reportTitle: `我的${monthLabel}观影标签报告`,
    periodText: `统计范围：${input.startText} ~ ${input.endText}`,
    summary: [
      `本月观影集中度较高，Top3 约 ${top3}，整体${trend}。`,
      Array.isArray(input.stats?.changes?.newTags) && input.stats.changes.newTags.length
        ? `出现了一些新标签：${input.stats.changes.newTags.slice(0, 3).join('、')}。`
        : '结构基本稳定，没有明显的偏好跳变。',
      input.modeUsed === 'compare'
        ? `样本量：新增 ${input.newCount} / 基线 ${input.baselineCount}，这些判断更偏趋势参考。`
        : '',
      '下月可以留意前述标签的占比变化，观察趋势是否延续。',
    ].filter(Boolean).join(' '),
    insightList,
    methodology,
    disclaimerHTML: DISCLAIMER_HTML,
    generatedAt: input.generatedAt,
    version: '0.0.1',
    personaName: input.personaName,
    baseHref: input.baseHref,
    statsJSON: JSON.stringify(input.stats || {}),
    rankingRows: buildRankingRows(topList, totalAll),
    totalViews: String(totalAll),
    activeDays: String(input.daysCount),
    avgPerDay: (totalAll / Math.max(input.daysCount, 1)).toFixed(1),
    totalTags: String(topList.length),
    viewerProfile: '基于你的观影习惯，你是一个多元探索型观影者。建议后续可以尝试相关类型的影片。',
    ...buildInsightsVisualFields(input.stats, {
      activeDays: input.modeUsed === 'compare' ? Number(input.stats?.metrics?.daysCount || 0) : input.daysCount,
      modeLabel: input.modeUsed === 'compare' ? 'Compare Wrapped' : 'Monthly Wrapped',
    }),
  };
}

export function buildReportPlaceholderFields(input: BuildReportPlaceholderFieldsInput): Record<string, string> {
  const topBrief = buildTopBrief(input.stats);
  const changeInsights = buildChangeInsights(input.stats);
  const topList = getTopList(input.stats);
  const totalAll = getTotalAll(input.stats, topList);

  return {
    reportTitle: '我的观影标签报告',
    periodText: `统计范围：${input.periodStart} ~ ${input.periodEnd}`,
    summary: '（占位）基于本地统计与模板生成的摘要。',
    insightList: [
      topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
      `累计观看天数：${input.daysCount} 天`,
      ...changeInsights,
    ].map((item) => `<li>${item}</li>`).join(''),
    methodology: '仅统计标签，按影片去重，图表本地渲染。',
    disclaimerHTML: DISCLAIMER_HTML,
    generatedAt: input.generatedAt,
    version: '0.0.1',
    personaName: input.personaName,
    baseHref: input.baseHref,
    statsJSON: JSON.stringify(input.stats || {}),
    rankingRows: buildRankingRows(topList, totalAll),
    viewerProfile: '基于你的观影习惯生成的画像会展示在这里；建议先生成预览，再保存为月报。',
    ...buildInsightsVisualFields(input.stats, { activeDays: input.daysCount, modeLabel: 'Monthly Wrapped' }),
  };
}

export function resolveInsightsModelOverride(input: ResolveModelOverrideInput): string | undefined {
  if (!input.hasSelector) {
    return input.fallbackOverride;
  }
  const selectedValue = (input.selectedValue || '').trim();
  if (selectedValue === '__custom__') {
    const customValue = (input.customValue || '').trim();
    return customValue || undefined;
  }
  return selectedValue || undefined;
}
