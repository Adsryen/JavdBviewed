export type TaskDetailsSortOrder = 'asc' | 'desc';

export function getTaskDetailSortValue(task: any, sortField: string, deps: {
  getTaskRegisteredAt: (task: any) => number;
  getTaskStartedAt: (task: any) => number;
  getTaskEffectiveEndAt: (task: any) => number;
  getTaskWaitDurationMs: (task: any) => number;
  getTaskRunDurationMs: (task: any) => number;
}): string | number {
  if (sortField === 'duration') return task?.durationMs || 0;
  if (sortField === 'createdAt') return deps.getTaskRegisteredAt(task);
  if (sortField === 'startedAt') return deps.getTaskStartedAt(task);
  if (sortField === 'endedAt') return deps.getTaskEffectiveEndAt(task);
  if (sortField === 'waitDurationMs') return deps.getTaskWaitDurationMs(task);
  if (sortField === 'runDurationMs') return deps.getTaskRunDurationMs(task);
  const rawValue = task?.[sortField];
  return typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : 0;
}

export function compareTaskDetailItems(a: any, b: any, sortField: string, sortOrder: TaskDetailsSortOrder, deps: {
  getTaskDetailSortValue: (task: any, sortField: string) => string | number;
  getTaskRegisteredAt: (task: any) => number;
}): number {
  const aVal = deps.getTaskDetailSortValue(a, sortField);
  const bVal = deps.getTaskDetailSortValue(b, sortField);

  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  }

  const aNum = typeof aVal === 'number' ? aVal : 0;
  const bNum = typeof bVal === 'number' ? bVal : 0;
  const isTimeField = ['createdAt', 'startedAt', 'endedAt'].includes(sortField);
  if (isTimeField) {
    const aMissing = aNum <= 0;
    const bMissing = bNum <= 0;
    if (aMissing !== bMissing) {
      return aMissing ? 1 : -1;
    }
  }
  if (aNum !== bNum) {
    return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
  }

  const aRegisteredAt = deps.getTaskRegisteredAt(a);
  const bRegisteredAt = deps.getTaskRegisteredAt(b);
  if (aRegisteredAt !== bRegisteredAt) {
    return sortOrder === 'asc' ? aRegisteredAt - bRegisteredAt : bRegisteredAt - aRegisteredAt;
  }

  return String(a?.label || '').localeCompare(String(b?.label || ''));
}

export function getTaskDetailsGroupedParents(data: any[], compareTaskDetailItems: (a: any, b: any) => number): Array<{ parentKey: string; parent: any; children: any[] }> {
  const sortedData = [...data].sort((a, b) => compareTaskDetailItems(a, b));
  const groups = new Map<string, { parent: any | null; fallbackChild: any | null; children: any[] }>();

  for (const task of sortedData) {
    const baseParentKey = task.parentLabel || task.label || 'unknown';
    const parentKey = `${baseParentKey}|${task.pageInstanceId || ''}|${task.pageUrl || ''}|${task.tabId || -1}`;
    if (!groups.has(parentKey)) {
      groups.set(parentKey, { parent: null, fallbackChild: null, children: [] });
    }

    const group = groups.get(parentKey)!;
    if (task.parentLabel && task.subtaskLabel) {
      group.children.push(task);
      if (!group.fallbackChild) {
        group.fallbackChild = task;
      }
      continue;
    }

    if (!group.parent) {
      group.parent = task;
    }
  }

  return Array.from(groups.entries()).map(([parentKey, group]) => {
    const parentLabel = group.fallbackChild?.parentLabel || String(parentKey).split('|')[0] || parentKey;
    const fallbackChild = group.fallbackChild || {};
    const parent = group.parent || {
      ...fallbackChild,
      label: parentLabel,
      parentLabel: undefined,
      subtaskLabel: undefined,
      batchIndex: undefined,
      itemCount: undefined,
      status: fallbackChild.status || 'done',
      durationMs: 0,
      registrationSource: fallbackChild.registrationSource || 'blueprint',
      timestamp: fallbackChild.timestamp || Date.now(),
      registeredAt: fallbackChild.registeredAt || fallbackChild.timestamp || 0,
      startedAt: fallbackChild.startedAt || fallbackChild.registeredAt || fallbackChild.timestamp || 0,
      endedAt: fallbackChild.endedAt || fallbackChild.timestamp || 0,
      __syntheticParent: true,
    };

    const children = group.children.sort((a, b) => {
      const ai = typeof a.batchIndex === 'number' ? a.batchIndex : 0;
      const bi = typeof b.batchIndex === 'number' ? b.batchIndex : 0;
      return ai - bi;
    });

    return { parentKey, parent, children };
  });
}

export function getVisibleTaskDetailGroups(args: {
  groupedParents: Array<{ parentKey: string; parent: any; children: any[] }>;
  currentPage: number;
  pageSize: number;
  includeCollapsedChildren?: boolean;
  expandedParents: Set<string>;
}): Array<{ parentKey: string; parent: any; children: any[] }> {
  const startIndex = (args.currentPage - 1) * args.pageSize;
  const endIndex = startIndex + args.pageSize;
  return args.groupedParents.slice(startIndex, endIndex).map((group) => ({
    parentKey: group.parentKey,
    parent: group.parent,
    children: (args.includeCollapsedChildren || args.expandedParents.has(group.parentKey)) ? [...group.children] : [],
  }));
}

export function getTaskRegisteredAt(task: any): number {
  const value = task?.registeredAt ?? task?.createdAt ?? task?.timestamp ?? 0;
  return typeof value === 'number' ? value : 0;
}

export function getTaskStartedAt(task: any): number {
  const value = task?.startedAt ?? 0;
  return typeof value === 'number' ? value : 0;
}

export function getTaskEndedAt(task: any): number {
  const value = task?.endedAt ?? 0;
  return typeof value === 'number' ? value : 0;
}

export function isTerminalTaskStatus(status?: string): boolean {
  return ['done', 'error', 'canceled'].includes(status || '');
}

export function getTaskEffectiveEndAt(task: any, deps: {
  getTaskEndedAt: (task: any) => number;
  getTaskStartedAt: (task: any) => number;
  isTerminalTaskStatus: (status?: string) => boolean;
}): number {
  const endedAt = deps.getTaskEndedAt(task);
  if (endedAt > 0) return endedAt;
  const startedAt = deps.getTaskStartedAt(task);
  const durationMs = task?.durationMs;
  if (
    deps.isTerminalTaskStatus(task?.status) &&
    startedAt > 0 &&
    typeof durationMs === 'number' &&
    Number.isFinite(durationMs) &&
    durationMs >= 0
  ) {
    return startedAt + durationMs;
  }
  return 0;
}

export function getTaskWaitDurationMs(task: any, deps: {
  getTaskRegisteredAt: (task: any) => number;
  getTaskStartedAt: (task: any) => number;
}): number {
  const createdAt = deps.getTaskRegisteredAt(task);
  const startedAt = deps.getTaskStartedAt(task);
  if (createdAt <= 0 || startedAt <= 0) return 0;
  return Math.max(0, startedAt - createdAt);
}

export function getTaskRunDurationMs(task: any, deps: {
  getTaskStartedAt: (task: any) => number;
  getTaskEffectiveEndAt: (task: any) => number;
}): number {
  const durationMs = task?.durationMs;
  if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0) {
    return durationMs;
  }
  const startedAt = deps.getTaskStartedAt(task);
  const endedAt = deps.getTaskEffectiveEndAt(task);
  if (startedAt > 0 && endedAt >= startedAt) {
    return Math.max(0, endedAt - startedAt);
  }
  return 0;
}


export function getTaskPendingReasonLabel(waitReason?: string): string {
  if (!waitReason) return '等待调度';
  if (waitReason === 'dependency-wait') return '依赖未满足';
  if (waitReason === 'tab-hidden') return '后台标签页';
  if (waitReason === 'higher-priority-wait') return '更高优先级任务占用';
  if (waitReason === 'page-closed-by-user') return '页面关闭取消';
  if (waitReason === 'page-refresh-replaced') return '页面刷新替换';
  if (waitReason === 'lease-timeout') return '心跳超时取消';
  if (waitReason === 'manual-cancel') return '手动取消';
  if (waitReason.startsWith('bucket:')) {
    const bucket = waitReason.slice('bucket:'.length) || 'default';
    return `并发桶等待:${bucket}`;
  }
  return waitReason;
}

export function getTaskDisplayReason(task: any, deps: {
  getTaskPendingReasonLabel: (waitReason?: string) => string;
  isTerminalTaskStatus: (status?: string) => boolean;
}): string {
  const status = task?.status || '';
  if (status === 'canceled') {
    return deps.getTaskPendingReasonLabel(task?.waitReason || 'manual-cancel');
  }
  if (deps.isTerminalTaskStatus(status)) {
    return '-';
  }
  const detail = String(task?.detail || '');
  if (detail.startsWith('deps:')) {
    return '依赖未满足';
  }
  if (status === 'running') {
    return '执行中';
  }
  return deps.getTaskPendingReasonLabel(task?.waitReason);
}

export function buildPageSummaryReasonStats(tasks: any[], getTaskDisplayReason: (task: any) => string): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task?.status === 'done' || task?.status === 'error' || task?.status === 'canceled') continue;
    const label = getTaskDisplayReason(task);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}


export function buildTaskDetailPageSummaries(tasks: any[], deps: {
  getTaskDetailsGroupedParents: (data: any[]) => Array<{ parentKey: string; parent: any; children: any[] }>;
  getTaskDisplayReason: (task: any) => string;
  getTaskRegisteredAt: (task: any) => number;
  getTaskEffectiveEndAt: (task: any) => number;
  getPagePath: (pageUrl: string) => string;
}): any[] {
  const pageScopedBlueprintLabels = new Set([
    'videoStatus:initialSync',
    'videoEnhancement:initCore',
    'videoEnhancement:clickEnhancement',
    'videoEnhancement:loadData',
    'videoEnhancement:translateCurrentTitle',
    'videoEnhancement:runCover',
    'videoEnhancement:runTitle',
    'videoEnhancement:runFC2Breaker',
    'videoEnhancement:runReviewBreaker',
    'videoEnhancement:runRelatedLists',
    'videoEnhancement:finish',
    'actorRemarks:run',
    'videoFavoriteRating:init',
    'actorMarks:page',
    'onlineAvailability:check',
  ]);

  const pageGroups = new Map<string, any[]>();
  for (const task of tasks) {
    const pageUrl = task?.pageUrl || '';
    const pageInstanceId = task?.pageInstanceId || `${task?.tabId || -1}:${pageUrl}:${task?.timestamp || 0}`;
    const groupKey = `${task?.tabId || -1}|${pageInstanceId}`;
    if (!pageGroups.has(groupKey)) {
      pageGroups.set(groupKey, []);
    }
    pageGroups.get(groupKey)!.push(task);
  }

  return Array.from(pageGroups.entries()).map(([groupKey, groupTasks]) => {
    const sample = groupTasks[0] || {};
    const groupedParents = deps.getTaskDetailsGroupedParents(groupTasks);
    let blueprintParentCount = 0;
    let runtimeParentCount = 0;
    let parentDoneCount = 0;
    let parentErrorCount = 0;
    let pendingCount = 0;
    let childCount = 0;
    let childDoneCount = 0;
    let childErrorCount = 0;
    const statuses = new Set<string>();
    const labels = new Set<string>();
    const waitReasons = new Map<string, number>();
    let startedAt = Number.MAX_SAFE_INTEGER;
    let endedAt = 0;

    for (const task of groupTasks) {
      if (task?.label) labels.add(task.label);
      statuses.add(task?.status || 'unknown');
      const isChildTask = !!(task?.parentLabel && task?.subtaskLabel);
      if (isChildTask) {
        childCount += 1;
        if (task?.status === 'done') childDoneCount += 1;
        if (task?.status === 'error') childErrorCount += 1;
      }
    }

    for (const group of groupedParents) {
      const parent = group.parent || {};
      const isSyntheticParent = parent?.__syntheticParent === true;
      const registrationSource = parent?.registrationSource === 'blueprint' ? 'blueprint' : 'runtime';
      const isPageScopedBlueprint = registrationSource === 'blueprint' && pageScopedBlueprintLabels.has(parent?.label || '');
      if (!isSyntheticParent) {
        if (isPageScopedBlueprint) blueprintParentCount += 1;
        else runtimeParentCount += 1;
        if (parent?.status === 'done') parentDoneCount += 1;
        if (parent?.status === 'error') parentErrorCount += 1;
        if (!['done', 'error', 'canceled'].includes(parent?.status || '')) {
          pendingCount += 1;
          const reasonKey = deps.getTaskDisplayReason(parent);
          waitReasons.set(reasonKey, (waitReasons.get(reasonKey) || 0) + 1);
        }
      }
      const registeredAt = deps.getTaskRegisteredAt(parent);
      const effectiveEndAt = deps.getTaskEffectiveEndAt(parent);
      if (registeredAt > 0) startedAt = Math.min(startedAt, registeredAt);
      if (effectiveEndAt > 0) endedAt = Math.max(endedAt, effectiveEndAt);
    }

    const normalizedStartedAt = startedAt === Number.MAX_SAFE_INTEGER ? 0 : startedAt;
    const totalElapsedMs = (normalizedStartedAt > 0 && endedAt >= normalizedStartedAt)
      ? Math.max(0, endedAt - normalizedStartedAt)
      : 0;
    const normalizedStatus = statuses.has('error')
      ? 'error'
      : (pendingCount > 0
          ? (statuses.has('running') ? 'running' : (statuses.has('paused') ? 'paused' : 'queued'))
          : 'done');

    return {
      groupKey,
      tabId: typeof sample?.tabId === 'number' ? sample.tabId : -1,
      pageInstanceId: sample?.pageInstanceId || `${sample?.tabId || -1}:${sample?.pageUrl || ""}:${sample?.timestamp || 0}`,
      pageUrl: sample?.pageUrl || '',
      pageType: sample?.pageType || (
        (sample?.pageUrl || '').includes('/actors/')
          ? 'actor'
          : ((sample?.pageUrl || '').includes('/v/')
              ? 'video'
              : ((sample?.pageUrl || '').includes('/search')
                  ? 'search'
                  : 'generic'))
      ),
      mainId: sample?.mainId || '-',
      taskCount: groupedParents.length + childCount,
      blueprintTaskCount: blueprintParentCount,
      runtimeTaskCount: runtimeParentCount,
      parentCount: blueprintParentCount + runtimeParentCount,
      blueprintParentCount,
      runtimeParentCount,
      childCount,
      childDoneCount,
      childErrorCount,
      totalDurationMs: totalElapsedMs,
      pendingCount,
      doneCount: parentDoneCount,
      errorCount: parentErrorCount,
      terminalParentCount: parentDoneCount + parentErrorCount,
      statuses,
      labels,
      waitReasons,
      startedAt: normalizedStartedAt,
      endedAt,
      status: normalizedStatus,
      label: `${deps.getPagePath(sample?.pageUrl || "")} [${sample?.pageInstanceId || ""}]`,
      detail: `tab=${typeof sample?.tabId === "number" ? sample.tabId : -1} · 蓝图父任务=${blueprintParentCount} · 运行时父任务=${runtimeParentCount} · 父任务总数=${blueprintParentCount + runtimeParentCount} · 子任务=${childCount} · 父任务完成=${parentDoneCount} · 子任务完成=${childDoneCount} · 标签=${labels.size} · 未完成=${pendingCount}`,
      topWaitReasons: Array.from(waitReasons.entries() as IterableIterator<[string, number]>)
        .map(([reason, count]: [string, number]) => ({ reason, count }))
        .sort((a: { reason: string; count: number }, b: { reason: string; count: number }) => b.count - a.count || a.reason.localeCompare(b.reason))
        .slice(0, 3),
    };
  });
}


export function getTaskDetailsSourceData(taskDetailsFilteredData: any[], taskDetailsSearchQuery: string, taskDetailsData: any[]): any[] {
  return taskDetailsFilteredData.length > 0 || taskDetailsSearchQuery
    ? taskDetailsFilteredData
    : taskDetailsData;
}

export function getTaskDetailsPageSummarySourceData(taskDetailsPageSummaryFilteredData: any[], taskDetailsSearchQuery: string, taskDetailsPageSummaryData: any[]): any[] {
  return taskDetailsPageSummaryFilteredData.length > 0 || taskDetailsSearchQuery
    ? taskDetailsPageSummaryFilteredData
    : taskDetailsPageSummaryData;
}


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


export function buildTaskDetailsStateFromResponse(resp: any, deps: {
  buildTaskDetailsFingerprint: (rows: any[]) => string;
  buildTaskDetailPageSummaries: (tasks: any[]) => any[];
}) {
  const nextTaskDetailsData = resp?.details?.details || [];
  const nextFingerprint = deps.buildTaskDetailsFingerprint(nextTaskDetailsData);
  const nextTaskDetailsPageSummaryData = deps.buildTaskDetailPageSummaries(nextTaskDetailsData);
  return {
    nextTaskDetailsData,
    nextFingerprint,
    nextTaskDetailsPageSummaryData,
  };
}
