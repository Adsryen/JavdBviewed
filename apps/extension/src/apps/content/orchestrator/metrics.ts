/**
 * @file metrics.ts
 * @description 编排器运行指标状态 —— 记录任务完成/失败/超时统计
 * @module apps/content
 */
export interface OrchestratorMetricsSnapshot {
  totalTasks: number;        // 总任务数
  completedTasks: number;    // 完成任务数
  failedTasks: number;       // 失败任务数
  timeoutTasks: number;      // 超时任务数
  totalDuration: number;     // 所有完成任务的总耗时（毫秒）
  avgDuration: number;       // 平均耗时
  maxDuration: number;       // 最大耗时
  minDuration: number;       // 最小耗时（初始为 Infinity）
  maxDurationTask: string;   // 耗时最长任务的标签
}

/** 创建零值初始指标快照 */

export function createInitialOrchestratorMetrics(): OrchestratorMetricsSnapshot {
  return {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    timeoutTasks: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    maxDurationTask: '',
  };
}

export class OrchestratorMetricsState {
  private metrics = createInitialOrchestratorMetrics();

  /** 记录单次任务执行结果，更新累计指标 */
  recordTask(durationMs: number, success: boolean, isTimeout = false, taskLabel?: string): void {
    this.metrics.totalTasks++;
    if (success) {
      this.metrics.completedTasks++;
      this.metrics.totalDuration += durationMs;
      this.metrics.avgDuration = this.metrics.totalDuration / this.metrics.completedTasks;

      if (durationMs > this.metrics.maxDuration) {
        this.metrics.maxDuration = durationMs;
        this.metrics.maxDurationTask = taskLabel || 'unknown';
      }

      this.metrics.minDuration = Math.min(this.metrics.minDuration, durationMs);
      return;
    }

    if (isTimeout) {
      this.metrics.timeoutTasks++;
    } else {
      this.metrics.failedTasks++;
    }
  }

  /** 返回当前指标快照（浅拷贝） */
  getSnapshot(): OrchestratorMetricsSnapshot {
    return { ...this.metrics };
  }

  /** 重置归零 */
  reset(): void {
    this.metrics = createInitialOrchestratorMetrics();
  }
}
