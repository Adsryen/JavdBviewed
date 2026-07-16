/**
 * @file taskScheduler.test.ts
 * @description GlobalTaskCenter scheduling 测试
 * @module tests/tests
 */
import { afterAll, describe, expect, it, vi } from 'vitest';

import type { GlobalTaskDescriptor } from '../apps/extension/src/shared/taskCenterTypes.ts';
import { GlobalTaskCenter } from '../apps/extension/src/platform/tasks/globalTaskCenter.ts';
import { TASK_CENTER_MESSAGE } from '../apps/extension/src/shared/taskCenterProtocol.ts';

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
  storage: {
    local: {
      get: (_keys: any, callback?: (result: any) => void) => {
        if (typeof callback === 'function') callback({});
        return Promise.resolve({});
      },
      set: async () => undefined,
      remove: async () => undefined,
    },
  },
};

const orchestratorModulePromise = import('../apps/extension/src/apps/content/orchestrator/initOrchestrator.ts');

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
    executionClass: overrides.executionClass,
    shareScope: overrides.shareScope,
    createdAt: overrides.createdAt ?? now,
  };
}

function handle(center: GlobalTaskCenter, message: any, sender: chrome.runtime.MessageSender = {} as chrome.runtime.MessageSender) {
  let response: any;
  center.handleMessage(message, sender, (value) => {
    response = value;
  });
  return response;
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

  it('does not cancel a hidden queued task that is still waiting for foreground visibility', () => {
    const center = new GlobalTaskCenter();
    const startedAt = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);

    try {
      center.updateVisibility(1, false);
      center.registerTask(createDescriptor({
        taskId: 'hidden-pending-90s',
        label: 'videoEnhancement:runTitle',
        visibilityPolicy: 'foreground_only',
      }));

      const lease = center.requestLease('hidden-pending-90s');
      expect(lease.granted).toBe(false);
      expect(lease.waitReason).toBe('tab-hidden');

      vi.setSystemTime(startedAt + 90_000);
      const task = center.queryState().tasks.find((item: any) => item.taskId === 'hidden-pending-90s');

      expect(task?.status).toBe('queued');
      expect(task?.waitReason).toBe('tab-hidden');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not apply the hidden running timeout to background_allowed tasks', () => {
    const center = new GlobalTaskCenter();
    const startedAt = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);

    try {
      center.updateVisibility(1, false);
      center.registerTask(createDescriptor({
        taskId: 'hidden-background-running',
        label: 'videoEnhancement:runTitle',
        visibilityPolicy: 'background_allowed',
      }));

      expect(center.requestLease('hidden-background-running').granted).toBe(true);
      center.heartbeatTask('hidden-background-running');

      vi.setSystemTime(startedAt + 46_000);
      const task = center.queryState().tasks.find((item: any) => item.taskId === 'hidden-background-running');

      expect(task?.status).toBe('running');
      expect(task?.waitReason).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('requeues retryable failures and can complete on a later lease', () => {
    const center = new GlobalTaskCenter();
    center.updateVisibility(1, true);
    center.registerTask(createDescriptor({
      taskId: 'retry-then-success',
      label: 'videoEnhancement:runTitle',
      retryLimit: 2,
    }));

    expect(center.requestLease('retry-then-success').granted).toBe(true);
    const firstFail = center.failTask('retry-then-success', 'network-1');
    expect(firstFail).toMatchObject({
      ok: true,
      retryable: true,
      retryCount: 1,
      retryLimit: 2,
      status: 'queued',
      waitReason: 'retryable-error',
    });

    expect(center.requestLease('retry-then-success').granted).toBe(true);
    const secondFail = center.failTask('retry-then-success', 'network-2');
    expect(secondFail).toMatchObject({
      retryable: true,
      retryCount: 2,
      retryLimit: 2,
      status: 'queued',
      waitReason: 'retryable-error',
    });

    expect(center.requestLease('retry-then-success').granted).toBe(true);
    center.completeTask('retry-then-success');

    const task = center.queryState().tasks.find((item: any) => item.taskId === 'retry-then-success');
    expect(task?.status).toBe('done');
    expect(task?.retryCount).toBe(2);
  });

  it('marks failed tasks as terminal error after retryLimit is exhausted', () => {
    const center = new GlobalTaskCenter();
    center.updateVisibility(1, true);
    center.registerTask(createDescriptor({
      taskId: 'retry-exhausted',
      label: 'videoEnhancement:runTitle',
      retryLimit: 2,
    }));

    expect(center.requestLease('retry-exhausted').granted).toBe(true);
    expect(center.failTask('retry-exhausted', 'network-1').retryable).toBe(true);
    expect(center.requestLease('retry-exhausted').granted).toBe(true);
    expect(center.failTask('retry-exhausted', 'network-2').retryable).toBe(true);
    expect(center.requestLease('retry-exhausted').granted).toBe(true);

    const exhausted = center.failTask('retry-exhausted', 'network-3');
    expect(exhausted).toMatchObject({
      ok: true,
      retryable: false,
      retryCount: 3,
      retryLimit: 2,
      status: 'error',
      waitReason: 'retry-limit-exhausted',
    });

    const task = center.queryState().tasks.find((item: any) => item.taskId === 'retry-exhausted');
    expect(task?.status).toBe('error');
    expect(task?.waitReason).toBe('retry-limit-exhausted');
    expect(task?.detail).toBe('network-3');
  });

  it('does not orphan-clean a queued task waiting for retry', () => {
    const center = new GlobalTaskCenter();
    const startedAt = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);

    try {
      center.registerTask(createDescriptor({
        taskId: 'retry-pending-90s',
        label: 'videoEnhancement:runTitle',
        retryLimit: 2,
      }));
      const fail = center.failTask('retry-pending-90s', 'temporary-api-error');
      expect(fail.retryable).toBe(true);

      vi.setSystemTime(startedAt + 90_000);
      const task = center.queryState().tasks.find((item: any) => item.taskId === 'retry-pending-90s');

      expect(task?.status).toBe('queued');
      expect(task?.waitReason).toBe('retryable-error');
      expect(task?.retryCount).toBe(1);
    } finally {
      vi.useRealTimers();
    }
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
      storage: {
        local: {
          get: (_keys: any, callback?: (result: any) => void) => {
            if (typeof callback === 'function') callback({});
            return Promise.resolve({});
          },
          set: async () => undefined,
          remove: async () => undefined,
        },
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

describe('GlobalTaskCenter page-lifecycle (P0-1)', () => {
  it('handleMessage page-lifecycle cancels only matching pageInstance tasks', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'page-a-task',
      label: 'videoEnhancement:runTitle',
      pageInstanceId: 'page-a',
      dedupeKey: 'runTitle:page-a',
    }));
    center.registerTask(createDescriptor({
      taskId: 'page-b-task',
      label: 'videoEnhancement:runTitle',
      pageInstanceId: 'page-b',
      dedupeKey: 'runTitle:page-b',
    }));

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'page-a', reason: 'page-refresh-replaced' },
    });

    expect(response).toEqual({ ok: true, canceled: 1 });
    const state = center.queryState();
    const pageA = state.tasks.find((task: any) => task.taskId === 'page-a-task');
    const pageB = state.tasks.find((task: any) => task.taskId === 'page-b-task');
    expect(pageA?.status).toBe('canceled');
    expect(pageA?.waitReason).toBe('page-refresh-replaced');
    expect(pageB?.status).toBe('registered');
  });

  it('cancels all non-terminal tasks under the same pageInstance', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'a1',
      label: 'videoEnhancement:runTitle',
      pageInstanceId: 'page-a',
      dedupeKey: 'a1',
    }));
    center.registerTask(createDescriptor({
      taskId: 'a2',
      label: 'videoEnhancement:runCover',
      pageInstanceId: 'page-a',
      dedupeKey: 'a2',
    }));
    center.registerTask(createDescriptor({
      taskId: 'a3-done',
      label: 'videoEnhancement:finish',
      pageInstanceId: 'page-a',
      dedupeKey: 'a3',
    }));
    center.completeTask('a3-done');

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'page-a', reason: 'page-refresh-replaced' },
    });

    expect(response).toEqual({ ok: true, canceled: 2 });
    const state = center.queryState();
    expect(state.tasks.find((t: any) => t.taskId === 'a1')?.status).toBe('canceled');
    expect(state.tasks.find((t: any) => t.taskId === 'a2')?.status).toBe('canceled');
    expect(state.tasks.find((t: any) => t.taskId === 'a3-done')?.status).toBe('done');
  });

  it('does not cancel shared dedupe-by-action tasks owned by other page instances', () => {
    const center = new GlobalTaskCenter();
    const sharedKey = 'drive115:push:ABC-123:magnet:xyz';

    center.registerTask(createDescriptor({
      taskId: 'push-owner',
      label: 'drive115:push',
      pageInstanceId: 'page-owner',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
      executionClass: 'on-demand',
    }));
    center.updateVisibility(1, true);
    center.requestLease('push-owner');

    center.registerTask(createDescriptor({
      taskId: 'local-task',
      label: 'videoEnhancement:runTitle',
      pageInstanceId: 'page-other',
      dedupeKey: 'runTitle:page-other',
    }));

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'page-other', reason: 'page-refresh-replaced' },
    });

    expect(response).toEqual({ ok: true, canceled: 1 });
    const state = center.queryState();
    expect(state.tasks.find((t: any) => t.taskId === 'local-task')?.status).toBe('canceled');
    expect(['registered', 'queued', 'leased', 'running']).toContain(
      state.tasks.find((t: any) => t.taskId === 'push-owner')?.status,
    );
  });

  it('cancels shared tasks when the owning pageInstance itself is closed', () => {
    const center = new GlobalTaskCenter();
    const sharedKey = 'drive115:push:ABC-123:magnet:owner-close';

    center.registerTask(createDescriptor({
      taskId: 'push-owner',
      label: 'drive115:push',
      pageInstanceId: 'page-owner',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
    }));
    center.updateVisibility(1, true);
    center.requestLease('push-owner');

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'page-owner', reason: 'page-refresh-replaced' },
    });

    expect(response).toEqual({ ok: true, canceled: 1 });
    expect(center.queryState().tasks.find((t: any) => t.taskId === 'push-owner')?.status).toBe('canceled');
  });

  it('cancel-page-instance is an alias of page-lifecycle', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'alias-task',
      label: 'listEnhancement:init',
      pageInstanceId: 'page-x',
      dedupeKey: 'list:page-x',
    }));

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.CANCEL_PAGE_INSTANCE,
      payload: { pageInstanceId: 'page-x', reason: 'page-closed-by-user' },
    });

    expect(response).toEqual({ ok: true, canceled: 1 });
    expect(center.queryState().tasks.find((t: any) => t.taskId === 'alias-task')?.waitReason).toBe('page-closed-by-user');
  });

  it('rejects page-lifecycle without pageInstanceId', () => {
    const center = new GlobalTaskCenter();
    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { reason: 'page-refresh-replaced' },
    });
    expect(response).toEqual({ ok: false, error: 'missing-page-instance-id' });
  });

  it('is a no-op when pageInstance has no active tasks', () => {
    const center = new GlobalTaskCenter();
    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'ghost', reason: 'page-refresh-replaced' },
    });
    expect(response).toEqual({ ok: true, canceled: 0 });
  });

  it('leaves already terminal tasks untouched', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'done-task',
      label: 'videoEnhancement:runTitle',
      pageInstanceId: 'page-term',
      dedupeKey: 'done-key',
    }));
    center.completeTask('done-task');
    center.registerTask(createDescriptor({
      taskId: 'error-task',
      label: 'videoEnhancement:runCover',
      pageInstanceId: 'page-term',
      dedupeKey: 'error-key',
      retryLimit: 0,
    }));
    center.failTask('error-task', 'boom');
    center.registerTask(createDescriptor({
      taskId: 'canceled-task',
      label: 'videoEnhancement:runFC2Breaker',
      pageInstanceId: 'page-term',
      dedupeKey: 'canceled-key',
    }));
    center.cancelTask('canceled-task', 'manual');

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'page-term', reason: 'page-refresh-replaced' },
    });

    expect(response).toEqual({ ok: true, canceled: 0 });
    const state = center.queryState();
    expect(state.tasks.find((t: any) => t.taskId === 'done-task')?.status).toBe('done');
    expect(state.tasks.find((t: any) => t.taskId === 'error-task')?.status).toBe('error');
    expect(state.tasks.find((t: any) => t.taskId === 'canceled-task')?.status).toBe('canceled');
  });
});

describe('GlobalTaskCenter shareScope / dedupe (P0-3/4/5)', () => {
  it('reuses terminal done for dedupe-by-action and force key creates a new execution', () => {
    const center = new GlobalTaskCenter();
    const sharedKey = 'drive115:push:ABC-123:magnet:xyz';

    const first = center.registerTask(createDescriptor({
      taskId: 'push-1',
      label: 'drive115:push',
      pageInstanceId: 'page-1',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
      executionClass: 'on-demand',
    }));
    expect(first.reused).toBe(false);
    center.completeTask('push-1');

    const second = center.registerTask(createDescriptor({
      taskId: 'push-2',
      label: 'drive115:push',
      pageInstanceId: 'page-2',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
      executionClass: 'on-demand',
    }));
    expect(second.reused).toBe(true);
    expect(second.taskId).toBe('push-1');
    expect(second.status).toBe('done');

    const force = center.registerTask(createDescriptor({
      taskId: 'push-3',
      label: 'drive115:push',
      pageInstanceId: 'page-2',
      dedupeKey: `${sharedKey}:force:1`,
      shareScope: 'dedupe-by-action',
      executionClass: 'on-demand',
    }));
    expect(force.reused).toBe(false);
    expect(force.taskId).toBe('push-3');

    const state = center.queryState();
    expect(state.tasks.find((task: any) => task.taskId === 'push-1')?.executionClass).toBe('on-demand');
    expect(state.tasks.find((task: any) => task.taskId === 'push-1')?.shareScope).toBe('dedupe-by-action');
  });

  it('reuses terminal error for dedupe-by-action without re-registering', () => {
    const center = new GlobalTaskCenter();
    const sharedKey = 'drive115:push:ABC-123:magnet:err';

    center.registerTask(createDescriptor({
      taskId: 'push-err-1',
      label: 'drive115:push',
      pageInstanceId: 'page-1',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
      retryLimit: 0,
    }));
    center.failTask('push-err-1', 'api-failed');

    const second = center.registerTask(createDescriptor({
      taskId: 'push-err-2',
      label: 'drive115:push',
      pageInstanceId: 'page-2',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
    }));

    expect(second.reused).toBe(true);
    expect(second.taskId).toBe('push-err-1');
    expect(second.status).toBe('error');
  });

  it('reuses in-flight dedupe-by-action tasks across pages', () => {
    const center = new GlobalTaskCenter();
    const sharedKey = 'drive115:push:ABC-123:magnet:run';

    center.registerTask(createDescriptor({
      taskId: 'push-run-1',
      label: 'drive115:push',
      pageInstanceId: 'page-1',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
    }));
    center.updateVisibility(1, true);
    const lease = center.requestLease('push-run-1');
    expect(lease.granted).toBe(true);

    const second = center.registerTask(createDescriptor({
      taskId: 'push-run-2',
      label: 'drive115:push',
      pageInstanceId: 'page-2',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
    }));

    expect(second.reused).toBe(true);
    expect(second.taskId).toBe('push-run-1');
    expect(['leased', 'running', 'queued', 'registered']).toContain(second.status);
  });

  it('allows re-register after canceled even for dedupe-by-action', () => {
    const center = new GlobalTaskCenter();
    const sharedKey = 'drive115:push:ABC-123:magnet:cancel';

    center.registerTask(createDescriptor({
      taskId: 'push-c1',
      label: 'drive115:push',
      pageInstanceId: 'page-1',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
    }));
    center.cancelTask('push-c1', 'page-refresh-replaced');

    const next = center.registerTask(createDescriptor({
      taskId: 'push-c2',
      label: 'drive115:push',
      pageInstanceId: 'page-2',
      dedupeKey: sharedKey,
      shareScope: 'dedupe-by-action',
    }));

    expect(next.reused).toBe(false);
    expect(next.taskId).toBe('push-c2');
    expect(next.status).toBe('registered');
  });

  it('does not merge different magnets under the same video', () => {
    const center = new GlobalTaskCenter();
    const first = center.registerTask(createDescriptor({
      taskId: 'push-m1',
      label: 'drive115:push',
      dedupeKey: 'drive115:push:ABC:magnet-a',
      shareScope: 'dedupe-by-action',
    }));
    const second = center.registerTask(createDescriptor({
      taskId: 'push-m2',
      label: 'drive115:push',
      dedupeKey: 'drive115:push:ABC:magnet-b',
      shareScope: 'dedupe-by-action',
    }));
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(false);
    expect(second.taskId).toBe('push-m2');
  });

  it('keeps default terminal dedupe behavior when shareScope is absent (done/error/canceled)', () => {
    const center = new GlobalTaskCenter();
    const key = 'videoEnhancement:runTitle:page-1';

    center.registerTask(createDescriptor({
      taskId: 'title-1',
      label: 'videoEnhancement:runTitle',
      dedupeKey: key,
    }));
    center.completeTask('title-1');
    const afterDone = center.registerTask(createDescriptor({
      taskId: 'title-2',
      label: 'videoEnhancement:runTitle',
      dedupeKey: key,
      retryLimit: 0,
    }));
    expect(afterDone.reused).toBe(false);
    expect(afterDone.taskId).toBe('title-2');

    center.failTask('title-2', 'boom');
    const afterError = center.registerTask(createDescriptor({
      taskId: 'title-3',
      label: 'videoEnhancement:runTitle',
      dedupeKey: key,
    }));
    expect(afterError.reused).toBe(false);
    expect(afterError.taskId).toBe('title-3');

    center.cancelTask('title-3', 'manual');
    const afterCancel = center.registerTask(createDescriptor({
      taskId: 'title-4',
      label: 'videoEnhancement:runTitle',
      dedupeKey: key,
    }));
    expect(afterCancel.reused).toBe(false);
    expect(afterCancel.taskId).toBe('title-4');
  });

  it('still reuses in-flight non-shareScope tasks with same dedupeKey', () => {
    const center = new GlobalTaskCenter();
    const key = 'videoEnhancement:runTitle:page-1';
    center.registerTask(createDescriptor({
      taskId: 'title-live-1',
      label: 'videoEnhancement:runTitle',
      dedupeKey: key,
    }));
    const second = center.registerTask(createDescriptor({
      taskId: 'title-live-2',
      label: 'videoEnhancement:runTitle',
      dedupeKey: key,
    }));
    expect(second.reused).toBe(true);
    expect(second.taskId).toBe('title-live-1');
  });

  it('reuses exact same taskId without creating a second record', () => {
    const center = new GlobalTaskCenter();
    const first = center.registerTask(createDescriptor({
      taskId: 'same-id',
      label: 'videoEnhancement:runTitle',
      dedupeKey: 'same-id-key',
    }));
    const second = center.registerTask(createDescriptor({
      taskId: 'same-id',
      label: 'videoEnhancement:runTitle',
      dedupeKey: 'same-id-key',
    }));
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(true);
    expect(second.taskId).toBe('same-id');
    expect(center.queryState().tasks.filter((t: any) => t.taskId === 'same-id')).toHaveLength(1);
  });

  it('queryState exposes optional executionClass and shareScope only when set', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'meta-1',
      label: 'privacy:init',
      dedupeKey: 'privacy:page-1',
      executionClass: 'system-only',
      shareScope: 'per-page',
    }));
    center.registerTask(createDescriptor({
      taskId: 'meta-2',
      label: 'videoEnhancement:runTitle',
      dedupeKey: 'title:page-1',
    }));

    const state = center.queryState();
    const withMeta = state.tasks.find((t: any) => t.taskId === 'meta-1');
    const withoutMeta = state.tasks.find((t: any) => t.taskId === 'meta-2');
    expect(withMeta?.executionClass).toBe('system-only');
    expect(withMeta?.shareScope).toBe('per-page');
    expect(withoutMeta?.executionClass).toBeUndefined();
    expect(withoutMeta?.shareScope).toBeUndefined();
  });

  it('falls back to label:pageUrl dedupeKey when omitted', () => {
    const center = new GlobalTaskCenter();
    const first = center.registerTask(createDescriptor({
      taskId: 'fallback-1',
      label: 'videoEnhancement:runTitle',
      pageUrl: '/v/same',
    }));
    const second = center.registerTask(createDescriptor({
      taskId: 'fallback-2',
      label: 'videoEnhancement:runTitle',
      pageUrl: '/v/same',
    }));
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(true);
    expect(second.taskId).toBe('fallback-1');
  });
});


describe('GlobalTaskCenter multi pageInstance pressure (P2 R3)', () => {
  it('registers many pageInstances without exceeding translate bucket concurrency', () => {
    const center = new GlobalTaskCenter();
    const pageCount = 25;
    for (let i = 0; i < pageCount; i += 1) {
      center.registerTask(createDescriptor({
        taskId: `tr-${i}`,
        label: 'videoEnhancement:translateCurrentTitle:request',
        tabId: 100 + i,
        pageInstanceId: `page-${i}`,
        pageUrl: `/v/code-${i}`,
        dedupeKey: `translate:page-${i}`,
        phase: 'deferred',
        priority: 3,
      }));
      center.registerTask(createDescriptor({
        taskId: `list-${i}`,
        label: 'listEnhancement:init',
        tabId: 100 + i,
        pageInstanceId: `page-${i}`,
        pageUrl: `/lists/${i}`,
        dedupeKey: `list:page-${i}`,
        phase: 'high',
        priority: 8,
      }));
    }

    const state = center.queryState();
    expect(state.tasks.length).toBeGreaterThanOrEqual(pageCount * 2);

    // 申请 lease：translate 桶 limit=1，不应同时 grant 多个 translate request
    let translateGranted = 0;
    for (let i = 0; i < pageCount; i += 1) {
      const lease = center.requestLease(`tr-${i}`);
      if (lease?.granted) translateGranted += 1;
    }
    expect(translateGranted).toBeLessThanOrEqual(1);

    // 高优先级列表任务仍可在各自 bucket 下获得进展（不要求全部 grant，但不为零）
    let listGranted = 0;
    for (let i = 0; i < pageCount; i += 1) {
      const lease = center.requestLease(`list-${i}`);
      if (lease?.granted) listGranted += 1;
    }
    expect(listGranted).toBeGreaterThan(0);
  });

  it('mark/check completed labels support cross-page dependency signals', () => {
    const center = new GlobalTaskCenter();
    expect(center.isTaskLabelCompleted('videoEnhancement:loadData')).toBe(false);
    center.markTaskLabelCompleted('videoEnhancement:loadData');
    expect(center.isTaskLabelCompleted('videoEnhancement:loadData')).toBe(true);
  });
});
