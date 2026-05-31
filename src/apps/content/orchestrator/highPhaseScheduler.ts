import { partitionTasksByDependencyReadiness, sortTasksByPriority } from './schedulingRules';
import type { ScheduledTask } from './types';

type RunHighPhaseTasksInput<T extends ScheduledTask> = {
  tasks: T[];
  completedTasks: Set<string>;
  maxConcurrentTasks: number;
  runTask: (task: T) => Promise<void>;
  log: (message: string, detail?: unknown) => void;
};

function trackRunningTask(runningTasks: Promise<void>[], taskPromise: Promise<void>): void {
  runningTasks.push(taskPromise);
  taskPromise.finally(() => {
    const index = runningTasks.indexOf(taskPromise);
    if (index > -1) {
      runningTasks.splice(index, 1);
    }
  });
}

export async function runHighPhaseTasks<T extends ScheduledTask>(input: RunHighPhaseTasksInput<T>): Promise<void> {
  const tasks = sortTasksByPriority(input.tasks);
  const runningTasks: Promise<void>[] = [];
  const pendingTasks = [...tasks];

  while (pendingTasks.length > 0 || runningTasks.length > 0) {
    const { readyTasks, notReadyTasks } = partitionTasksByDependencyReadiness(pendingTasks, input.completedTasks);

    pendingTasks.length = 0;
    pendingTasks.push(...notReadyTasks);

    while (readyTasks.length > 0 && runningTasks.length < input.maxConcurrentTasks) {
      const task = readyTasks.shift()!;
      trackRunningTask(runningTasks, input.runTask(task));
    }
    pendingTasks.unshift(...readyTasks);

    if (runningTasks.length === 0 && pendingTasks.length > 0) {
      input.log('warning: circular dependency or missing dependency detected', {
        pendingTasks: pendingTasks.map((task) => ({
          label: task.options.label,
          dependsOn: task.options.dependsOn,
        })),
      });
      for (const task of pendingTasks) {
        trackRunningTask(runningTasks, input.runTask(task));
      }
      pendingTasks.length = 0;
    }

    if (runningTasks.length > 0) {
      await Promise.race(runningTasks);
    }
  }
}
