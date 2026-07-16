import { getGlobalTaskStatus, getStatusLabel, buildGlobalTaskDetail } from './orchestratorData';
import type { OrchestratorDesignTask } from './orchestratorDesign';

export function buildDesignSummaryText(designTasks: OrchestratorDesignTask[]): string {
  const enabledCount = designTasks.filter(task => task.enabled).length;
  const highestPriority = designTasks.reduce((max, task) => Math.max(max, task.priority ?? 5), 0);
  return `设计视图（真实编排蓝图）：${enabledCount} 个启用任务｜最高优先级 ${highestPriority}｜当前配置实时生成`;
}

export function filterGlobalTasks(allTasks: any[], scope: string, currentTabId: number, currentUrl: string): any[] {
  return allTasks.filter((task: any) => {
    if (scope === 'current') {
      return (typeof task?.tabId === 'number' && task.tabId === currentTabId) || (!!currentUrl && task?.pageUrl === currentUrl);
    }
    if (scope === 'recent') {
      if ((typeof task?.tabId === 'number' && task.tabId === currentTabId) || (!!currentUrl && task?.pageUrl === currentUrl)) {
        return true;
      }
      const createdAt = typeof task?.createdAt === 'number' ? task.createdAt : 0;
      const startedAt = typeof task?.startedAt === 'number' ? task.startedAt : 0;
      const endedAt = typeof task?.endedAt === 'number' ? task.endedAt : 0;
      const ts = Math.max(createdAt, startedAt, endedAt);
      return ts > 0 && (Date.now() - ts) <= 2 * 60 * 1000;
    }
    if (scope === 'active') {
      const status = getGlobalTaskStatus(task);
      return !['done', 'error', 'canceled'].includes(status);
    }
    return true;
  });
}

export function buildGlobalPhases(tasks: any[], grouping: string): Record<'critical' | 'high' | 'deferred' | 'idle', string[]> {
  const byPhase = (phase: string) => {
    const phaseTasks = tasks.filter((task: any) => task.phase === phase);
    if (grouping === 'instances') return phaseTasks.map((task: any) => task.label);
    return Array.from(new Set(phaseTasks.map((task: any) => task.label)));
  };
  return {
    critical: byPhase('critical'),
    high: byPhase('high'),
    deferred: byPhase('deferred'),
    idle: byPhase('idle'),
  };
}

export function buildGlobalStatusCounts(tasks: any[]): Record<string, number> {
  return tasks.reduce((acc: Record<string, number>, task: any) => {
    const status = getGlobalTaskStatus(task);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

export function buildGlobalSummaryText(tasks: any[], statusCounts: Record<string, number>, scope: string, grouping: string): string {
  const statusSummary = Object.entries(statusCounts).map(([key, value]) => `${getStatusLabel(key)} ${value}`).join('，') || '暂无任务';
  const scopeLabel = scope === 'current' ? '当前页实例' : (scope === 'recent' ? '最近活跃页' : (scope === 'active' ? '活动任务' : '全部页面'));
  const groupingLabel = grouping === 'instances' ? '实例' : '聚合';
  return `全局调度视图（${scopeLabel}｜${groupingLabel}）：${tasks.length} 个任务｜${statusSummary}`;
}

export function buildGlobalTimelineData(tasks: any[]): any[] {
  return tasks.map((task: any) => ({
    phase: task.phase || '-',
    label: task.label || '-',
    status: getGlobalTaskStatus(task),
    ts: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
    durationMs: typeof task.startedAt === 'number' && typeof task.endedAt === 'number'
      ? Math.max(0, task.endedAt - task.startedAt)
      : 0,
    detail: buildGlobalTaskDetail(task),
  }));
}
