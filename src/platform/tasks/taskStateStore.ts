import type { GlobalTaskRecord } from '../../shared/taskCenterTypes';

export class TaskStateStore {
  private tasks = new Map<string, GlobalTaskRecord>();
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

  clear(): void {
    this.tasks.clear();
    this.tabVisibility.clear();
  }
}
