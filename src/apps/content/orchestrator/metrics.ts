export interface OrchestratorMetricsSnapshot {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  timeoutTasks: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  maxDurationTask: string;
}

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

  getSnapshot(): OrchestratorMetricsSnapshot {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = createInitialOrchestratorMetrics();
  }
}
