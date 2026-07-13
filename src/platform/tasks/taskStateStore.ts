/**
 * @file taskStateStore.ts
 * @description 任务状态存储 —— 纯内存 Map 存储，管理任务记录和标签页可见性
 * @module platform/tasks
 *
 * 注意：数据仅在 Service Worker 生命周期内有效，重启后通过 restoreFromStorage 恢复
 */
import type { GlobalTaskRecord } from '../../shared/taskCenterTypes';

/** 任务状态存储（内存 Map） */
export class TaskStateStore {
  private tasks = new Map<string, GlobalTaskRecord>();
  /** 标签页可见性追踪（用于前台/后台任务调度决策） */
  private tabVisibility = new Map<number, { visible: boolean; updatedAt: number }>();

  getTask(taskId: string): GlobalTaskRecord | undefined {
    return this.tasks.get(taskId);
  }

  setTask(taskId: string, record: GlobalTaskRecord): void {
    this.tasks.set(taskId, record);
  }

  deleteTask(taskId: string): void {
    this.tasks.delete(taskId);
  }

  listTasks(): GlobalTaskRecord[] {
    return Array.from(this.tasks.values());
  }

  setVisibility(tabId: number, visible: boolean): void {
    this.tabVisibility.set(tabId, { visible, updatedAt: Date.now() });
  }

  isTabVisible(tabId: number): boolean {
    return this.tabVisibility.get(tabId)?.visible === true;
  }

  hasTabVisibility(tabId: number): boolean {
    return this.tabVisibility.has(tabId);
  }

  clear(): void {
    this.tasks.clear();
    this.tabVisibility.clear();
  }
}
