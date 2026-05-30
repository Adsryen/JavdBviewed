import { globalTaskCenter } from '../../platform/tasks/globalTaskCenter';
import { getValue, setValue } from '../../utils/storage';

let taskDetailSaveQueue: Promise<void> = Promise.resolve();

export async function handleSaveOrchestratorMetrics(metrics: any): Promise<void> {
  console.log('[Background] Saving orchestrator metrics:', metrics);
  try {
    if (!metrics) {
      console.warn('[Background] No metrics provided, skipping save');
      return;
    }

    const existingData = await getValue<any[]>('orchestratorMetrics', []);
    console.log('[Background] Existing metrics count:', existingData.length);

    existingData.push({
      ...metrics,
      savedAt: Date.now(),
    });

    const trimmedData = existingData.slice(-100);
    await setValue('orchestratorMetrics', trimmedData);

    console.log('[Background] Orchestrator metrics saved successfully, total records:', trimmedData.length);
  } catch (error) {
    console.error('[Background] Failed to save orchestrator metrics:', error);
    throw error;
  }
}

export async function handleGetAggregatedMetrics(): Promise<any> {
  console.log('[Background] Getting aggregated metrics...');
  try {
    const taskDetails = await getValue<any[]>('orchestratorTaskDetails', []);
    const taskGroups = new Map<string, { root: any; items: any[] }>();
    for (const item of taskDetails) {
      const rootKey = String(item?.rootTaskId || item?.parentTaskId || item?.taskId || item?.label || 'unknown');
      const group = taskGroups.get(rootKey) || { root: item, items: [] };
      if (!group.root || !group.root.taskId) group.root = item;
      group.items.push(item);
      taskGroups.set(rootKey, group);
    }

    const deriveFromDetails = () => {
      const result = {
        batchTotal: taskGroups.size,
        batchCompleted: 0,
        batchFailed: 0,
        batchTimeout: 0,
        batchTotalDuration: 0,
        batchMaxDuration: 0,
        batchMinDuration: Infinity,
        batchMaxDurationTask: '',
        subtaskTotal: taskDetails.length,
        subtaskDone: 0,
        subtaskError: 0,
        subtaskTimeout: 0,
        subtaskTotalDuration: 0,
        subtaskMaxDuration: 0,
        subtaskMinDuration: Infinity,
        subtaskMaxDurationTask: '',
      };

      for (const [rootKey, group] of taskGroups.entries()) {
        const root = group.root || {};
        const rootStatus = String(root?.status || '').toLowerCase();
        const rootDuration = Number(root?.durationMs || 0);
        if (rootStatus === 'done') result.batchCompleted++;
        if (rootStatus === 'error' || rootStatus === 'canceled') result.batchFailed++;
        if (rootStatus === 'timeout') result.batchTimeout++;
        if (rootDuration > 0) {
          result.batchTotalDuration += rootDuration;
          if (rootDuration > result.batchMaxDuration) {
            result.batchMaxDuration = rootDuration;
            result.batchMaxDurationTask = String(root?.label || rootKey);
          }
          result.batchMinDuration = Math.min(result.batchMinDuration, rootDuration);
        }

        for (const item of group.items) {
          const status = String(item?.status || '').toLowerCase();
          const duration = Number(item?.durationMs || 0);
          if (status === 'done') result.subtaskDone++;
          if (status === 'error' || status === 'canceled') result.subtaskError++;
          if (status === 'timeout') result.subtaskTimeout++;
          if (duration > 0) {
            result.subtaskTotalDuration += duration;
            if (duration > result.subtaskMaxDuration) {
              result.subtaskMaxDuration = duration;
              result.subtaskMaxDurationTask = String(item?.label || rootKey);
            }
            result.subtaskMinDuration = Math.min(result.subtaskMinDuration, duration);
          }
        }
      }

      return result;
    };

    const treeMetrics = deriveFromDetails();
    const metricsData = await getValue<any[]>('orchestratorMetrics', []);
    console.log('[Background] Retrieved metrics records:', metricsData.length);

    if (metricsData.length === 0) {
      console.log('[Background] No metrics data found, returning zeros');
      return {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        timeoutTasks: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        totalDuration: 0,
        recordCount: 0,
        avgTasksPerPage: 0,
        successRate: 0,
        maxDurationTask: '',
        lastSavedAt: 0,
      };
    }

    const aggregated = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      timeoutTasks: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      recordCount: metricsData.length,
      maxDurationTask: '',
      lastSavedAt: 0,
    };

    metricsData.forEach((record) => {
      aggregated.totalTasks += record.totalTasks || 0;
      aggregated.completedTasks += record.completedTasks || 0;
      aggregated.failedTasks += record.failedTasks || 0;
      aggregated.timeoutTasks += record.timeoutTasks || 0;
      aggregated.totalDuration += record.totalDuration || 0;

      if ((record.maxDuration || 0) > aggregated.maxDuration) {
        aggregated.maxDuration = record.maxDuration || 0;
        aggregated.maxDurationTask = record.maxDurationTask || '';
      }

      if (record.minDuration !== undefined && record.minDuration !== Infinity) {
        aggregated.minDuration = Math.min(aggregated.minDuration, record.minDuration);
      }

      if ((record.savedAt || 0) > aggregated.lastSavedAt) {
        aggregated.lastSavedAt = record.savedAt || 0;
      }
    });

    const avgDuration = aggregated.completedTasks > 0
      ? aggregated.totalDuration / aggregated.completedTasks
      : 0;
    const avgTasksPerPage = aggregated.recordCount > 0
      ? aggregated.totalTasks / aggregated.recordCount
      : 0;
    const successRate = aggregated.totalTasks > 0
      ? (aggregated.completedTasks / aggregated.totalTasks) * 100
      : 0;

    const result = {
      ...aggregated,
      ...treeMetrics,
      avgDuration,
      avgTasksPerPage,
      successRate,
      batchAvgDuration: treeMetrics.batchCompleted > 0 ? treeMetrics.batchTotalDuration / treeMetrics.batchCompleted : 0,
      subtaskAvgDuration: treeMetrics.subtaskDone > 0 ? treeMetrics.subtaskTotalDuration / treeMetrics.subtaskDone : 0,
    };

    console.log('[Background] Aggregated metrics:', result);
    return result;
  } catch (error) {
    console.error('[Background] Failed to get aggregated metrics:', error);
    throw error;
  }
}

export async function handleSaveTaskDetail(taskDetail: any, sender?: chrome.runtime.MessageSender): Promise<void> {
  taskDetailSaveQueue = taskDetailSaveQueue.then(async () => {
    try {
      if (!taskDetail) {
        console.log('[Background] saveTaskDetail skipped: empty payload');
        return;
      }

      const normalizedDetail = {
        ...taskDetail,
        tabId: typeof taskDetail?.tabId === 'number' ? taskDetail.tabId : (typeof sender?.tab?.id === 'number' ? sender.tab.id : -1),
        savedAt: Date.now(),
      };

      console.log('[Background] saveTaskDetail:start', {
        label: normalizedDetail.label,
        parentLabel: normalizedDetail.parentLabel,
        pageInstanceId: normalizedDetail.pageInstanceId,
        mainId: normalizedDetail.mainId,
        tabId: normalizedDetail.tabId,
      });

      const existingDetails = await getValue<any[]>('orchestratorTaskDetails', []);
      existingDetails.push(normalizedDetail);
      const trimmedDetails = existingDetails.slice(-2000);
      await setValue('orchestratorTaskDetails', trimmedDetails);

      console.log('[Background] saveTaskDetail:done', {
        label: normalizedDetail.label,
        parentLabel: normalizedDetail.parentLabel,
        pageInstanceId: normalizedDetail.pageInstanceId,
        total: trimmedDetails.length,
      });
    } catch (error) {
      console.error('[Background] Failed to save task detail:', error, {
        label: taskDetail?.label,
        parentLabel: taskDetail?.parentLabel,
        pageInstanceId: taskDetail?.pageInstanceId,
        mainId: taskDetail?.mainId,
      });
      throw error;
    }
  });

  return taskDetailSaveQueue;
}

export async function handleGetTaskDetails(options: any = {}): Promise<any> {
  try {
    const taskDetails = await getValue<any[]>('orchestratorTaskDetails', []);
    let filtered = [...taskDetails];
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const maxRecords = 5000;
    if (filtered.length > maxRecords) {
      filtered = filtered.slice(0, maxRecords);
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedDetails = filtered.slice(startIndex, endIndex);

    return {
      details: paginatedDetails,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  } catch (error) {
    console.error('[Background] Failed to get task details:', error);
    throw error;
  }
}

export async function handleClearTaskDetails(): Promise<any> {
  try {
    console.log('[Background] Clearing orchestrator task details and metrics...');
    await setValue('orchestratorTaskDetails', []);
    await setValue('orchestratorMetrics', []);
    const clearedGlobalState = globalTaskCenter.clearAll();
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (typeof tab.id === 'number' && tab.id >= 0) {
          chrome.tabs.sendMessage(tab.id, { type: 'orchestrator:resetMetrics' }, () => {
            void chrome.runtime.lastError;
          });
        }
      }
    } catch (broadcastErr) {
      console.warn('[Background] Failed to broadcast resetMetrics:', broadcastErr);
    }
    console.log('[Background] Cleared orchestrator task details and metrics');
    return { success: true, clearedGlobalState };
  } catch (error) {
    console.error('[Background] Failed to clear task details:', error);
    return { success: false, error: String(error) };
  }
}

export async function handleStopAllTasks(): Promise<any> {
  try {
    const result = globalTaskCenter.stopAllActiveTasks('manual-stop-all');
    const cleared = globalTaskCenter.clearTerminalTasks();
    return { success: true, canceled: result.canceled || 0, cleared: cleared.cleared || 0 };
  } catch (error) {
    console.error('[Background] Failed to stop all tasks:', error);
    return { success: false, error: String(error) };
  }
}
