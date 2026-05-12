import { TASK_BUCKET_LIMITS, resolveTaskBucket } from './taskPolicy';
import { TaskStateStore } from './taskStateStore';
import { TASK_CENTER_MESSAGE } from '../shared/taskCenterProtocol';
import type { GlobalTaskDescriptor, GlobalTaskRuntimeState } from '../shared/taskCenterTypes';
import { computeTaskDisposition, getEffectiveBucketLimit } from './taskCenterPolicyRuntime';

type LeaseResponse = { granted: boolean; waitReason?: string };

type QueueCandidate = {
  record: ReturnType<TaskStateStore['listTasks']>[number];
  score: number;
};

export class GlobalTaskCenter {
  private store = new TaskStateStore();
  private dedupeIndex = new Map<string, string>();
  private readonly taskRetentionMs = 10 * 60 * 1000;

  private getPhaseWeight(phase: string): number {
    if (phase === 'critical') return 4000;
    if (phase === 'high') return 3000;
    if (phase === 'deferred') return 2000;
    if (phase === 'idle') return 1000;
    return 0;
  }

  private getQueueScore(record: QueueCandidate['record'], now = Date.now()): number {
    const descriptor = record.descriptor;
    const runtime = record.runtime;
    const ageMs = Math.max(0, now - descriptor.createdAt);
    const ageScore = Math.min(600, Math.floor(ageMs / 1000));
    const visibilityScore = this.store.isTabVisible(descriptor.tabId) ? 80 : 0;
    const retryPenalty = runtime.retryCount * 100;
    return this.getPhaseWeight(descriptor.phase) + (descriptor.priority * 100) + visibilityScore + ageScore - retryPenalty;
  }

  private isRunnableCandidate(record: QueueCandidate['record'], bucket: string, visible: boolean, now = Date.now()): boolean {
    const recordBucket = resolveTaskBucket(record.descriptor.label);
    if (recordBucket !== bucket) return false;
    if (this.store.isTabVisible(record.descriptor.tabId) !== visible) return false;
    const disposition = computeTaskDisposition({
      status: record.runtime.status,
      heartbeatTs: record.runtime.heartbeatTs,
      timeoutMs: record.descriptor.timeoutMs,
      now,
    });
    if (disposition !== 'active') return false;
    return record.runtime.status === 'registered' || record.runtime.status === 'queued';
  }

  private getBestQueuedCandidate(bucket: string, visible: boolean): QueueCandidate | null {
    const now = Date.now();
    const candidates = this.store.listTasks().filter((record) => this.isRunnableCandidate(record, bucket, visible, now));
    if (candidates.length === 0) return null;

    candidates.sort((left, right) => {
      const scoreDiff = this.getQueueScore(right, now) - this.getQueueScore(left, now);
      if (scoreDiff !== 0) return scoreDiff;

      const ageDiff = left.descriptor.createdAt - right.descriptor.createdAt;
      if (ageDiff !== 0) return ageDiff;

      return left.descriptor.taskId.localeCompare(right.descriptor.taskId);
    });

    return { record: candidates[0], score: this.getQueueScore(candidates[0], now) };
  }

  private getRunningCount(bucket: string, visible: boolean): number {
    const now = Date.now();
    return this.store.listTasks().filter(record => {
      const recordBucket = resolveTaskBucket(record.descriptor.label);
      const recordVisible = this.store.isTabVisible(record.descriptor.tabId);
      const recordDisposition = computeTaskDisposition({
        status: record.runtime.status,
        heartbeatTs: record.runtime.heartbeatTs,
        timeoutMs: record.descriptor.timeoutMs,
        now,
      });
      return recordBucket === bucket
        && recordVisible === visible
        && recordDisposition === 'active'
        && (record.runtime.status === 'leased' || record.runtime.status === 'running');
    }).length;
  }

  private cleanupStaleTasks(now = Date.now()): void {
    for (const record of this.store.listTasks()) {
      const { descriptor, runtime } = record;
      const disposition = computeTaskDisposition({
        status: runtime.status,
        heartbeatTs: runtime.heartbeatTs,
        timeoutMs: descriptor.timeoutMs,
        now,
      });

      if (disposition === 'stale') {
        runtime.status = 'canceled';
        runtime.waitReason = 'lease-timeout';
        runtime.endedAt = now;
        this.store.setTask(descriptor.taskId, record);
      }

      const terminal = ['done', 'error', 'canceled'].includes(runtime.status);
      const terminalTs = runtime.endedAt || runtime.heartbeatTs || descriptor.createdAt;
      if (terminal && now - terminalTs > this.taskRetentionMs) {
        this.store.deleteTask(descriptor.taskId);
        if (descriptor.dedupeKey && this.dedupeIndex.get(descriptor.dedupeKey) === descriptor.taskId) {
          this.dedupeIndex.delete(descriptor.dedupeKey);
        }
      }
    }
  }

  registerTask(descriptor: GlobalTaskDescriptor, sender?: chrome.runtime.MessageSender): { ok: true; taskId: string; tabId: number } {
    this.cleanupStaleTasks();
    const existing = this.store.getTask(descriptor.taskId);
    if (existing) return { ok: true, taskId: descriptor.taskId, tabId: existing.descriptor.tabId };
    const dedupeKey = descriptor.dedupeKey || `${descriptor.label}:${descriptor.pageUrl}`;
    const dedupedTaskId = this.dedupeIndex.get(dedupeKey);
    if (dedupedTaskId) {
      const dedupedTask = this.store.getTask(dedupedTaskId);
      if (dedupedTask) {
        return { ok: true, taskId: dedupedTaskId, tabId: dedupedTask.descriptor.tabId };
      }
    }
    const tabId = typeof sender?.tab?.id === 'number' ? sender.tab.id : descriptor.tabId;
    const runtime: GlobalTaskRuntimeState = {
      status: 'registered',
      retryCount: 0,
      pauseCount: 0,
      resumeCount: 0,
    };
    this.store.setTask(descriptor.taskId, { descriptor: { ...descriptor, tabId, dedupeKey }, runtime });
    this.dedupeIndex.set(dedupeKey, descriptor.taskId);
    return { ok: true, taskId: descriptor.taskId, tabId };
  }

  requestLease(taskId: string): LeaseResponse {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (!task) return { granted: false, waitReason: 'task-not-found' };
    const bucket = resolveTaskBucket(task.descriptor.label);
    const baseLimit = TASK_BUCKET_LIMITS[bucket] ?? 1;
    const visible = this.store.isTabVisible(task.descriptor.tabId);
    const limit = getEffectiveBucketLimit({
      baseLimit,
      visible,
      policy: task.descriptor.visibilityPolicy,
    });
    if (limit <= 0) {
      task.runtime.status = 'queued';
      task.runtime.waitReason = visible ? `bucket:${bucket}` : 'tab-hidden';
      this.store.setTask(taskId, task);
      return { granted: false, waitReason: task.runtime.waitReason };
    }
    if (task.runtime.status === 'leased' || task.runtime.status === 'running') {
      return { granted: true };
    }

    const bestCandidate = this.getBestQueuedCandidate(bucket, visible);
    if (!bestCandidate) {
      task.runtime.status = 'queued';
      task.runtime.waitReason = visible ? `bucket:${bucket}` : 'tab-hidden';
      this.store.setTask(taskId, task);
      return { granted: false, waitReason: task.runtime.waitReason };
    }

    if (bestCandidate.record.descriptor.taskId !== taskId) {
      const runningCount = this.getRunningCount(bucket, visible);
      const currentPriority = Number(task.descriptor.priority || 0);
      const bestPriority = Number(bestCandidate.record.descriptor.priority || 0);
      const allowBackgroundParallel = !visible
        && task.descriptor.visibilityPolicy === 'background_allowed'
        && limit >= 2
        && runningCount < limit
        && (bestPriority - currentPriority) <= 2;
      if (!allowBackgroundParallel) {
        task.runtime.status = 'queued';
        task.runtime.waitReason = 'higher-priority-wait';
        this.store.setTask(taskId, task);
        return { granted: false, waitReason: task.runtime.waitReason };
      }
    }

    const runningCount = this.getRunningCount(bucket, visible);
    if (runningCount >= limit) {
      task.runtime.status = 'queued';
      task.runtime.waitReason = visible ? `bucket:${bucket}` : 'tab-hidden';
      this.store.setTask(taskId, task);
      return { granted: false, waitReason: task.runtime.waitReason };
    }
    task.runtime.status = 'leased';
    task.runtime.waitReason = undefined;
    task.runtime.startedAt = task.runtime.startedAt || Date.now();
    task.runtime.heartbeatTs = Date.now();
    this.store.setTask(taskId, task);
    return { granted: true };
  }

  pauseTask(taskId: string, reason: string = 'paused'): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task && task.runtime.status !== 'done' && task.runtime.status !== 'canceled') {
      task.runtime.status = 'paused';
      task.runtime.waitReason = reason;
      task.runtime.pauseCount += 1;
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  resumeTask(taskId: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task && task.runtime.status === 'paused') {
      task.runtime.status = 'queued';
      task.runtime.waitReason = undefined;
      task.runtime.resumeCount += 1;
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  heartbeatTask(taskId: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task) {
      task.runtime.heartbeatTs = Date.now();
      if (task.runtime.status === 'leased') task.runtime.status = 'running';
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  completeTask(taskId: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task) {
      task.runtime.status = 'done';
      task.runtime.endedAt = Date.now();
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  failTask(taskId: string, _error: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task) {
      task.runtime.status = 'error';
      task.runtime.endedAt = Date.now();
      task.runtime.retryCount += 1;
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  cancelTask(taskId: string, _reason: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task) {
      task.runtime.status = 'canceled';
      task.runtime.endedAt = Date.now();
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  updateVisibility(tabId: number, visible: boolean): { ok: true } {
    this.cleanupStaleTasks();
    this.store.setVisibility(tabId, visible);
    return { ok: true };
  }

  clearAll(): { ok: true } {
    this.store.clear();
    this.dedupeIndex.clear();
    return { ok: true };
  }

  queryState() {
    this.cleanupStaleTasks();
    const tasks = this.store.listTasks().map(record => ({
      taskId: record.descriptor.taskId,
      label: record.descriptor.label,
      tabId: record.descriptor.tabId,
      pageUrl: record.descriptor.pageUrl,
      pageType: record.descriptor.pageType,
      mainId: record.descriptor.mainId,
      pageInstanceId: record.descriptor.pageInstanceId,
      phase: record.descriptor.phase,
      priority: record.descriptor.priority,
      cost: record.descriptor.cost,
      visibilityPolicy: record.descriptor.visibilityPolicy,
      timeoutMs: record.descriptor.timeoutMs,
      retryLimit: record.descriptor.retryLimit,
      dedupeKey: record.descriptor.dedupeKey,
      resumePolicy: record.descriptor.resumePolicy,
      createdAt: record.descriptor.createdAt,
      status: record.runtime.status,
      waitReason: record.runtime.waitReason,
      startedAt: record.runtime.startedAt,
      endedAt: record.runtime.endedAt,
      retryCount: record.runtime.retryCount,
      pauseCount: record.runtime.pauseCount,
      resumeCount: record.runtime.resumeCount,
      heartbeatTs: record.runtime.heartbeatTs,
    }));
    return { tasks };
  }

  handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void {
    try {
      switch (message?.type) {
        case TASK_CENTER_MESSAGE.REGISTER:
          sendResponse(this.registerTask(message.payload, sender));
          return;
        case TASK_CENTER_MESSAGE.REQUEST_LEASE:
          sendResponse(this.requestLease(message.payload.taskId));
          return;
        case TASK_CENTER_MESSAGE.HEARTBEAT:
          sendResponse(this.heartbeatTask(message.payload.taskId));
          return;
        case TASK_CENTER_MESSAGE.PAUSE:
          sendResponse(this.pauseTask(message.payload.taskId, String(message.payload.reason || 'paused')));
          return;
        case TASK_CENTER_MESSAGE.RESUME:
          sendResponse(this.resumeTask(message.payload.taskId));
          return;
        case TASK_CENTER_MESSAGE.COMPLETE:
          sendResponse(this.completeTask(message.payload.taskId));
          return;
        case TASK_CENTER_MESSAGE.FAIL:
          sendResponse(this.failTask(message.payload.taskId, String(message.payload.error || '')));
          return;
        case TASK_CENTER_MESSAGE.CANCEL:
          sendResponse(this.cancelTask(message.payload.taskId, String(message.payload.reason || '')));
          return;
        case TASK_CENTER_MESSAGE.VISIBILITY:
          if (typeof sender.tab?.id === 'number') {
            sendResponse(this.updateVisibility(sender.tab.id, !!message.payload?.visible));
            return;
          }
          sendResponse({ ok: false, error: 'missing-tab-id' });
          return;
        case TASK_CENTER_MESSAGE.QUERY:
          sendResponse(this.queryState());
          return;
        case TASK_CENTER_MESSAGE.CLEAR:
          sendResponse(this.clearAll());
          return;
        default:
          sendResponse({ ok: false, error: 'unknown-task-center-message' });
          return;
      }
    } catch (error) {
      sendResponse({ ok: false, error: String(error) });
    }
  }
}

export const globalTaskCenter = new GlobalTaskCenter();
