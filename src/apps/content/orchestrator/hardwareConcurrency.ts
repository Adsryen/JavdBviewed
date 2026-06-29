/**
 * @file hardwareConcurrency.ts
 * @description 根据设备 CPU 核心数决策高阶段任务的并发上限
 * @module apps/content
 */
export interface HighTaskConcurrencyDecision {
  maxConcurrentHighTasks: number;  // 高阶段任务的并发数
  message: string;                 // 决策说明日志
}

/**
 * 根据 CPU 核心数决策并发上限
 * 8+核 → 5并发，4核以下 → 2并发，默认 → 3并发
 */

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

/**
 * 在浏览器环境中获取硬件并发能力
 */
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
