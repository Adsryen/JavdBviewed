import { fetchGlobalTaskState } from '../../../../services/globalTaskMonitor';
import { getPreferredJavdbTab } from '../orchestrator/orchestratorActions';

export type EnhancementOrchestratorStateHost = any;

export async function refreshOrchestratorState(host: EnhancementOrchestratorStateHost): Promise<void> {
  try {
    const mode = host.orchViewModeSel?.value || 'global';
    host.setOrchestratorConnectionStatus('idle');
    if (host.orchFilterStatusSel) host.orchFilterStatusSel.disabled = false;

    if (mode === 'dag') {
      const designTasks = host.buildDesignTasks();
      if (host.orchestratorSummary) {
        const enabledCount = designTasks.filter((task: any) => task.enabled).length;
        host.orchestratorSummary.textContent = `DAG 拓扑视图：${enabledCount} 个启用任务｜同列可并发，左列先执行`;
      }
      if (host.orchestratorDag) host.orchestratorDag.style.display = '';
      if (host.orchestratorGrid) host.orchestratorGrid.style.display = 'none';
      host.renderOrchestratorDag(designTasks);
      host.updateOrchestratorLegend('dag');
      await host.fetchAndUpdateMetrics();
      host.setOrchestratorConnectionStatus('idle');
      host.unsubscribeOrchestratorEvents();
      return;
    }

    if (mode === 'global') {
      if (host.orchestratorDag) host.orchestratorDag.style.display = 'none';
      if (host.orchestratorGrid) host.orchestratorGrid.style.display = '';
      const globalState = await fetchGlobalTaskState();
      const allTasks = Array.isArray(globalState?.tasks) ? globalState.tasks : [];
      const preferredTab = await getPreferredJavdbTab();
      const currentUrl = preferredTab?.url || '';
      const currentTabId = typeof preferredTab?.id === 'number' ? preferredTab.id : -1;
      const scope = host.orchGlobalScopeSel?.value || 'all';
      const grouping = host.orchGlobalGroupingSel?.value || 'grouped';

      const tasks = allTasks.filter((task: any) => {
        if (scope === 'current') {
          return (typeof task?.tabId === 'number' && task.tabId === currentTabId) || (!!currentUrl && task?.pageUrl === currentUrl);
        }
        if (scope === 'recent') {
          if ((typeof task?.tabId === 'number' && task.tabId === currentTabId) || (!!currentUrl && task?.pageUrl === currentUrl)) return true;
          const createdAt = typeof task?.createdAt === 'number' ? task.createdAt : 0;
          const startedAt = typeof task?.startedAt === 'number' ? task.startedAt : 0;
          const endedAt = typeof task?.endedAt === 'number' ? task.endedAt : 0;
          const ts = Math.max(createdAt, startedAt, endedAt);
          return ts > 0 && (Date.now() - ts) <= 2 * 60 * 1000;
        }
        if (scope === 'active') {
          const status = host.getGlobalTaskStatus(task);
          return !['done', 'error', 'canceled'].includes(status);
        }
        return true;
      });

      const byPhase = (phase: string) => {
        const phaseTasks = tasks.filter((task: any) => task.phase === phase);
        if (grouping === 'instances') return phaseTasks.map((task: any) => task.label);
        return Array.from(new Set(phaseTasks.map((task: any) => task.label)));
      };

      const statusCounts = tasks.reduce((acc: Record<string, number>, task: any) => {
        const status = host.getGlobalTaskStatus(task);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const phases = {
        critical: byPhase('critical'),
        high: byPhase('high'),
        deferred: byPhase('deferred'),
        idle: byPhase('idle'),
      };

      if (host.orchestratorSummary) {
        const statusSummary = Object.entries(statusCounts).map(([key, value]) => `${host.getStatusLabel(key)} ${value}`).join('，') || '暂无任务';
        const scopeLabel = scope === 'current' ? '当前页实例' : (scope === 'recent' ? '最近活跃页' : (scope === 'active' ? '活动任务' : '全部页面'));
        const groupingLabel = grouping === 'instances' ? '实例' : '聚合';
        host.orchestratorSummary.textContent = `全局调度视图（${scopeLabel}｜${groupingLabel}）：${tasks.length} 个任务｜${statusSummary}`;
      }

      host.renderOrchestratorPhases(phases as any);
      host.updateOrchestratorLegend('global');
      host.globalOrchestratorState = tasks.map((task: any) => ({
        phase: task.phase || '-',
        label: task.label || '-',
        status: host.getGlobalTaskStatus(task),
        ts: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
        durationMs: typeof task.startedAt === 'number' && typeof task.endedAt === 'number' ? Math.max(0, task.endedAt - task.startedAt) : 0,
        detail: host.buildGlobalTaskDetail(task),
      }));
      host.orchestratorTimelineData = host.globalOrchestratorState as any[];
      host.renderOrchestratorTimeline(host.orchestratorTimelineData);
      await host.fetchAndUpdateMetrics();
      host.setOrchestratorConnectionStatus('idle');
      host.unsubscribeOrchestratorEvents();
    }
  } catch (e) {
    host.setOrchestratorConnectionStatus('disconnected');
    if (host.orchestratorSummary) host.orchestratorSummary.textContent = '读取失败：' + String(e);
  }
}
