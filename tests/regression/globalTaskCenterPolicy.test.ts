/**
 * @file globalTaskCenterPolicy.test.ts
 * @description global task center policy runtime 测试
 * @module tests/regression
 */
import { describe, expect, it } from 'vitest';
import { computeTaskDisposition, getEffectiveBucketLimit } from '../../src/platform/tasks/taskCenterPolicyRuntime';
import { GlobalTaskCenter } from '../../src/platform/tasks/globalTaskCenter';
import type { GlobalTaskDescriptor } from '../../src/shared/taskCenterTypes';
import { TASK_CENTER_MESSAGE } from '../../src/shared/taskCenterProtocol';

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

function handle(center: GlobalTaskCenter, message: any) {
  let response: any;
  center.handleMessage(message, {} as chrome.runtime.MessageSender, (value) => {
    response = value;
  });
  return response;
}

describe('global task center policy runtime', () => {
  it('computes bucket limits for visibility policies', () => {
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: true, policy: 'foreground_first' })).toBe(2);
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: false, policy: 'foreground_first' })).toBe(0);
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: false, policy: 'background_allowed' })).toBe(2);
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: false, policy: 'foreground_only' })).toBe(0);
  });

  it('classifies stale and active tasks by heartbeat', () => {
    const now = Date.now();

    expect(computeTaskDisposition({ status: 'leased', heartbeatTs: now - 121_000, timeoutMs: 10_000, now })).toBe('stale');
    expect(computeTaskDisposition({ status: 'running', heartbeatTs: now - 5_000, timeoutMs: 10_000, now })).toBe('active');
    expect(computeTaskDisposition({ status: 'queued', heartbeatTs: 0, timeoutMs: 10_000, now })).toBe('active');
  });

  it('routes page-lifecycle through handleMessage', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'lifecycle-task',
      label: 'listEnhancement:init',
      pageInstanceId: 'instance-x',
      dedupeKey: 'list:instance-x',
    }));

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: 'instance-x', reason: 'page-refresh-replaced' },
    });

    expect(response.ok).toBe(true);
    expect(response.canceled).toBe(1);
  });

  it('routes cancel-page-instance through the same handleMessage path', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(createDescriptor({
      taskId: 'cancel-alias',
      label: 'listEnhancement:init',
      pageInstanceId: 'instance-y',
      dedupeKey: 'list:instance-y',
    }));

    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.CANCEL_PAGE_INSTANCE,
      payload: { pageInstanceId: 'instance-y' },
    });

    expect(response).toEqual({ ok: true, canceled: 1 });
  });

  it('rejects blank pageInstanceId for page-lifecycle', () => {
    const center = new GlobalTaskCenter();
    const response = handle(center, {
      type: TASK_CENTER_MESSAGE.PAGE_LIFECYCLE,
      payload: { pageInstanceId: '', reason: 'page-refresh-replaced' },
    });
    expect(response).toEqual({ ok: false, error: 'missing-page-instance-id' });
  });
});