export interface HighTaskConcurrencyDecision {
  maxConcurrentHighTasks: number;
  message: string;
}

export function resolveHighTaskConcurrency(cores?: number): HighTaskConcurrencyDecision {
  if (typeof cores === 'number' && cores >= 8) {
    return {
      maxConcurrentHighTasks: 5,
      message: 'Hardware detection: High-end device, concurrency set to 5',
    };
  }

  if (typeof cores === 'number' && cores < 4) {
    return {
      maxConcurrentHighTasks: 2,
      message: 'Hardware detection: Low-end device, concurrency set to 2',
    };
  }

  return {
    maxConcurrentHighTasks: 3,
    message: 'Hardware detection: Mid-range device, concurrency set to 3',
  };
}

export function resolveBrowserHighTaskConcurrency(): HighTaskConcurrencyDecision {
  try {
    return resolveHighTaskConcurrency(navigator.hardwareConcurrency);
  } catch {
    return {
      maxConcurrentHighTasks: 3,
      message: 'Hardware detection failed, using default concurrency: 3',
    };
  }
}
