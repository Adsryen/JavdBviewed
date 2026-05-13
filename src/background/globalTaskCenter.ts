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
  // P1 FIX: 跨页面依赖同步 - 在 background 维护全局已完成任务集合
  private completedTaskLabels = new Set<string>();
  private readonly storageKey = 'taskCenter:snapshot';
  private readonly dedupeStorageKey = 'taskCenter:dedupeIndex'; // P2 FIX: dedupe 持久化
  private isRestored = false;

  private getPhaseWeight(phase: string): number {
    if (phase === 'critical') return 4000;
    if (phase === 'high') return 3000;
    if (phase === 'deferred') return 2000;
    if (phase === 'idle') return 1000;
    return 0;
  }

  // P1 FIX: Service Worker 重启后，从 chrome.storage 恢复任务状态
  async restoreFromStorage(): Promise<void> {
    if (this.isRestored) return;
    try {
      // P2 FIX: 一次性读取两个 key，避免多次 chrome.storage 调用
      const item = await new Promise<any>((resolve, reject) => {
        chrome.storage.local.get([this.storageKey, this.dedupeStorageKey], (result) => {
          if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
          resolve(result);
        });
      });
      const data = item[this.storageKey];
      if (data && typeof data === 'object') {
        if (data.tasks && Array.isArray(data.tasks)) {
          for (const record of data.tasks) {
            if (record?.descriptor?.taskId && record?.runtime?.status) {
              this.store.setTask(record.descriptor.taskId, record);
              if (record.descriptor.dedupeKey) {
                this.dedupeIndex.set(record.descriptor.dedupeKey, record.descriptor.taskId);
              }
            }
          }
        }
        if (data.completedLabels && Array.isArray(data.completedLabels)) {
          this.completedTaskLabels = new Set(data.completedLabels);
        }
        console.log('[TaskCenter] Restored', this.store.listTasks().length, 'tasks and', this.completedTaskLabels.size, 'completed labels from storage');
      }
      // P2 FIX: 同时恢复 dedupe index
      const dedupeData = item[this.dedupeStorageKey];
      if (dedupeData && typeof dedupeData === 'object') {
        this.dedupeIndex = new Map(Object.entries(dedupeData));
        console.log('[TaskCenter] Restored dedupe index:', this.dedupeIndex.size, 'entries');
      }
      this.isRestored = true;
      // P1 FIX: 恢复后启动定期快照
      this.startPeriodicSnapshot();
    } catch (err) {
      console.warn('[TaskCenter] Failed to restore from storage:', err);
      this.isRestored = true;
    }
  }

  // P1 FIX: 定期快照到 chrome.storage，防止 Service Worker 重启丢失状态
  private persistToStorage(): void {
    const snapshot = {
      tasks: this.store.listTasks().map(record => ({
        descriptor: record.descriptor,
        runtime: record.runtime,
      })),
      completedLabels: Array.from(this.completedTaskLabels),
      savedAt: Date.now(),
    };
    chrome.storage.local.set({ [this.storageKey]: snapshot }).catch(() => {});
    // P2 FIX: 同时持久化 dedupe index，防止 SW 重启后 dedupe 失效导致重复任务
    if (this.dedupeIndex.size > 0) {
      const dedupeSnapshot = Object.fromEntries(this.dedupeIndex.entries());
      chrome.storage.local.set({ [this.dedupeStorageKey]: dedupeSnapshot }).catch(() => {});
    }
  }

  // P1 FIX: 跨页面依赖同步 - 通知任务中心某个 label 的任务已完成
  markTaskLabelCompleted(label: string): void {
    this.completedTaskLabels.add(label);
    this.persistToStorage();
  }

  // P1 FIX: 查询某个 label 是否已在全局完成（供 content script 调用）
  isTaskLabelCompleted(label: string): boolean {
    return this.completedTaskLabels.has(label);
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
    return record.runtime.status === 'queued';
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
    if (task.runtime.status === 'registered') {
      task.runtime.status = 'queued';
      task.runtime.waitReason = undefined;
      this.store.setTask(taskId, task);
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
        && limit >= 3                               // P2 NOTE: limit<3 的 bucket（translate=1, drive115=2）永远无法触发此逃生口
        && runningCount < limit
        && (bestPriority - currentPriority) <= 3;   // P2 NOTE: 允许优先级差<=3 的任务绕过，差值太宽松可能导致 deferred 抢 high 的槽
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
      task.runtime.waitReason = undefined;
      task.runtime.endedAt = Date.now();
      this.store.setTask(taskId, task);
      // P1 FIX: 任务完成时同步到全局已完成标签集合（跨页面依赖）
      this.markTaskLabelCompleted(task.descriptor.label);
    }
    return { ok: true };
  }

  failTask(taskId: string, _error: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task) {
      task.runtime.status = 'error';
      task.runtime.waitReason = undefined;
      task.runtime.endedAt = Date.now();
      task.runtime.retryCount += 1;
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  cancelTask(taskId: string, reason: string): { ok: true } {
    this.cleanupStaleTasks();
    const task = this.store.getTask(taskId);
    if (task) {
      task.runtime.status = 'canceled';
      task.runtime.waitReason = reason || 'manual-cancel';
      task.runtime.endedAt = Date.now();
      this.store.setTask(taskId, task);
    }
    return { ok: true };
  }

  cancelTasksByPageInstance(pageInstanceId: string, reason: string): { ok: true; canceled: number } {
    this.cleanupStaleTasks();
    let canceled = 0;
    for (const record of this.store.listTasks()) {
      if (record?.descriptor?.pageInstanceId !== pageInstanceId) continue;
      if (['done', 'error', 'canceled'].includes(record.runtime.status)) continue;
      record.runtime.status = 'canceled';
      record.runtime.waitReason = reason || 'page-closed-by-user';
      record.runtime.endedAt = Date.now();
      this.store.setTask(record.descriptor.taskId, record);
      canceled += 1;
    }
    return { ok: true, canceled };
  }

  cancelTasksByTabId(tabId: number, reason: string): { ok: true; canceled: number } {
    this.cleanupStaleTasks();
    let canceled = 0;
    for (const record of this.store.listTasks()) {
      if (record?.descriptor?.tabId !== tabId) continue;
      if (['done', 'error', 'canceled'].includes(record.runtime.status)) continue;
      record.runtime.status = 'canceled';
      record.runtime.waitReason = reason || 'page-closed-by-user';
      record.runtime.endedAt = Date.now();
      this.store.setTask(record.descriptor.taskId, record);
      canceled += 1;
    }
    return { ok: true, canceled };
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

  // P1 FIX: 定期快照定时器（每 30s 持久化一次状态，防止 service worker 重启丢失）
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private startPeriodicSnapshot(): void {
    if (this.persistTimer) return;
    this.persistTimer = setInterval(() => {
      this.persistToStorage();
    }, 30_000);
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
        // P1 FIX: 跨页面依赖同步消息
        case 'task-center:mark-completed':
          this.markTaskLabelCompleted(String(message.payload?.label || ''));
          sendResponse({ ok: true });
          return;
        case 'task-center:check-completed':
          sendResponse({ ok: true, completed: this.isTaskLabelCompleted(String(message.payload?.label || '')) });
          return;
        case 'task-center:restore':
          this.restoreFromStorage().then(() => { sendResponse({ ok: true }); }).catch((e) => { sendResponse({ ok: false, error: String(e) }); });
          return; // async response via sendResponse
        case 'task-center:cancel-page-instance':
          sendResponse(this.cancelTasksByPageInstance(String(message.payload?.pageInstanceId || ''), String(message.payload?.reason || 'page-closed-by-user')));
          return;
        default:
          sendResponse({ ok: false, error: 'unknown-task-center-message' });
          return;
      }
    } catch (error) {
      sendResponse({ ok: false, error: String(error) });
    }
  }

  isAsyncMessage(messageType: string | undefined): boolean {
    return messageType === 'task-center:restore';
  }
}

export const globalTaskCenter = new GlobalTaskCenter();
