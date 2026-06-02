import type { ReportStats } from '../../../types/insights';
import { buildInsightsVisualFields } from '../../../features/insights/visualFields';

interface BuildSamplePreviewFieldsInput {
  personaName: string;
  baseHref: string;
  generatedAt: string;
}

const SAMPLE_STATS: ReportStats = {
  tagsTop: [
    { name: '剧情', count: 18, ratio: 0.24 },
    { name: '制服', count: 14, ratio: 0.19 },
    { name: '素人', count: 11, ratio: 0.15 },
    { name: '企划', count: 9, ratio: 0.12 },
    { name: '高清', count: 8, ratio: 0.11 },
    { name: '收藏向', count: 6, ratio: 0.08 },
  ],
  trend: [
    { date: '2026-04-01', total: 3 },
    { date: '2026-04-05', total: 8 },
    { date: '2026-04-09', total: 5 },
    { date: '2026-04-13', total: 12 },
    { date: '2026-04-17', total: 9 },
    { date: '2026-04-21', total: 16 },
  ],
  changes: {
    newTags: ['收藏向', '企划'],
    rising: ['剧情', '制服'],
    falling: ['高清'],
    newTagsDetailed: [{ name: '收藏向', count: 6 }, { name: '企划', count: 9 }],
    risingDetailed: [
      { name: '剧情', cur: 18, prev: 9, curRatio: 0.24, prevRatio: 0.12, diffRatio: 0.12 },
      { name: '制服', cur: 14, prev: 8, curRatio: 0.19, prevRatio: 0.11, diffRatio: 0.08 },
    ],
    fallingDetailed: [
      { name: '高清', cur: 8, prev: 16, curRatio: 0.11, prevRatio: 0.22, diffRatio: -0.11 },
    ],
  },
  metrics: {
    totalAll: 74,
    concentrationTop3: 0.58,
    hhi: 0.17,
    entropy: 1.72,
    trendSlope: 1.8,
    daysCount: 6,
  },
};

function buildSampleRankingRows(): string {
  return SAMPLE_STATS.tagsTop.map((item, index) => {
    const ratio = typeof item.ratio === 'number' ? item.ratio : 0;
    return `<tr><td>${index + 1}</td><td>${item.name}</td><td>${item.count}</td><td>${(ratio * 100).toFixed(1)}%</td></tr>`;
  }).join('');
}

export function buildSamplePreviewFields(input: BuildSamplePreviewFieldsInput): Record<string, string> {
  return {
    reportTitle: '我的观影标签月报（示例）',
    periodText: '统计范围：2026-04-01 ~ 2026-04-30（示例数据）',
    summary: '这个示例展示的是新版 Wrapped 风格：本月主打标签是「剧情」，Top3 占比 58.0%，说明偏好比较集中但还保留了一点探索空间。中后段热度明显升温，「剧情」比上期多了 12.0 个百分点，「收藏向」和「企划」也开始冒头。真实报告会把这里替换成你的本地统计与 AI 文案。',
    insightList: [
      '<li>【主打标签】剧情 18 次，占 24.0%，是这个月最突出的关键词。</li>',
      '<li>【集中度】Top3 占比 58.0%，口味比较集中，但不是完全单一路线。</li>',
      '<li>【变化】剧情 +12.0 个百分点，计数 9→18，明显升温。</li>',
      '<li>【新鲜感】收藏向 6 次，属于本月新出现的小探索。</li>',
      '<li>【节奏】月中后段趋势升温，观看节奏比月初更密集。</li>',
    ].join(''),
    methodology: '示例数据仅用于展示新版模板效果；真实报告会按本地观看记录去重后统计标签次数、占比、趋势和与上一周期的变化。',
    disclaimerHTML: '<b>免责声明</b>：本报告仅用于个人研究与学术讨论。<br/>涉及“成人/色情”相关标签的统计仅为客观数据分析，不构成鼓励或引导。<br/>报告严格面向成年语境，不涉及未成年人或非法情境；如发现不当内容请立即停止并删除。<br/>可在设置中关闭相关分析或隐藏敏感内容。',
    generatedAt: input.generatedAt,
    version: '0.0.1',
    personaName: input.personaName,
    baseHref: input.baseHref,
    statsJSON: JSON.stringify(SAMPLE_STATS),
    rankingRows: buildSampleRankingRows(),
    viewerProfile: '示例画像：你像是“有主线的探索型观影者”——会围绕剧情和制服这类稳定偏好深入，同时也会被新鲜企划吸引。真实报告会结合你的标签变化，给出更贴近个人口味的画像和下月方向。',
    ...buildInsightsVisualFields(SAMPLE_STATS, { activeDays: 6, modeLabel: 'Sample Wrapped' }),
  };
}
