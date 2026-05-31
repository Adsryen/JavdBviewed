import { describe, expect, it } from 'vitest';
import { OrchestratorMetricsState } from './metrics';

describe('OrchestratorMetricsState', () => {
  it('records successful task durations and tracks averages', () => {
    const metrics = new OrchestratorMetricsState();

    metrics.recordTask(100, true, false, 'first');
    metrics.recordTask(300, true, false, 'second');

    expect(metrics.getSnapshot()).toMatchObject({
      totalTasks: 2,
      completedTasks: 2,
      failedTasks: 0,
      timeoutTasks: 0,
      totalDuration: 400,
      avgDuration: 200,
      maxDuration: 300,
      minDuration: 100,
      maxDurationTask: 'second',
    });
  });

  it('records failed and timeout tasks separately', () => {
    const metrics = new OrchestratorMetricsState();

    metrics.recordTask(50, false, false, 'failed');
    metrics.recordTask(80, false, true, 'timeout');

    expect(metrics.getSnapshot()).toMatchObject({
      totalTasks: 2,
      completedTasks: 0,
      failedTasks: 1,
      timeoutTasks: 1,
    });
  });

  it('resets metrics to the initial snapshot', () => {
    const metrics = new OrchestratorMetricsState();

    metrics.recordTask(100, true, false, 'done');
    metrics.reset();

    expect(metrics.getSnapshot()).toMatchObject({
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      timeoutTasks: 0,
      minDuration: Infinity,
      maxDurationTask: '',
    });
  });
});
