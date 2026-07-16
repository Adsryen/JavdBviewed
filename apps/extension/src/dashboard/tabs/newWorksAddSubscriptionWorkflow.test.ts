import { describe, expect, it, vi } from 'vitest';
import type { ActorRecord, ActorSubscription } from '../../types';
import { runAddSubscriptionWorkflow } from './newWorksAddSubscriptionWorkflow';

function actor(id: string): ActorRecord {
  return {
    id,
    name: `Actor ${id}`,
    aliases: [],
    gender: 'female',
    category: 'unknown',
    profileUrl: '',
    createdAt: 1,
    updatedAt: 1,
  };
}

function subscription(actorId: string): ActorSubscription {
  return {
    actorId,
    actorName: `Actor ${actorId}`,
    subscribedAt: 1,
    enabled: true,
  };
}

function deps(overrides: Partial<Parameters<typeof runAddSubscriptionWorkflow>[0]['deps']> = {}) {
  return {
    initialize: vi.fn(async () => undefined),
    getSubscriptions: vi.fn(async () => [subscription('actor-1'), subscription('actor-2')]),
    showActorSelector: vi.fn(),
    addSubscription: vi.fn(async () => undefined),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    logInfo: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works add subscription workflow', () => {
  it('initializes manager and opens actor selector with existing subscription ids', async () => {
    const runtimeDeps = deps();

    await runAddSubscriptionWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.initialize).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.getSubscriptions).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showActorSelector).toHaveBeenCalledWith(['actor-1', 'actor-2'], expect.any(Function));
  });

  it('adds selected actors, renders and shows success from selector callback', async () => {
    let onSelected: ((actors: ActorRecord[]) => Promise<void>) | undefined;
    const runtimeDeps = deps({
      showActorSelector: vi.fn((_ids, callback) => { onSelected = callback; }),
    });

    await runAddSubscriptionWorkflow({ deps: runtimeDeps });
    await onSelected?.([actor('actor-3'), actor('actor-4')]);

    expect(runtimeDeps.addSubscription).toHaveBeenNthCalledWith(1, 'actor-3');
    expect(runtimeDeps.addSubscription).toHaveBeenNthCalledWith(2, 'actor-4');
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('成功添加 2 个演员订阅', 'success');
  });

  it('reports add subscription failures from selector callback', async () => {
    let onSelected: ((actors: ActorRecord[]) => Promise<void>) | undefined;
    const runtimeDeps = deps({
      showActorSelector: vi.fn((_ids, callback) => { onSelected = callback; }),
      addSubscription: vi.fn(async () => { throw new Error('add failed'); }),
    });

    await runAddSubscriptionWorkflow({ deps: runtimeDeps });
    await onSelected?.([actor('actor-3')]);

    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('添加订阅失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('添加订阅失败，请重试: add failed', 'error');
  });

  it('reports loading failures before selector opens', async () => {
    const runtimeDeps = deps({
      getSubscriptions: vi.fn(async () => { throw new Error('load failed'); }),
    });

    await runAddSubscriptionWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.showActorSelector).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('显示添加订阅弹窗失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('加载失败，请重试: load failed', 'error');
  });
});
