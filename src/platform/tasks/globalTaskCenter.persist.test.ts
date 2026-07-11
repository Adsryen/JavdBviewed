/**
 * @file globalTaskCenter.persist.test.ts
 * @description 任务中心持久化 / 冷启动 restore 幂等单测
 * @module platform/tasks
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalTaskCenter } from './globalTaskCenter';
import type { GlobalTaskDescriptor } from '../../shared/taskCenterTypes';

type StorageMap = Record<string, unknown>;

function createChromeStorageMock(initial: StorageMap = {}) {
  const state: StorageMap = { ...initial };
  const setMock = vi.fn(async (items: StorageMap) => {
    Object.assign(state, items);
  });
  const getMock = vi.fn((keys: string | string[], cb: (result: StorageMap) => void) => {
    const list = Array.isArray(keys) ? keys : [keys];
    const result: StorageMap = {};
    for (const key of list) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        result[key] = state[key];
      }
    }
    cb(result);
  });
  const removeMock = vi.fn(async (keys: string | string[]) => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) delete state[key];
  });

  return {
    state,
    storage: {
      local: {
        get: getMock,
        set: setMock,
        remove: removeMock,
      },
    },
    runtime: { lastError: undefined as { message: string } | undefined },
  };
}

function createDescriptor(
  overrides: Partial<GlobalTaskDescriptor> & Pick<GlobalTaskDescriptor, 'taskId' | 'label'>,
): GlobalTaskDescriptor {
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

describe('GlobalTaskCenter persistence', () => {
  let chromeMock: ReturnType<typeof createChromeStorageMock>;

  beforeEach(() => {
    chromeMock = createChromeStorageMock();
    (globalThis as any).chrome = {
      storage: chromeMock.storage,
      runtime: chromeMock.runtime,
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as any).chrome;
  });

  it('registerTask immediately persists snapshot', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(
      createDescriptor({
        taskId: 't1',
        label: 'listEnhancement:init',
        dedupeKey: 'list:t1',
      }),
    );

    expect(chromeMock.storage.local.set).toHaveBeenCalled();
    const snapshot = chromeMock.state['taskCenter:snapshot'] as any;
    expect(snapshot?.tasks?.length).toBe(1);
    expect(snapshot.tasks[0].descriptor.taskId).toBe('t1');
    expect(chromeMock.state['taskCenter:dedupeIndex']).toEqual({ 'list:t1': 't1' });
  });

  it('restoreFromStorage reloads tasks and is idempotent under concurrent calls', async () => {
    chromeMock.state['taskCenter:snapshot'] = {
      tasks: [
        {
          descriptor: createDescriptor({
            taskId: 'restored-1',
            label: 'drive115:push',
            dedupeKey: 'push:1',
          }),
          runtime: {
            status: 'queued',
            retryCount: 0,
            pauseCount: 0,
            resumeCount: 0,
          },
        },
      ],
      completedLabels: ['listEnhancement:init'],
      savedAt: Date.now(),
    };
    chromeMock.state['taskCenter:dedupeIndex'] = { 'push:1': 'restored-1' };

    const center = new GlobalTaskCenter();
    const [a, b] = await Promise.all([
      center.restoreFromStorage(),
      center.restoreFromStorage(),
    ]);
    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
    expect(center.hasRestoredFromStorage()).toBe(true);

    // second wave after complete is no-op
    await center.restoreFromStorage();

    const state = center.queryState();
    expect(state.tasks.some((t) => t.taskId === 'restored-1')).toBe(true);
    expect(center.isTaskLabelCompleted('listEnhancement:init')).toBe(true);

    // get 只应在首次 restore 路径触发（并发合并）
    expect(chromeMock.storage.local.get.mock.calls.length).toBe(1);
  });

  it('flushPersist writes current memory state', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(
      createDescriptor({
        taskId: 'flush-1',
        label: 'listEnhancement:init',
        dedupeKey: 'flush:1',
      }),
    );
    chromeMock.storage.local.set.mockClear();

    center.flushPersist();
    expect(chromeMock.storage.local.set).toHaveBeenCalled();
    const snapshot = chromeMock.state['taskCenter:snapshot'] as any;
    expect(snapshot.tasks[0].descriptor.taskId).toBe('flush-1');
  });

  it('cancelTask persists canceled status', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(
      createDescriptor({
        taskId: 'c1',
        label: 'listEnhancement:init',
        dedupeKey: 'c:1',
      }),
    );
    chromeMock.storage.local.set.mockClear();
    center.cancelTask('c1', 'test-cancel');
    const snapshot = chromeMock.state['taskCenter:snapshot'] as any;
    expect(snapshot.tasks[0].runtime.status).toBe('canceled');
    expect(snapshot.tasks[0].runtime.waitReason).toBe('test-cancel');
  });

  it('restore prefers in-memory tasks registered during cold-start race', async () => {
    chromeMock.state['taskCenter:snapshot'] = {
      tasks: [
        {
          descriptor: createDescriptor({
            taskId: 'race-1',
            label: 'listEnhancement:init',
            dedupeKey: 'race:1',
          }),
          runtime: {
            status: 'queued',
            retryCount: 0,
            pauseCount: 0,
            resumeCount: 0,
          },
        },
      ],
      completedLabels: ['from-storage'],
      savedAt: Date.now(),
    };
    chromeMock.state['taskCenter:dedupeIndex'] = { 'race:1': 'race-1' };

    const center = new GlobalTaskCenter();
    // 模拟：storage.get 已取到快照，但回调前消息路径先写入内存
    chromeMock.storage.local.get = vi.fn((keys: string | string[], cb: (result: Record<string, unknown>) => void) => {
      const list = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};
      for (const key of list) {
        if (Object.prototype.hasOwnProperty.call(chromeMock.state, key)) {
          result[key] = chromeMock.state[key];
        }
      }
      // 深拷贝：避免后续 register 刷盘污染 restore 读到的快照
      const frozen = JSON.parse(JSON.stringify(result));
      center.registerTask(
        createDescriptor({
          taskId: 'race-1',
          label: 'listEnhancement:init',
          dedupeKey: 'race:1',
          phase: 'critical',
        }),
      );
      cb(frozen);
    });

    await center.restoreFromStorage();

    const state = center.queryState();
    const task = state.tasks.find((t) => t.taskId === 'race-1');
    expect(task).toBeTruthy();
    // 内存优先：register 写入 status=registered，不应被 storage queued 覆盖
    expect(task?.status).toBe('registered');
    expect(center.isTaskLabelCompleted('from-storage')).toBe(true);
  });

  it('persist writes empty dedupe index to clear stale mappings', () => {
    const center = new GlobalTaskCenter();
    center.registerTask(
      createDescriptor({
        taskId: 'd1',
        label: 'listEnhancement:init',
        dedupeKey: 'd:1',
      }),
    );
    expect(chromeMock.state['taskCenter:dedupeIndex']).toEqual({ 'd:1': 'd1' });
    // 清空内存后刷盘，应把 dedupeIndex 写成空对象（非保留陈旧映射）
    center.clearAll();
    // clearAll 走 remove；再 flush 空内存应写回 {}
    center.flushPersist();
    expect(chromeMock.state['taskCenter:dedupeIndex']).toEqual({});
  });

});
