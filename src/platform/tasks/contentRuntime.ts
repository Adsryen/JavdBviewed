import type { GlobalTaskDescriptor } from '../../shared/taskCenterTypes';
import { getPageContext } from '../browser/pageContext';

export {
  clearTaskRetryBudget,
  completeManagedTask,
  ensureManagedTaskRegistered,
  failManagedTask,
  getActiveManagedTaskIds,
  getTaskRetryCount,
  heartbeatManagedTask,
  incrementTaskRetryCount,
  isGlobalTaskLabelCompleted,
  isRetryBudgetExhausted,
  notifyGlobalTaskCompleted,
  pauseManagedTask,
  progressManagedTask,
  registerManagedTask,
  requestTaskLease,
  resumeManagedTask,
  runManagedTask,
  runRegisteredManagedTask,
  trackActiveManagedTask,
  untrackActiveManagedTask,
  waitForTaskLease,
  type ManagedTaskRunResult,
} from './runtimeMessaging';

export function createManagedTaskDescriptor(
  input: Omit<
    GlobalTaskDescriptor,
    'taskId' | 'tabId' | 'pageUrl' | 'pageType' | 'createdAt' | 'mainId' | 'pageInstanceId'
  >,
): GlobalTaskDescriptor {
  const pageContext = getPageContext();
  return {
    taskId: `${input.label}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    tabId: 0,
    pageUrl: pageContext.pageUrl,
    pageType: pageContext.pageType,
    mainId: pageContext.mainId,
    pageInstanceId: pageContext.pageInstanceId,
    createdAt: Date.now(),
    dedupeKey: input.dedupeKey || `${input.label}:${pageContext.pageInstanceId}`,
    registrationSource: input.registrationSource || 'runtime',
    ...input,
  };
}
