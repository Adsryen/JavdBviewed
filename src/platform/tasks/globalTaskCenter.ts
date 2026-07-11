/**
 * @file globalTaskCenter.ts
 * @description 全局任务中心 —— 管理所有异步任务的生命周期、排队、租约、超时和去重
 * @module platform/tasks
 *
 * 任务生命周期：registered → queued → leased → running → done/error/canceled
 * 核心机制：
 * - 优先级队列：priority 越大越优先
 * - 租约（lease）：前台页面先获得执行权，后台排队等待
 * - 去重：通过 dedupeKey 防止重复创建同类任务
 * - 超时守卫：running 超过 timeoutMs 自动标记 error
 * - 持久化：chrome.storage 快照 + 关键路径即时刷盘 + onSuspend 刷盘（event page）
 */
import { TASK_BUCKET_LIMITS, resolveTaskBucket } from './taskPolicy';
import { TaskStateStore } from './taskStateStore';
import { TASK_CENTER_MESSAGE } from '../../shared/taskCenterProtocol';
import type { GlobalTaskDescriptor, GlobalTaskRuntimeState } from '../../shared/taskCenterTypes';
import { computeTaskDisposition, getEffectiveBucketLimit } from './taskCenterPolicyRuntime';

/** 租约响应：是否授予执行权，未授予时附带等待原因 */
type LeaseResponse = { granted: boolean; waitReason?: string };

/** 排队候选任务（附带优先级评分） */
type QueueCandidate = {
  record: ReturnType<TaskStateStore['listTasks']>[number];
  score: number;
};

export class GlobalTaskCenter {
  private store = new TaskStateStore();
  private dedupeIndex = new Map<string, string>();
  private readonly taskRetentionMs = 60 * 60 * 1000;
  private readonly pendingTaskMaxAgeMs = 60 * 1000;
  private readonly pausedTaskMaxAgeMs = 3 * 60 * 1000;
  private readonly hiddenRunningTaskMaxAgeMs = 45 * 1000;
  // P1 FIX: 跨页面依赖同步 - 在 background 维护全局已完成任务集合
  private completedTaskLabels = new Set<string>();
  private readonly storageKey = 'taskCenter:snapshot';
  private readonly dedupeStorageKey = 'taskCenter:dedupeIndex'; // P2 FIX: dedupe 持久化
  private isRestored = false;
  /** 并发 restore 合并为单次 Promise，避免冷启动 race 双写 */
  private restorePromise: Promise<void> | null = null;
  // P1 FIX: 定期快照定时器（每 30s 持久化一次状态，防止 service worker / event page 重启丢失）
  private persistTimer: ReturnType<typeof setInterval> | null = null;

  private getPhaseWeight(phase: string): number {
    if (phase === 'critical') return 4000;
    if (phase === 'high') return 3000;
    if (phase === 'deferred') return 2000;
    if (phase === 'idle') return 1000;
    return 0;
  }

  /**
   * Service Worker / event page 冷启动后，从 chrome.storage 恢复任务状态。
   * 幂等：并发调用共享同一 Promise；完成后后续调用立即返回。
   */
  async restoreFromStorage(): Promise<void> {
    if (this.isRestored) return;
    if (this.restorePromise) return this.restorePromise;

    this.restorePromise = this.doRestoreFromStorage();
    try {
      await this.restorePromise;
    } finally {
      this.restorePromise = null;
    }
  }

  private async doRestoreFromStorage(): Promise<void> {
    try {
      // P2 FIX: 一次性读取两个 key，避免多次 chrome.storage 调用
      const item = await new Promise<any>((resolve, reject) => {
        chrome.storage.local.get([this.storageKey, this.dedupeStorageKey], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result);
        });
      });
      const data = item[this.storageKey];
      if (data && typeof data === 'object') {
        if (data.tasks && Array.isArray(data.tasks)) {
          for (const record of data.tasks) {
            if (record?.descriptor?.taskId && record?.runtime?.status) {
              // 冷启动期间若消息路径已写入内存任务，优先保留内存（不覆盖）
              if (this.store.getTask(record.descriptor.taskId)) continue;
              this.store.setTask(record.descriptor.taskId, record);
              if (record.descriptor.dedupeKey && !this.dedupeIndex.has(record.descriptor.dedupeKey)) {
                this.dedupeIndex.set(record.descriptor.dedupeKey, record.descriptor.taskId);
              }
            }
          }
        }
        if (data.completedLabels && Array.isArray(data.completedLabels)) {
          // 与 restore 期间 mark-completed 取并集
          for (const label of data.completedLabels) {
            if (typeof label === 'string' && label) this.completedTaskLabels.add(label);
          }
        }
        console.log(
          '[TaskCenter] Restored',
          this.store.listTasks().length,
          'tasks and',
          this.completedTaskLabels.size,
          'completed labels from storage',
        );
      }
      // P2 FIX: 恢复 dedupe index；内存已有 key 优先（register 可能已更新）
      const dedupeData = item[this.dedupeStorageKey];
      if (dedupeData && typeof dedupeData === 'object') {
        for (const [key, taskId] of Object.entries(dedupeData)) {
          if (typeof taskId !== 'string' || !taskId) continue;
          if (!this.dedupeIndex.has(key)) {
            this.dedupeIndex.set(key, taskId);
          }
        }
        console.log('[TaskCenter] Restored dedupe index:', this.dedupeIndex.size, 'entries');
      }
      this.isRestored = true;
      // 恢复后清理可能已过期的 leased/running（后台被回收期间前台已死）
      this.cleanupStaleTasks();
      this.persistToStorage();
      this.startPeriodicSnapshot();
    } catch (err) {
      console.warn('[TaskCenter] Failed to restore from storage:', err);
      this.isRestored = true;
      this.startPeriodicSnapshot();
    }
  }

  /** 是否已完成至少一次 restore 尝试（成功或失败） */
  hasRestoredFromStorage(): boolean {
    return this.isRestored;
  }

  /**
   * 强制刷盘（onSuspend / 测试 / 关键取消路径）。
   * 不依赖 isRestored，避免挂起时漏写。
   */
  flushPersist(): void {
    try {
      this.cleanupStaleTasks();
      this.persistToStorage();
    } catch (err) {
      console.warn('[TaskCenter] flushPersist failed:', err);
    }
  }

  // P1 FIX: 定期快照到 chrome.storage，防止 Service Worker / event page 重启丢失状态
  private persistToStorage(): void {
    try {
      const storage = (globalThis as typeof globalThis & {
        chrome?: typeof chrome;
      }).chrome?.storage?.local;
      if (!storage?.set) return;

      const snapshot = {
        tasks: this.store.listTasks().map(record => ({
          descriptor: record.descriptor,
          runtime: record.runtime,
        })),
        completedLabels: Array.from(this.completedTaskLabels),
        savedAt: Date.now(),
      };
      const maybePromise = storage.set({ [this.storageKey]: snapshot }) as unknown;
      if (maybePromise != null && typeof (maybePromise as Promise<void>).then === 'function') {
        (maybePromise as Promise<void>).catch(() => {});
      }
      // P2 FIX: 同时持久化 dedupe index，防止 SW 重启后 dedupe 失效导致重复任务
      // 空 index 也要写回，避免 storage 残留陈旧映射
      const dedupeSnapshot = Object.fromEntries(this.dedupeIndex.entries());
      const dedupePromise = storage.set({ [this.dedupeStorageKey]: dedupeSnapshot }) as unknown;
      if (dedupePromise != null && typeof (dedupePromise as Promise<void>).then === 'function') {
        (dedupePromise as Promise<void>).catch(() => {});
      }
    } catch {
      // 测试环境或 chrome 不可用时静默跳过
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
        console.log('[TaskCenter] Canceled stale active task', {
          taskId: descriptor.taskId,
          label: descriptor.label,
          pageInstanceId: descriptor.pageInstanceId,
          reason: runtime.waitReason,
        });
      }

      const isHidden = !this.store.isTabVisible(descriptor.tabId);
      const isActiveRunningTask = runtime.status === 'leased' || runtime.status === 'running';
      const hiddenBaseTs = runtime.heartbeatTs || runtime.startedAt || descriptor.createdAt;
      if (isHidden && isActiveRunningTask && now - hiddenBaseTs > this.hiddenRunningTaskMaxAgeMs) {
        runtime.status = 'canceled';
        runtime.waitReason = 'hidden-background-timeout';
        runtime.endedAt = now;
        this.store.setTask(descriptor.taskId, record);
        console.log('[TaskCenter] Canceled hidden running task', {
          taskId: descriptor.taskId,
          label: descriptor.label,
          pageInstanceId: descriptor.pageInstanceId,
          tabId: descriptor.tabId,
          hiddenMs: now - hiddenBaseTs,
        });
      }

      const isPendingTask = runtime.status === 'registered' || runtime.status === 'queued';
      const pendingBaseTs = runtime.lastProgressAt || runtime.heartbeatTs || descriptor.createdAt;
      if (isPendingTask && now - pendingBaseTs > this.pendingTaskMaxAgeMs) {
        runtime.status = 'canceled';
        runtime.waitReason = 'page-instance-orphaned';
        runtime.endedAt = now;
        this.store.setTask(descriptor.taskId, record);
        console.log('[TaskCenter] Canceled orphan pending task', {
          taskId: descriptor.taskId,
          label: descriptor.label,
          pageInstanceId: descriptor.pageInstanceId,
          ageMs: now - pendingBaseTs,
        });
      }

      const pausedBaseTs = runtime.lastProgressAt || runtime.heartbeatTs || descriptor.createdAt;
      if (runtime.status === 'paused' && now - pausedBaseTs > this.pausedTaskMaxAgeMs) {
        runtime.status = 'canceled';
        runtime.waitReason = 'paused-timeout';
        runtime.endedAt = now;
        this.store.setTask(descriptor.taskId, record);
        console.log('[TaskCenter] Canceled stale paused task', {
          taskId: descriptor.taskId,
          label: descriptor.label,
          pageInstanceId: descriptor.pageInstanceId,
          ageMs: now - pausedBaseTs,
        });
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

  registerTask(descriptor: GlobalTaskDescriptor, sender?: chrome.runtime.MessageSender): {
    ok: true;
    taskId: string;
    tabId: number;
    reused?: boolean;
    status?: string;
  } {
    this.cleanupStaleTasks();
    const existing = this.store.getTask(descriptor.taskId);
    if (existing) {
      return {
        ok: true,
        taskId: descriptor.taskId,
        tabId: existing.descriptor.tabId,
        reused: true,
        status: existing.runtime.status,
      };
    }
    const dedupeKey = descriptor.dedupeKey || `${descriptor.label}:${descriptor.pageUrl}`;
    const dedupedTaskId = this.dedupeIndex.get(dedupeKey);
    if (dedupedTaskId) {
      const dedupedTask = this.store.getTask(dedupedTaskId);
      if (dedupedTask) {
        const status = dedupedTask.runtime.status;
        // 共享动作（如 115 推送）复用终态结果，避免多页重复真实执行
        if (['done', 'error'].includes(status) && dedupedTask.descriptor.shareScope === 'dedupe-by-action') {
          return {
            ok: true,
            taskId: dedupedTaskId,
            tabId: dedupedTask.descriptor.tabId,
            reused: true,
            status,
          };
        }
        if (['canceled', 'done', 'error'].includes(status)) {
          this.store.deleteTask(dedupedTaskId);
          if (this.dedupeIndex.get(dedupeKey) === dedupedTaskId) {
            this.dedupeIndex.delete(dedupeKey);
          }
        } else {
          return {
            ok: true,
            taskId: dedupedTaskId,
            tabId: dedupedTask.descriptor.tabId,
            reused: true,
            status,
          };
        }
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
    // 关键路径即时刷盘：缩小 SW/event page 回收窗口丢任务
    this.persistToStorage();
    return { ok: true, taskId: descriptor.taskId, tabId, reused: false, status: 'registered' };
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

    const isInteractive115Push = task.descriptor.label === 'drive115:push' && visible;
    const samePageCandidate = bestCandidate.record.descriptor.pageInstanceId === task.descriptor.pageInstanceId;

    if (bestCandidate.record.descriptor.taskId !== taskId) {
      const runningCount = this.getRunningCount(bucket, visible);
      const currentPriority = Number(task.descriptor.priority || 0);
      const bestPriority = Number(bestCandidate.record.descriptor.priority || 0);
      const allowInteractiveSamePageFastLane = isInteractive115Push && samePageCandidate && runningCount < limit;
      const allowBackgroundParallel = !visible
        && task.descriptor.visibilityPolicy === 'background_allowed'
        && limit >= 3                               // P2 NOTE: limit<3 的 bucket（translate=1, drive115=2）永远无法触发此逃生口
        && runningCount < limit
        && (bestPriority - currentPriority) <= 3;   // P2 NOTE: 允许优先级差<=3 的任务绕过，差值太宽松可能导致 deferred 抢 high 的槽
      if (!allowInteractiveSamePageFastLane && !allowBackgroundParallel) {
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
    this.persistToStorage();
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
      this.persistToStorage();
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
      this.persistToStorage();
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
      this.persistToStorage();
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
      this.persistToStorage();
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
    if (canceled > 0) this.persistToStorage();
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
    if (canceled > 0) this.persistToStorage();
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
    this.completedTaskLabels.clear();
    try {
      const storage = (globalThis as typeof globalThis & {
        chrome?: typeof chrome;
      }).chrome?.storage?.local;
      const maybePromise = storage?.remove?.([this.storageKey, this.dedupeStorageKey]) as unknown;
      if (maybePromise != null && typeof (maybePromise as Promise<void>).then === 'function') {
        (maybePromise as Promise<void>).catch(() => {});
      }
    } catch {
      // ignore
    }
    return { ok: true };
  }

  clearTerminalTasks(): { ok: true; cleared: number } {
    this.cleanupStaleTasks();
    let cleared = 0;
    for (const record of this.store.listTasks()) {
      if (!['done', 'error', 'canceled'].includes(record.runtime.status)) continue;
      this.store.deleteTask(record.descriptor.taskId);
      const dedupeKey = record.descriptor.dedupeKey;
      if (dedupeKey && this.dedupeIndex.get(dedupeKey) === record.descriptor.taskId) {
        this.dedupeIndex.delete(dedupeKey);
      }
      cleared += 1;
    }
    this.persistToStorage();
    return { ok: true, cleared };
  }

  stopAllActiveTasks(reason: string = 'manual-stop-all'): { ok: true; canceled: number } {
    this.cleanupStaleTasks();
    let canceled = 0;
    for (const record of this.store.listTasks()) {
      if (['done', 'error', 'canceled'].includes(record.runtime.status)) continue;
      record.runtime.status = 'canceled';
      record.runtime.waitReason = reason;
      record.runtime.endedAt = Date.now();
      this.store.setTask(record.descriptor.taskId, record);
      canceled += 1;
    }
    this.persistToStorage();
    return { ok: true, canceled };
  }

  private startPeriodicSnapshot(): void {
    if (this.persistTimer) return;
    this.persistTimer = setInterval(() => {
      this.cleanupStaleTasks();
      this.persistToStorage();
    }, 30_000);
  }

  queryState() {
    this.cleanupStaleTasks();
    const tasks = this.store.listTasks().map(record => ({
      taskId: record.descriptor.taskId,
      label: record.descriptor.label,
      parentTaskId: record.descriptor.parentTaskId,
      rootTaskId: record.descriptor.rootTaskId,
      correlationId: record.descriptor.correlationId,
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
      executionClass: record.descriptor.executionClass,
      shareScope: record.descriptor.shareScope,
      createdAt: record.descriptor.createdAt,
      status: record.runtime.status,
      waitReason: record.runtime.waitReason,
      startedAt: record.runtime.startedAt,
      endedAt: record.runtime.endedAt,
      lastProgressAt: record.runtime.lastProgressAt,
      progressPct: record.runtime.progressPct,
      stage: record.runtime.stage,
      stageStartedAt: record.runtime.stageStartedAt,
      stageDurationMs: record.runtime.stageDurationMs,
      detail: record.runtime.detail,
      retryCount: record.runtime.retryCount,
      pauseCount: record.runtime.pauseCount,
      resumeCount: record.runtime.resumeCount,
      heartbeatTs: record.runtime.heartbeatTs,
    }));
    return { tasks };
  }

  updateTaskProgress(taskId: string, payload: { stage?: string; progressPct?: number; detail?: string; stageStartedAt?: number; stageDurationMs?: number }) {
    const record = this.store.getTask(taskId);
    if (!record) return { ok: false, error: 'task-not-found' };
    record.runtime.lastProgressAt = Date.now();
    if (typeof payload.progressPct === 'number') record.runtime.progressPct = payload.progressPct;
    if (typeof payload.stage === 'string') record.runtime.stage = payload.stage;
    if (typeof payload.detail === 'string') record.runtime.detail = payload.detail;
    if (typeof payload.stageStartedAt === 'number') record.runtime.stageStartedAt = payload.stageStartedAt;
    if (typeof payload.stageDurationMs === 'number') record.runtime.stageDurationMs = payload.stageDurationMs;
    this.store.setTask(taskId, record);
    this.persistToStorage();
    return { ok: true };
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
        case TASK_CENTER_MESSAGE.PROGRESS:
          sendResponse(this.updateTaskProgress(message.payload.taskId, message.payload || {}));
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
        case 'task-center:stop-all':
          sendResponse(this.stopAllActiveTasks(String(message.payload?.reason || 'manual-stop-all')));
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
        case TASK_CENTER_MESSAGE.PAGE_LIFECYCLE:
        case TASK_CENTER_MESSAGE.CANCEL_PAGE_INSTANCE: {
          const pageInstanceId = String(message.payload?.pageInstanceId || '');
          const reason = String(message.payload?.reason || 'page-closed-by-user');
          if (!pageInstanceId) {
            sendResponse({ ok: false, error: 'missing-page-instance-id' });
            return;
          }
          sendResponse(this.cancelTasksByPageInstance(pageInstanceId, reason));
          return;
        }
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
