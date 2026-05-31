import type { InitPhase } from './types';
import { createDeferredRetryKey } from './schedulingRules';

type TimerHost = {
  setTimeout(callback: () => void, delayMs: number): number;
  clearTimeout(timerId: number): void;
};

function createDefaultTimerHost(): TimerHost {
  return {
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (timerId) => clearTimeout(timerId),
  };
}

export class OrchestratorRetryTimers {
  private readonly timers = new Map<string, number>();
  private readonly timerHost: TimerHost;

  constructor(timerHost: TimerHost = createDefaultTimerHost()) {
    this.timerHost = timerHost;
  }

  has(phase: InitPhase, label: string): boolean {
    return this.timers.has(createDeferredRetryKey(phase, label));
  }

  clear(phase: InitPhase, label: string): void {
    const key = createDeferredRetryKey(phase, label);
    const timerId = this.timers.get(key);
    if (typeof timerId === 'number') {
      this.timerHost.clearTimeout(timerId);
      this.timers.delete(key);
    }
  }

  clearAll(): void {
    for (const timerId of this.timers.values()) {
      this.timerHost.clearTimeout(timerId);
    }
    this.timers.clear();
  }

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
