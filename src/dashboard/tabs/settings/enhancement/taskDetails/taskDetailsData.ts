export type TaskDetailsHost = any;

export function buildTaskDetailsFingerprint(rows: any[]): string {
  return JSON.stringify((rows || []).map((row: any) => ({
    label: row?.label,
    parentLabel: row?.parentLabel,
    subtaskLabel: row?.subtaskLabel,
    batchIndex: row?.batchIndex,
    itemCount: row?.itemCount,
    phase: row?.phase,
    status: row?.status,
    pageInstanceId: row?.pageInstanceId,
    tabId: row?.tabId,
    createdAt: row?.createdAt ?? row?.timestamp,
    startedAt: row?.startedAt,
    endedAt: row?.endedAt,
    waitReason: row?.waitReason,
    durationMs: row?.durationMs,
    detail: row?.detail,
  })));
}

export function getTaskDetailsSourceData(host: TaskDetailsHost): any[] {
  return host.taskDetailsSearchQuery ? host.taskDetailsFilteredData : host.taskDetailsData;
}

export function getTaskDetailsPageSummarySourceData(host: TaskDetailsHost): any[] {
  return host.taskDetailsSearchQuery ? host.taskDetailsPageSummaryFilteredData : host.taskDetailsPageSummaryData;
}

export function getPagePath(url?: string): string {
  if (!url) return '-';
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

export function formatTaskDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

export function formatTaskTimestamp(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return '-';
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch {
    return '-';
  }
}

export function getTaskRegisteredAt(task: any): number {
  return typeof task?.createdAt === 'number' ? task.createdAt : (typeof task?.timestamp === 'number' ? task.timestamp : 0);
}

export function getTaskStartedAt(task: any): number {
  return typeof task?.startedAt === 'number' ? task.startedAt : 0;
}

export function getTaskEndedAt(task: any): number {
  return typeof task?.endedAt === 'number' ? task.endedAt : 0;
}

export function getTaskEffectiveEndAt(_host: TaskDetailsHost, task: any): number {
  const endAt = getTaskEndedAt(task);
  if (endAt > 0) return endAt;
  if (isTerminalTaskStatus(task?.status)) return getTaskStartedAt(task) || getTaskRegisteredAt(task);
  return Date.now();
}

export function getTaskWaitDurationMs(task: any): number {
  const r = getTaskRegisteredAt(task);
  const s = getTaskStartedAt(task);
  if (r <= 0 || s <= 0 || s < r) return 0;
  return s - r;
}

export function getTaskRunDurationMs(host: TaskDetailsHost, task: any): number {
  const s = getTaskStartedAt(task);
  if (s <= 0) return 0;
  const e = getTaskEffectiveEndAt(host, task);
  if (e <= 0 || e < s) return 0;
  return e - s;
}

export function getTaskPendingReasonLabel(waitReason?: string): string {
  if (!waitReason) return '等待调度';
  const map: Record<string, string> = {
    phase_serialized: '阶段串行等待',
    concurrency_limit: '并发受限',
    visibility_wait: '页面不可见',
    manual_pause: '手动暂停',
    dependency_wait: '依赖等待',
  };
  return map[waitReason] || waitReason;
}

export function isTerminalTaskStatus(status?: string): boolean {
  return ['done', 'error', 'canceled', 'timeout'].includes(status || '');
}

export function getTaskDisplayReason(task: any): string {
  if (task?.status === 'queued' || task?.status === 'pending') return getTaskPendingReasonLabel(task?.waitReason);
  return task?.detail || '-';
}

export function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getPageSummaryTasks(_host: TaskDetailsHost, item: any): any[] {
  return Array.isArray(item?.tasks) ? item.tasks : [];
}

export function buildPageSummaryReasonStats(tasks: any[]): Array<{ label: string; count: number }> {
  const stats = new Map<string, number>();
  for (const task of tasks || []) {
    const label = getTaskDisplayReason(task);
    stats.set(label, (stats.get(label) || 0) + 1);
  }
  return Array.from(stats.entries()).map(([label, count]) => ({ label, count }));
}

export function buildTaskDetailPageSummaries(tasks: any[]): any[] {
  const groups = new Map<string, any[]>();
  for (const task of tasks || []) {
    const key = `${task?.pageUrl || ''}__${task?.pageInstanceId || ''}`;
    const arr = groups.get(key) || [];
    arr.push(task);
    groups.set(key, arr);
  }
  return Array.from(groups.entries()).map(([groupKey, items]) => {
    const first = items[0] || {};
    const pageUrl = first?.pageUrl || '';
    const reasonStats = buildPageSummaryReasonStats(items);
    return {
      groupKey,
      pageUrl,
      pagePath: getPagePath(pageUrl),
      pageInstanceId: first?.pageInstanceId || '-',
      tabId: typeof first?.tabId === 'number' ? first.tabId : '-',
      taskCount: items.length,
      runningCount: items.filter((t: any) => t?.status === 'running').length,
      queuedCount: items.filter((t: any) => ['queued', 'pending'].includes(t?.status)).length,
      errorCount: items.filter((t: any) => ['error', 'timeout'].includes(t?.status)).length,
      completedCount: items.filter((t: any) => t?.status === 'done').length,
      tasks: items,
      reasonStats,
    };
  });
}

export function getTaskDetailsGroupedParents(data: any[]): Array<{ parentKey: string; parent: any; children: any[] }> {
  const groups = new Map<string, { parent: any; children: any[] }>();
  for (const item of data || []) {
    const parentKey = item?.parentLabel || item?.label || '-';
    if (!groups.has(parentKey)) groups.set(parentKey, { parent: item, children: [] });
    const group = groups.get(parentKey)!;
    if (item?.parentLabel) group.children.push(item);
    else group.parent = item;
  }
  return Array.from(groups.entries()).map(([parentKey, value]) => ({ parentKey, parent: value.parent, children: value.children }));
}
