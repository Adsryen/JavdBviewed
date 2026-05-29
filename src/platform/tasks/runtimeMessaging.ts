import { TASK_CENTER_MESSAGE } from '../../shared/taskCenterProtocol';
import type { GlobalTaskDescriptor } from '../../shared/taskCenterTypes';

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

export async function progressManagedTask(
  taskId: string,
  payload: { stage?: string; progressPct?: number; detail?: string; stageStartedAt?: number; stageDurationMs?: number },
): Promise<void> {
  await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.PROGRESS, payload: { taskId, ...payload } });
}

export async function isGlobalTaskLabelCompleted(label: string): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'task-center:check-completed', payload: { label } });
    return response?.completed === true;
  } catch {
    return false;
  }
}

export async function notifyGlobalTaskCompleted(label: string): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'task-center:mark-completed', payload: { label } });
  } catch {}
}

const taskRetryBudget = new Map<string, number>();
const MAX_GLOBAL_RETRIES = 3;

export function getTaskRetryCount(taskId: string): number {
  return taskRetryBudget.get(taskId) || 0;
}

export function incrementTaskRetryCount(taskId: string): number {
  const current = taskRetryBudget.get(taskId) || 0;
  const next = current + 1;
  taskRetryBudget.set(taskId, next);
  return next;
}

export function clearTaskRetryBudget(taskId: string): void {
  taskRetryBudget.delete(taskId);
}

export function isRetryBudgetExhausted(taskId: string): boolean {
  return (taskRetryBudget.get(taskId) || 0) >= MAX_GLOBAL_RETRIES;
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

export async function waitForTaskLease(
  taskId: string,
  timeoutMs: number,
  intervalMs: number = 500,
): Promise<{ granted: boolean; waitReason?: string }> {
  const start = Date.now();
  let lastWaitReason: string | undefined;
  while (Date.now() - start < timeoutMs) {
    const lease = await requestTaskLease(taskId);
    if (lease.granted) {
      return lease;
    }
    lastWaitReason = lease.waitReason || lastWaitReason;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { granted: false, waitReason: lastWaitReason || 'lease-timeout' };
}

export type ManagedTaskRunResult<T = unknown> =
  | { executed: true; result: T }
  | { executed: false; waitReason: string };

async function executeRegisteredManagedTask<T>(
  registeredDescriptor: GlobalTaskDescriptor,
  runner: () => Promise<T>,
): Promise<ManagedTaskRunResult<T>> {
  trackActiveManagedTask(registeredDescriptor.taskId);
  const lease = await waitForTaskLease(
    registeredDescriptor.taskId,
    registeredDescriptor.timeoutMs > 0 ? registeredDescriptor.timeoutMs : 10000,
  );
  if (!lease.granted) {
    untrackActiveManagedTask(registeredDescriptor.taskId);
    const waitReason = lease.waitReason || 'lease-denied';
    const isTransientWait =
      waitReason === 'tab-hidden' || waitReason === 'higher-priority-wait' || waitReason.startsWith('bucket:');
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

export async function runRegisteredManagedTask<T>(
  descriptor: GlobalTaskDescriptor,
  runner: () => Promise<T>,
): Promise<ManagedTaskRunResult<T>> {
  return await executeRegisteredManagedTask(descriptor, runner);
}

export async function runManagedTask<T>(
  descriptor: GlobalTaskDescriptor,
  runner: () => Promise<T>,
): Promise<ManagedTaskRunResult<T>> {
  const registeredDescriptor = await registerManagedTask(descriptor);
  return await executeRegisteredManagedTask(registeredDescriptor, runner);
}
