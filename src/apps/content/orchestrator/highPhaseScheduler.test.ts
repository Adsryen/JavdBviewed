import { describe, expect, it, vi } from 'vitest';
import { runHighPhaseTasks } from './highPhaseScheduler';
import type { ScheduledTask } from './types';

function task(label: string, priority?: number, dependsOn?: string[]): ScheduledTask {
  return {
    task: () => undefined,
    options: { label, priority, dependsOn },
  };
}

describe('runHighPhaseTasks', () => {
  it('runs tasks by priority with the configured concurrency limit', async () => {
    const runningLabels: string[] = [];
    const completedLabels: string[] = [];

    await runHighPhaseTasks({
      tasks: [
        task('low', 1),
        task('high', 9),
        task('middle', 5),
      ],
      completedTasks: new Set(),
      maxConcurrentTasks: 1,
      runTask: async (item) => {
        runningLabels.push(item.options.label || '');
        completedLabels.push(item.options.label || '');
      },
      log: vi.fn(),
    });

    expect(runningLabels).toEqual(['high', 'middle', 'low']);
    expect(completedLabels).toEqual(['high', 'middle', 'low']);
  });

  it('waits until dependencies are completed by earlier high tasks', async () => {
    const completedTasks = new Set<string>();
    const runningLabels: string[] = [];

    await runHighPhaseTasks({
      tasks: [
        task('dependent', 10, ['base']),
        task('base', 5),
      ],
      completedTasks,
      maxConcurrentTasks: 1,
      runTask: async (item) => {
        runningLabels.push(item.options.label || '');
        completedTasks.add(item.options.label || '');
      },
      log: vi.fn(),
    });

    expect(runningLabels).toEqual(['base', 'dependent']);
  });

  it('forces blocked tasks to avoid deadlock and logs diagnostics', async () => {
    const log = vi.fn();
    const runningLabels: string[] = [];

    await runHighPhaseTasks({
      tasks: [
        task('blocked', 10, ['missing']),
      ],
      completedTasks: new Set(),
      maxConcurrentTasks: 2,
      runTask: async (item) => {
        runningLabels.push(item.options.label || '');
      },
      log,
    });

    expect(runningLabels).toEqual(['blocked']);
    expect(log).toHaveBeenCalledWith('warning: circular dependency or missing dependency detected', {
      pendingTasks: [
        {
          label: 'blocked',
          dependsOn: ['missing'],
        },
      ],
    });
  });
});
