import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('content orchestrator managed tasks', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('registers a double-managed task only once', async () => {
    const sent: any[] = [];

    Object.defineProperty(globalThis, 'performance', {
      value: {
        now: (() => { let current = 0; return () => ++current; })(),
        mark() {},
        measure() {},
        getEntriesByName() { return [{ duration: 1 }]; },
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: { hardwareConcurrency: 8 },
      configurable: true,
    });

    Object.defineProperty(globalThis, 'window', {
      value: {
        location: { href: 'https://javdb.com/actors/zK98J', pathname: '/actors/zK98J' },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        addEventListener() {},
        requestIdleCallback(callback: () => void) {
          callback();
          return 1;
        },
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, 'document', {
      value: {
        hidden: false,
        addEventListener() {},
        removeEventListener() {},
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          lastError: null,
          sendMessage(message: any, callback?: (response: any) => void) {
            sent.push(message);
            if (message?.type === 'task-center:register') {
              const response = { ok: true, taskId: message.payload.taskId, tabId: 1 };
              callback?.(response);
              return Promise.resolve(response);
            }
            if (message?.type === 'task-center:request-lease') {
              const response = { granted: true };
              callback?.(response);
              return Promise.resolve(response);
            }
            const response = { ok: true, success: true };
            callback?.(response);
            return Promise.resolve(response);
          },
          onMessage: { addListener() {} },
        },
      },
      configurable: true,
    });

    const { initOrchestrator } = await import('../../src/content/initOrchestrator.ts');

    await initOrchestrator.add('idle', async () => {}, { label: 'contentFilter:initialize' });

    await initOrchestrator.run();

    const registerMessages = sent.filter((message) => message?.type === 'task-center:register');
    expect(registerMessages).toHaveLength(1);
    expect(registerMessages[0]?.payload?.label).toBe('contentFilter:initialize');
  });
});
