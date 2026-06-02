import type { ReportStats } from '../../types/insights';

export interface VisualFieldOptions {
  activeDays?: number;
  modeLabel?: string;
}

function escapeHTML(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPercent(value: unknown, digits = 1): string {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `${(numeric * 100).toFixed(digits)}%`;
}

function trendLabel(slope: unknown): { label: string; emoji: string } {
  const numeric = typeof slope === 'number' && Number.isFinite(slope) ? slope : 0;
  if (numeric > 0.1) return { label: '升温中', emoji: '📈' };
  if (numeric < -0.1) return { label: '放缓中', emoji: '📉' };
  return { label: '很稳定', emoji: '〰️' };
}

function buildSparklineSVG(stats: ReportStats): string {
  const trend = Array.isArray(stats?.trend) ? stats.trend : [];
  if (trend.length < 2) {
    return '<div class="sparkline-empty">趋势数据不足，等多看几天会更准</div>';
  }
  const width = 520;
  const height = 120;
  const padding = 14;
  const totals = trend.map((point) => Number(point?.total) || 0);
  const minTotal = Math.min(...totals);
  const maxTotal = Math.max(...totals);
  const span = Math.max(1, maxTotal - minTotal);
  const points = totals.map((total, index) => {
    const xPosition = padding + (index * (width - padding * 2)) / Math.max(1, totals.length - 1);
    const yPosition = height - padding - ((total - minTotal) * (height - padding * 2)) / span;
    return `${xPosition.toFixed(1)},${yPosition.toFixed(1)}`;
  }).join(' ');
  return [
    `<svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="每日标签趋势">`,
    '<defs><linearGradient id="sparkGradient" x1="0" x2="1" y1="0"><stop offset="0%" stop-color="#22c55e"/><stop offset="50%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>',
    `<polyline class="sparkline-fill" points="${padding},${height - padding} ${points} ${width - padding},${height - padding}" />`,
    `<polyline class="sparkline-line" points="${points}" />`,
    '</svg>',
  ].join('');
}

function buildTopBars(stats: ReportStats): string {
  const topTags = Array.isArray(stats?.tagsTop) ? stats.tagsTop.slice(0, 5) : [];
  if (!topTags.length) return '<div class="visual-empty">暂无可展示的标签排行</div>';
  const maxCount = Math.max(1, ...topTags.map((tag) => Number(tag?.count) || 0));
  return topTags.map((tag, index) => {
    const count = Number(tag?.count) || 0;
    const width = Math.max(8, Math.round((count / maxCount) * 100));
    const ratio = typeof tag?.ratio === 'number' ? tag.ratio : 0;
    return [
      '<div class="top-bar-row">',
      `<span class="top-bar-rank">${index + 1}</span>`,
      `<span class="top-bar-name">${escapeHTML(tag?.name)}</span>`,
      '<span class="top-bar-track">',
      `<span class="top-bar-fill" style="width:${width}%"></span>`,
      '</span>',
      `<span class="top-bar-value">${count} · ${formatPercent(ratio)}</span>`,
      '</div>',
    ].join('');
  }).join('');
}

function buildChangeCards(stats: ReportStats): string {
  const changes = (stats as any)?.changes || {};
  const rising = Array.isArray(changes.risingDetailed) ? changes.risingDetailed[0] : undefined;
  const falling = Array.isArray(changes.fallingDetailed) ? changes.fallingDetailed[0] : undefined;
  const fresh = Array.isArray(changes.newTagsDetailed) ? changes.newTagsDetailed[0] : undefined;
  const cards = [
    rising ? {
      icon: '🔥',
      title: '本月升温',
      text: `${escapeHTML(rising.name)} +${formatPercent(Math.abs(Number(rising.diffRatio) || 0))}`,
    } : undefined,
    falling ? {
      icon: '🧊',
      title: '热度回落',
      text: `${escapeHTML(falling.name)} -${formatPercent(Math.abs(Number(falling.diffRatio) || 0))}`,
    } : undefined,
    fresh ? {
      icon: '✨',
      title: '新鲜尝试',
      text: `${escapeHTML(fresh.name)} ${Number(fresh.count) || 0} 次`,
    } : undefined,
  ].filter(Boolean) as Array<{ icon: string; title: string; text: string }>;
  if (!cards.length) {
    cards.push({ icon: '🧭', title: '结构稳定', text: '没有特别突出的新增或迁移' });
  }
  return cards.map((card) => [
    '<div class="change-card">',
    `<div class="change-icon">${card.icon}</div>`,
    `<div class="change-title">${card.title}</div>`,
    `<div class="change-text">${card.text}</div>`,
    '</div>',
  ].join('')).join('');
}

export function buildInsightsVisualFields(stats: ReportStats, options: VisualFieldOptions = {}): Record<string, string> {
  const topTags = Array.isArray(stats?.tagsTop) ? stats.tagsTop : [];
  const metrics = (stats as any)?.metrics || {};
  const totalAll = Math.max(0, Number(metrics.totalAll) || topTags.reduce((sum, tag) => sum + (Number(tag?.count) || 0), 0));
  const activeDays = Math.max(0, Number(options.activeDays ?? metrics.daysCount ?? stats?.trend?.length ?? 0) || 0);
  const topTag = topTags[0];
  const topTagRatio = typeof topTag?.ratio === 'number' ? topTag.ratio : (totalAll > 0 ? (Number(topTag?.count) || 0) / totalAll : 0);
  const top3Share = typeof metrics.concentrationTop3 === 'number' ? metrics.concentrationTop3 : topTags.slice(0, 3).reduce((sum, tag) => sum + (Number(tag?.ratio) || 0), 0);
  const concentrationLabel = top3Share >= 0.6 ? '偏好很集中' : (top3Share <= 0.4 ? '探索很分散' : '口味比较均衡');
  const trend = trendLabel(metrics.trendSlope);
  const moodSeeds = topTags.slice(0, 3).map((tag) => escapeHTML(tag?.name)).filter(Boolean);
  const wrappedMood = moodSeeds.length ? moodSeeds.join(' · ') : '等待更多观看记录';

  return {
    totalViews: String(totalAll),
    activeDays: String(activeDays),
    avgPerDay: activeDays > 0 ? (totalAll / activeDays).toFixed(1) : '0.0',
    totalTags: String(topTags.length),
    topTagName: escapeHTML(topTag?.name || '暂无标签'),
    topTagCount: String(Number(topTag?.count) || 0),
    topTagPercent: formatPercent(topTagRatio),
    top3Share: formatPercent(top3Share),
    concentrationLabel,
    trendLabel: trend.label,
    trendEmoji: trend.emoji,
    wrappedMood,
    reportBadge: escapeHTML(options.modeLabel || 'Monthly Wrapped'),
    visualTopBars: buildTopBars(stats),
    sparklineSVG: buildSparklineSVG(stats),
    changeCards: buildChangeCards(stats),
  };
}
