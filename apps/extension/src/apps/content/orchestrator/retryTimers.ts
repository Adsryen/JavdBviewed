/**
 * @file retryTimers.ts
 * @description 编排器延迟重试定时器管理 —— 按阶段+任务标签去重调度
 * @module apps/content
 */
import type { InitPhase } from './types';
import { createDeferredRetryKey } from './schedulingRules';

type TimerHost = {
  setTimeout(callback: () => void, delayMs: number): number;  // 浏览器 setTimeout 接口
  clearTimeout(timerId: number): void;                        // 浏览器 clearTimeout 接口
};

/** 创建基于 window 的默认定时器宿主 */
function createDefaultTimerHost(): TimerHost {
  return {
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (timerId) => clearTimeout(timerId),
  };
}

export class OrchestratorRetryTimers {
  private readonly timers = new Map<string, number>();  // 任务key → setTimeout 返回的 timerId
  private readonly timerHost: TimerHost;

  constructor(timerHost: TimerHost = createDefaultTimerHost()) {
    this.timerHost = timerHost;
  }

  /** 检查某阶段某任务是否已有待重试的定时器 */
  has(phase: InitPhase, label: string): boolean {
    return this.timers.has(createDeferredRetryKey(phase, label));
  }

  /** 取消某阶段某任务的延迟重试定时器 */
  clear(phase: InitPhase, label: string): void {
    const key = createDeferredRetryKey(phase, label);
    const timerId = this.timers.get(key);
    if (typeof timerId === 'number') {
      this.timerHost.clearTimeout(timerId);
      this.timers.delete(key);
    }
  }

  /** 取消所有活跃的延迟重试定时器 */
  clearAll(): void {
    for (const timerId of this.timers.values()) {
      this.timerHost.clearTimeout(timerId);
    }
    this.timers.clear();
  }

  /**
   * 调度一次延迟重试 —— 如果同阶段+标签已有定时器则忽略（去重）
   * @returns 是否成功调度（false = 已存在该定时器，跳过）
   */
  schedule(phase: InitPhase, label: string, delayMs: number, callback: () => void): boolean {
    const key = createDeferredRetryKey(phase, label);
    if (this.timers.has(key)) return false;

    const timerId = this.timerHost.setTimeout(() => {
      this.timers.delete(key);
      callback();
    }, delayMs);
    this.timers.set(key, timerId);
    return true;
  }
}
