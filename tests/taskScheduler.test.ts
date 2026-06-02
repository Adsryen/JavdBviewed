import { afterAll, describe, expect, it, vi } from 'vitest';

import type { GlobalTaskDescriptor } from '../src/shared/taskCenterTypes.ts';
import { GlobalTaskCenter } from '../src/platform/tasks/globalTaskCenter.ts';

const originalWindow = (globalThis as any).window;
const originalDocument = (globalThis as any).document;
const originalChrome = (globalThis as any).chrome;

(globalThis as any).window = {
  location: { href: 'https://example.com/v/test', pathname: '/v/test' },
  setTimeout,
  clearTimeout,
  setInterval: () => 1,
  clearInterval: () => undefined,
  addEventListener: () => undefined,
};
(globalThis as any).document = {
  visibilityState: 'visible',
  hidden: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
};
(globalThis as any).chrome = {
  runtime: {
    sendMessage: async () => ({ ok: true }),
    onMessage: { addListener: () => undefined },
  },
};

const orchestratorModulePromise = import('../src/apps/content/orchestrator/initOrchestrator.ts');

afterAll(() => {
  (globalThis as any).window = originalWindow;
  (globalThis as any).document = originalDocument;
  (globalThis as any).chrome = originalChrome;
});

function createDescriptor(overrides: Partial<GlobalTaskDescriptor> & Pick<GlobalTaskDescriptor, 'taskId' | 'label'>): GlobalTaskDescriptor {
  const now = Date.now();
  return {
    taskId: overrides.taskId,
    label: overrides.label,
    tabId: overrides.tabId ?? 1,
    pageUrl: overrides.pageUrl ?? '/v/test',
    pageType: overrides.pageType ?? 'video',
    mainId: overrides.mainId ?? 'test',
    pageInstanceId: overrides.pageInstanceId ?? 'page-1',
    phase: overrides.phase ?? 'idle',
    priority: overrides.priority ?? 5,
    cost: overrides.cost ?? 'light',
    visibilityPolicy: overrides.visibilityPolicy ?? 'background_allowed',
    timeoutMs: overrides.timeoutMs ?? 10_000,
    retryLimit: overrides.retryLimit ?? 2,
    dedupeKey: overrides.dedupeKey,
    resumePolicy: overrides.resumePolicy ?? 'restart',
    createdAt: overrides.createdAt ?? now,
  };
}

describe('GlobalTaskCenter scheduling', () => {
  it('requestLease ignores preregistered tasks that have not queued yet', () => {
    const center = new GlobalTaskCenter();
    center.updateVisibility(1, true);

    center.registerTask(createDescriptor({
      taskId: 'registered-a',
      label: 'videoEnhancement:runTitle',
      priority: 9,
      createdAt: Date.now() - 5_000,
    }));

    center.registerTask(createDescriptor({
      taskId: 'ready-b',
      label: 'videoEnhancement:runFC2Breaker',
      priority: 5,
      createdAt: Date.now(),
    }));

    const lease = center.requestLease('ready-b');

    expect(lease.granted).toBe(true);
  });

  it('requestLease still respects queued higher-priority peers', () => {
    const center = new GlobalTaskCenter();
    center.updateVisibility(1, true);

    center.registerTask(createDescriptor({
      taskId: 'queued-a',
      label: 'videoEnhancement:runTitle',
      priority: 9,
    }));
    center.registerTask(createDescriptor({
      taskId: 'ready-b',
      label: 'videoEnhancement:runFC2Breaker',
      priority: 5,
    }));

    const firstAttempt = center.requestLease('queued-a');
    expect(firstAttempt.granted).toBe(true);
    center.pauseTask('queued-a', 'test-release');
    center.resumeTask('queued-a');

    const competing = center.requestLease('ready-b');

    expect(competing.granted).toBe(false);
    expect(competing.waitReason).toBe('higher-priority-wait');
  });

  it('dependency retries do not leak deferred concurrency slots', async () => {
    const sentMessages: Array<{ type: string; payload?: any }> = [];

    const previousChrome = (globalThis as any).chrome;

    vi.useFakeTimers();
    (globalThis as any).chrome = {
      runtime: {
        sendMessage: async (message: { type: string; payload?: any }) => {
          sentMessages.push(message);
          if (message.type === 'task-center:register') {
            return { taskId: message.payload.taskId, tabId: 1 };
          }
          if (message.type === 'task-center:request-lease') {
            return { granted: true };
          }
          return { ok: true };
        },
        onMessage: { addListener: () => undefined },
      },
    };

    try {
      const mod = await orchestratorModulePromise;
      const orchestrator: any = mod.initOrchestrator;

      orchestrator['completedTasks'].clear();
      orchestrator['retryTimers'].clearAll();
      orchestrator['runningDeferred'] = 0;

      orchestrator['scheduleTask']('deferred', {
        task: async () => undefined,
        options: { label: 'dep-task', dependsOn: ['ready-dep'] },
      });

      await vi.runAllTicks();
      await vi.advanceTimersByTimeAsync(250);
      expect(orchestrator['runningDeferred']).toBe(0);
      expect(sentMessages.some((message) => message.type === 'task-center:request-lease')).toBe(false);

      orchestrator['completedTasks'].add('ready-dep');
      await vi.advanceTimersByTimeAsync(250);
      await vi.runAllTicks();

      expect(orchestrator['runningDeferred']).toBe(0);
      expect(sentMessages.some((message) => message.type === 'task-center:request-lease')).toBe(true);
    } finally {
      vi.useRealTimers();
      (globalThis as any).chrome = previousChrome;
    }
  }, 20_000);
});
