import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createManagedTaskDescriptor } from '../../src/content/taskRuntime';
import {
  completeManagedTask,
  failManagedTask,
  progressManagedTask,
  registerManagedTask,
  requestTaskLease,
} from '../../src/platform/tasks/runtimeMessaging';
import { TASK_CENTER_MESSAGE } from '../../src/shared/taskCenterProtocol';
import type { GlobalTaskDescriptor } from '../../src/shared/taskCenterTypes';
import { getRuntimeMessages, resetChromeMock, setRuntimeMessageHandler } from '../setup/chrome';

function makeDescriptor(overrides: Partial<GlobalTaskDescriptor> = {}): GlobalTaskDescriptor {
  return {
    taskId: 'task-1',
    label: 'collect-video',
    tabId: 0,
    pageUrl: 'https://javdb.com/v/abc123',
    pageType: 'video',
    mainId: 'abc123',
    pageInstanceId: 'page-1',
    phase: 'collect',
    priority: 10,
    cost: 'medium',
    visibilityPolicy: 'foreground_first',
    timeoutMs: 1000,
    retryLimit: 3,
    resumePolicy: 'restart',
    createdAt: 1,
    ...overrides,
  };
}

describe('task runtime messaging', () => {
  beforeEach(() => {
    resetChromeMock();
    window.history.replaceState({}, '', 'https://javdb.com/v/abc123');
    vi.setSystemTime(new Date('2026-05-20T00:00:00Z'));
  });

  it('creates task descriptors from the current page context', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

    const descriptor = createManagedTaskDescriptor({
      label: 'collect-video',
      phase: 'collect',
      priority: 10,
      cost: 'medium',
      visibilityPolicy: 'foreground_first',
      timeoutMs: 1000,
      retryLimit: 3,
      resumePolicy: 'restart',
    });

    expect(descriptor).toMatchObject({
      label: 'collect-video',
      taskId: expect.stringMatching(/^collect-video:/),
      pageUrl: 'https://javdb.com/v/abc123',
      pageType: 'video',
      mainId: 'abc123',
      registrationSource: 'runtime',
      dedupeKey: expect.stringMatching(/^collect-video:page:/),
    });
  });

  it('registers a managed task and applies background task id and tab id', async () => {
    setRuntimeMessageHandler((message) => {
      expect(message.type).toBe(TASK_CENTER_MESSAGE.REGISTER);
      return { taskId: 'registered-task', tabId: 77 };
    });

    await expect(registerManagedTask(makeDescriptor())).resolves.toMatchObject({
      taskId: 'registered-task',
      tabId: 77,
    });
    expect(getRuntimeMessages()[0]).toMatchObject({
      type: TASK_CENTER_MESSAGE.REGISTER,
      payload: { taskId: 'task-1' },
    });
  });

  it('sends lease, progress, completion, and failure messages with the protocol constants', async () => {
    setRuntimeMessageHandler((message) => {
      if (message.type === TASK_CENTER_MESSAGE.REQUEST_LEASE) {
        return { granted: true };
      }
      return { ok: true };
    });

    await expect(requestTaskLease('task-1')).resolves.toEqual({ granted: true });
    await progressManagedTask('task-1', { stage: 'fetch', progressPct: 50, detail: 'half' });
    await completeManagedTask('task-1');
    await failManagedTask('task-2', 'boom');

    expect(getRuntimeMessages()).toEqual([
      { type: TASK_CENTER_MESSAGE.REQUEST_LEASE, payload: { taskId: 'task-1' } },
      {
        type: TASK_CENTER_MESSAGE.PROGRESS,
        payload: { taskId: 'task-1', stage: 'fetch', progressPct: 50, detail: 'half' },
      },
      { type: TASK_CENTER_MESSAGE.COMPLETE, payload: { taskId: 'task-1' } },
      { type: TASK_CENTER_MESSAGE.FAIL, payload: { taskId: 'task-2', error: 'boom' } },
    ]);
  });
});
