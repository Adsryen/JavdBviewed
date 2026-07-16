export type EnhancementTaskDetailsExportHost = any;

export function getTaskDetailSortValue(host: EnhancementTaskDetailsExportHost, task: any, sortField: string): string | number {
  if (sortField === 'duration') return task?.durationMs || 0;
  if (sortField === 'createdAt') return host.getTaskRegisteredAt(task);
  if (sortField === 'startedAt') return host.getTaskStartedAt(task);
  if (sortField === 'endedAt') return host.getTaskEffectiveEndAt(task);
  if (sortField === 'waitDurationMs') return host.getTaskWaitDurationMs(task);
  if (sortField === 'runDurationMs') return host.getTaskRunDurationMs(task);
  const rawValue = task?.[sortField];
  return typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : 0;
}

export function compareTaskDetailItems(host: EnhancementTaskDetailsExportHost, a: any, b: any): number {
  const aVal = getTaskDetailSortValue(host, a, host.taskDetailsSortField);
  const bVal = getTaskDetailSortValue(host, b, host.taskDetailsSortField);
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return host.taskDetailsSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  }
  const aNum = typeof aVal === 'number' ? aVal : 0;
  const bNum = typeof bVal === 'number' ? bVal : 0;
  const isTimeField = ['createdAt', 'startedAt', 'endedAt'].includes(host.taskDetailsSortField);
  if (isTimeField) {
    const aMissing = aNum <= 0;
    const bMissing = bNum <= 0;
    if (aMissing !== bMissing) return aMissing ? 1 : -1;
  }
  if (aNum !== bNum) return host.taskDetailsSortOrder === 'asc' ? aNum - bNum : bNum - aNum;
  const aRegisteredAt = host.getTaskRegisteredAt(a);
  const bRegisteredAt = host.getTaskRegisteredAt(b);
  if (aRegisteredAt !== bRegisteredAt) return host.taskDetailsSortOrder === 'asc' ? aRegisteredAt - bRegisteredAt : bRegisteredAt - aRegisteredAt;
  return String(a?.label || '').localeCompare(String(b?.label || ''));
}

export function getSortedTaskDetailsData(host: EnhancementTaskDetailsExportHost): any[] {
  const dataToRender = host.getTaskDetailsSourceData();
  return [...dataToRender].sort((a, b) => compareTaskDetailItems(host, a, b));
}

export function getVisibleTaskDetailGroups(host: EnhancementTaskDetailsExportHost, includeCollapsedChildren: boolean = false): Array<{ parentKey: string; parent: any; children: any[] }> {
  const groupedParents = host.getTaskDetailsGroupedParents(getSortedTaskDetailsData(host));
  const startIndex = (host.taskDetailsCurrentPage - 1) * host.taskDetailsPageSize;
  const endIndex = startIndex + host.taskDetailsPageSize;
  return groupedParents.slice(startIndex, endIndex).map((group: any) => ({
    parentKey: group.parentKey,
    parent: group.parent,
    children: (includeCollapsedChildren || host.taskDetailsExpandedParents.has(group.parentKey)) ? [...group.children] : [],
  }));
}
