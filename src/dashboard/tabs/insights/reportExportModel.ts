export type InsightsExportFormat = 'html' | 'md';

export interface InsightHistoryCheckboxLike {
  checked: boolean;
  getAttribute: (name: string) => string | null;
}

export interface InsightHistorySelectionContainerLike {
  querySelectorAll: (selector: string) => ArrayLike<InsightHistoryCheckboxLike>;
}

function normalizeMonthForFilename(month: string | null | undefined): string {
  const normalized = String(month || '').replaceAll('-', '').trim();
  return normalized || 'cur';
}

export function buildCurrentReportExportFilename(
  format: InsightsExportFormat,
  startMonth: string | null | undefined,
  endMonth: string | null | undefined,
): string {
  const start = normalizeMonthForFilename(startMonth);
  const end = normalizeMonthForFilename(endMonth);
  return `javdb-insights-${start}~${end}.${format}`;
}

export function buildSelectedReportsJsonFilename(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `javdb-insights-selected-${year}${month}${day}.json`;
}

export function buildInsightsMarkdownPlaceholder(month?: string): string {
  const title = month ? `# 观影标签月报（${month}）` : '# 观影标签月报（预览）';
  return [
    title,
    '',
    '- 该导出为占位，后续将输出结构化 Markdown 内容',
  ].join('\n');
}

export function getSelectedInsightHistoryMonths(
  container: InsightHistorySelectionContainerLike | null | undefined,
): string[] {
  try {
    if (!container) return [];
    const inputs = Array.from(container.querySelectorAll('input.history-select[type="checkbox"]'));
    return inputs
      .filter(input => input.checked)
      .map(input => input.getAttribute('data-month') || '')
      .filter(Boolean);
  } catch {
    return [];
  }
}
