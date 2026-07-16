import { describe, expect, it, vi } from 'vitest';
import { OrchestratorRetryTimers } from './retryTimers';

function createTimerHost() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();

  return {
    host: {
      setTimeout: vi.fn((callback: () => void) => {
        const id = nextId++;
        callbacks.set(id, callback);
        return id;
      }),
      clearTimeout: vi.fn((id: number) => {
        callbacks.delete(id);
      }),
    },
    fire(id: number) {
      callbacks.get(id)?.();
    },
    has(id: number) {
      return callbacks.has(id);
    },
  };
}

describe('OrchestratorRetryTimers', () => {
  it('schedules a retry timer and clears it after firing', () => {
    const timerHost = createTimerHost();
    const timers = new OrchestratorRetryTimers(timerHost.host);
    const callback = vi.fn();

    expect(timers.schedule('idle', 'preview:init', 400, callback)).toBe(true);
    expect(timers.has('idle', 'preview:init')).toBe(true);

    timerHost.fire(1);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(timers.has('idle', 'preview:init')).toBe(false);
  });

  it('deduplicates pending timers for the same task key', () => {
    const timerHost = createTimerHost();
    const timers = new OrchestratorRetryTimers(timerHost.host);

    expect(timers.schedule('deferred', 'magnet:search', 400, vi.fn())).toBe(true);
    expect(timers.schedule('deferred', 'magnet:search', 400, vi.fn())).toBe(false);
    expect(timerHost.host.setTimeout).toHaveBeenCalledTimes(1);
  });

  it('clears a pending timer by phase and label', () => {
    const timerHost = createTimerHost();
    const timers = new OrchestratorRetryTimers(timerHost.host);

    timers.schedule('high', 'status:init', 400, vi.fn());
    timers.clear('high', 'status:init');

    expect(timerHost.host.clearTimeout).toHaveBeenCalledWith(1);
    expect(timerHost.has(1)).toBe(false);
    expect(timers.has('high', 'status:init')).toBe(false);
  });

  it('clears all pending timers', () => {
    const timerHost = createTimerHost();
    const timers = new OrchestratorRetryTimers(timerHost.host);

    timers.schedule('high', 'status:init', 400, vi.fn());
    timers.schedule('idle', 'preview:init', 400, vi.fn());
    timers.clearAll();

    expect(timerHost.host.clearTimeout).toHaveBeenCalledWith(1);
    expect(timerHost.host.clearTimeout).toHaveBeenCalledWith(2);
    expect(timers.has('high', 'status:init')).toBe(false);
    expect(timers.has('idle', 'preview:init')).toBe(false);
  });
});
