export type EnhancementMetricsHost = any;

export async function fetchAndUpdateMetrics(host: EnhancementMetricsHost): Promise<void> {
  console.log('[Enhancement] Fetching aggregated metrics from background...');
  try {
    const globalState = await host.fetchGlobalTaskState?.().catch(() => null as any) || null;
    const liveTasks = Array.isArray(globalState?.tasks) ? globalState.tasks : [];
    const resp = await new Promise<any>((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'orchestrator:getAggregatedMetrics' }, (reply) => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.warn('[Enhancement] Failed to get metrics:', err);
            resolve(null);
          } else {
            resolve(reply);
          }
        });
      } catch (e) {
        console.error('[Enhancement] Exception when sending message:', e);
        resolve(null);
      }
    });

    const metricsPayload = resp?.metrics ?? resp?.data ?? null;
    const metrics = host.enrichMetricsWithLiveTaskState(metricsPayload, liveTasks);
    host.updatePerformanceMetrics(metrics);
  } catch (error) {
    console.error('[Enhancement] fetchAndUpdateMetrics failed:', error);
    host.updatePerformanceMetrics(null);
  }
}

export function enrichMetricsWithLiveTaskState(host: EnhancementMetricsHost, metrics: any, tasks: any[]): any {
  const list = Array.isArray(tasks) ? tasks : [];
  const runningTasks = list.filter((task: any) => ['leased', 'running'].includes(host.getGlobalTaskStatus(task))).length;
  const pendingTasks = list.filter((task: any) => ['registered', 'queued', 'paused'].includes(host.getGlobalTaskStatus(task))).length;
  return {
    ...(metrics || {}),
    runningTasks,
    pendingTasks,
  };
}
