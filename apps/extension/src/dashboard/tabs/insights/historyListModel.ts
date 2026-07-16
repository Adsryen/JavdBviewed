import type { ReportMonthly } from '../../../types/insights';

interface BuildHistoryListHtmlOptions {
  titleExtractor?: (html: string) => string;
  formatCreatedAt?: (timestamp: number) => string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractReportTitle(html: string): string {
  try {
    if (typeof DOMParser === 'undefined') return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    const titleEl = doc.querySelector('#report-title');
    return titleEl?.textContent || '';
  } catch {
    return '';
  }
}

function formatCreatedAt(timestamp: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : '';
}

export function buildInsightsHistoryEmptyHtml(): string {
  return '<div style="color:#888; font-size:12px;">暂无历史月报</div>';
}

export function buildInsightsHistoryListHtml(
  records: ReportMonthly[],
  options: BuildHistoryListHtmlOptions = {},
): string {
  const titleExtractor = options.titleExtractor || extractReportTitle;
  const createdAtFormatter = options.formatCreatedAt || formatCreatedAt;

  return records.map((record) => {
    const timestamp = record.createdAt ? createdAtFormatter(record.createdAt) : '';
    const month = record.month || '';
    const title = record.period ? `${record.period.start} ~ ${record.period.end}` : month;
    const reportTitle = titleExtractor(record.html || '');
    const safeMonth = escapeHtml(month);

    return `
        <div class="history-item" data-month="${safeMonth}" style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border-primary);">
          <input type="checkbox" class="history-select" data-month="${safeMonth}" />
          <div style="flex:1;">
            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(reportTitle || month)}</div>
            <div style="color:var(--text-secondary); font-size:12px;">${escapeHtml(title)}</div>
            <div style="color:var(--text-muted); font-size:11px;">创建于 ${escapeHtml(timestamp)}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-secondary btn-sm history-preview-btn" data-action="preview" data-month="${safeMonth}"><i class="fas fa-eye"></i>&nbsp;预览</button>
          </div>
        </div>
      `;
  }).join('');
}
