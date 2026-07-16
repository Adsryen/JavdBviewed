export function getPagePath(url?: string): string {
  if (!url) return '-';
  try {
    const parsed = new URL(url);
    return `${parsed.pathname || '/'}${parsed.search || ''}`;
  } catch {
    return url;
  }
}

export function formatTaskDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function escapeHtml(value: any): string {
  const text = String(value ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getPageSummaryTasks(item: any, source: any[]): any[] {
  const groupKey = item?.groupKey || `${item?.tabId || -1}|${item?.pageInstanceId || ''}`;
  return source.filter((task) => `${task?.tabId || -1}|${task?.pageInstanceId || ''}` === groupKey);
}


export function formatTaskTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
