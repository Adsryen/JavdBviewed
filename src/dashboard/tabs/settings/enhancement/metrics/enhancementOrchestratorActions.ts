import { showMessage } from '../../../../ui/toast';
import { buildPhasesExportText, filterTimelineForExport, buildTimelineExportText } from '../orchestrator/orchestratorExport';

export type EnhancementOrchestratorHost = any;

export async function openOrchestratorModal(host: EnhancementOrchestratorHost): Promise<void> {
  if (!host.orchestratorModal) return;
  host.ensureOrchestratorLocalStyles();
  host.setOrchestratorConnectionStatus('idle');
  if (host.orchViewModeSel) host.orchViewModeSel.value = 'global';
  if (host.orchFilterStatusSel) {
    host.orchFilterStatusSel.value = 'running';
    host.orchFilterStatusSel.disabled = false;
  }
  if (host.orchGlobalScopeSel) host.orchGlobalScopeSel.value = host.orchGlobalScopeSel.value || 'all';
  if (host.orchGlobalGroupingSel) host.orchGlobalGroupingSel.value = host.orchGlobalGroupingSel.value || 'grouped';
  host.updateOrchestratorLegend('global');
  host.orchestratorModal.classList.remove('hidden');
  host.orchestratorModal.classList.add('visible');
  void host.fetchAndUpdateMetrics();
  await host.refreshOrchestratorState();
  host.startOrchestratorAutoRefresh();
  host.unsubscribeOrchestratorEvents();
}

export function closeOrchestratorModal(host: EnhancementOrchestratorHost): void {
  if (!host.orchestratorModal) return;
  host.orchestratorModal.classList.add('hidden');
  host.orchestratorModal.classList.remove('visible');
  host.stopOrchestratorAutoRefresh();
  host.unsubscribeOrchestratorEvents();
}

export async function copyPhasesText(host: EnhancementOrchestratorHost): Promise<void> {
  try {
    const mode = host.orchViewModeSel?.value || 'global';
    const phases = mode === 'global'
      ? {
          critical: (host.globalOrchestratorState || []).filter((task: any) => task.phase === 'critical').map((task: any) => task.label),
          high: (host.globalOrchestratorState || []).filter((task: any) => task.phase === 'high').map((task: any) => task.label),
          deferred: (host.globalOrchestratorState || []).filter((task: any) => task.phase === 'deferred').map((task: any) => task.label),
          idle: (host.globalOrchestratorState || []).filter((task: any) => task.phase === 'idle').map((task: any) => task.label),
        }
      : host.buildDesignTasks().reduce((acc: any, task: any) => {
          if (task.enabled) acc[task.phase].push(task.label);
          return acc;
        }, { critical: [], high: [], deferred: [], idle: [] });
    const text = buildPhasesExportText(phases, host.getTaskDescription.bind(host));
    await host.writeClipboard(text);
    showMessage('任务清单已复制到剪贴板', 'success');
  } catch {
    showMessage('复制任务清单失败', 'error');
  }
}

export async function copyTimelineText(host: EnhancementOrchestratorHost): Promise<void> {
  try {
    const filters = host.getTimelineFilters();
    const list = filterTimelineForExport(host.orchestratorTimelineData as any[], filters);
    const text = buildTimelineExportText(host.orchViewModeSel?.value || 'global', list);
    await host.writeClipboard(text);
    showMessage('时间线已复制到剪贴板', 'success');
  } catch {
    showMessage('复制时间线失败', 'error');
  }
}
