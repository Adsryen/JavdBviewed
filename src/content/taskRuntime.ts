import { TASK_CENTER_MESSAGE } from '../shared/taskCenterProtocol';
import type { GlobalTaskDescriptor } from '../shared/taskCenterTypes';
import { getPageContext } from './pageContext';

export function createManagedTaskDescriptor(input: Omit<GlobalTaskDescriptor, 'taskId' | 'tabId' | 'pageUrl' | 'pageType' | 'createdAt' | 'mainId' | 'pageInstanceId'>): GlobalTaskDescriptor {
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
    ...input,
  };
}

export async function registerManagedTask(descriptor: GlobalTaskDescriptor): Promise<GlobalTaskDescriptor> {
  const response = await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.REGISTER, payload: descriptor });
  if (response && typeof response.tabId === 'number') {
    return { ...descriptor, tabId: response.tabId, taskId: response.taskId || descriptor.taskId };
  }
  return descriptor;
}

export async function ensureManagedTaskRegistered(descriptor: GlobalTaskDescriptor): Promise<GlobalTaskDescriptor> {
  return await registerManagedTask(descriptor);
}

export async function requestTaskLease(taskId: string): Promise<{ granted: boolean; waitReason?: string }> {
  return await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.REQUEST_LEASE, payload: { taskId } });
}

export async function completeManagedTask(taskId: string): Promise<void> {
  await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.COMPLETE, payload: { taskId } });
}

export async function failManagedTask(taskId: string, error: string): Promise<void> {
  await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.FAIL, payload: { taskId, error } });
}

export async function pauseManagedTask(taskId: string, reason: string = 'paused'): Promise<void> {
  await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.PAUSE, payload: { taskId, reason } });
}

export async function resumeManagedTask(taskId: string): Promise<void> {
  await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.RESUME, payload: { taskId } });
}

export async function heartbeatManagedTask(taskId: string): Promise<void> {
  await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.HEARTBEAT, payload: { taskId } });
}

const activeManagedTaskIds = new Set<string>();

export function getActiveManagedTaskIds(): string[] {
  return Array.from(activeManagedTaskIds);
}

export function trackActiveManagedTask(taskId: string): void {
  activeManagedTaskIds.add(taskId);
}

export function untrackActiveManagedTask(taskId: string): void {
  activeManagedTaskIds.delete(taskId);
}

export async function waitForTaskLease(taskId: string, timeoutMs: number, intervalMs: number = 500): Promise<{ granted: boolean; waitReason?: string }> {
  const start = Date.now();
  let lastWaitReason: string | undefined;
  while (Date.now() - start < timeoutMs) {
    const lease = await requestTaskLease(taskId);
    if (lease.granted) {
      return lease;
    }
    lastWaitReason = lease.waitReason || lastWaitReason;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return { granted: false, waitReason: lastWaitReason || 'lease-timeout' };
}

export type ManagedTaskRunResult<T = unknown> =
  | { executed: true; result: T }
  | { executed: false; waitReason: string };

async function executeRegisteredManagedTask<T>(registeredDescriptor: GlobalTaskDescriptor, runner: () => Promise<T>): Promise<ManagedTaskRunResult<T>> {
  trackActiveManagedTask(registeredDescriptor.taskId);
  const lease = await waitForTaskLease(registeredDescriptor.taskId, registeredDescriptor.timeoutMs > 0 ? registeredDescriptor.timeoutMs : 10000);
  if (!lease.granted) {
    untrackActiveManagedTask(registeredDescriptor.taskId);
    const waitReason = lease.waitReason || 'lease-denied';
    const isTransientWait = waitReason === 'tab-hidden' || waitReason === 'higher-priority-wait' || waitReason.startsWith('bucket:');
    if (!isTransientWait) {
      await failManagedTask(registeredDescriptor.taskId, waitReason);
    }
    return { executed: false, waitReason };
  }
  try {
    const result = await runner();
    await completeManagedTask(registeredDescriptor.taskId);
    return { executed: true, result };
  } catch (error) {
    await failManagedTask(registeredDescriptor.taskId, error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    untrackActiveManagedTask(registeredDescriptor.taskId);
  }
}

export async function runRegisteredManagedTask<T>(descriptor: GlobalTaskDescriptor, runner: () => Promise<T>): Promise<ManagedTaskRunResult<T>> {
  return await executeRegisteredManagedTask(descriptor, runner);
}

export async function runManagedTask<T>(descriptor: GlobalTaskDescriptor, runner: () => Promise<T>): Promise<ManagedTaskRunResult<T>> {
  const registeredDescriptor = await registerManagedTask(descriptor);
  return await executeRegisteredManagedTask(registeredDescriptor, runner);
}
