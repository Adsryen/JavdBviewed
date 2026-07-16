import { describe, expect, it, vi } from 'vitest';
import type { ActorSubscription } from '../../types';
import { runManageSubscriptionsWorkflow } from './newWorksManageSubscriptionsWorkflow';

function subscription(actorId: string): ActorSubscription {
  return {
    actorId,
    actorName: `Actor ${actorId}`,
    subscribedAt: 1,
    enabled: true,
  };
}

function deps(overrides: Partial<Parameters<typeof runManageSubscriptionsWorkflow>[0]['deps']> = {}) {
  return {
    getSubscriptions: vi.fn(async () => [subscription('actor-1'), subscription('actor-2')]),
    openSubscriptionManagementModal: vi.fn(),
    showMessage: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works manage subscriptions workflow', () => {
  it('opens subscription management modal with existing subscriptions', async () => {
    const runtimeDeps = deps();

    await runManageSubscriptionsWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.getSubscriptions).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.openSubscriptionManagementModal).toHaveBeenCalledWith([
      subscription('actor-1'),
      subscription('actor-2'),
    ]);
    expect(runtimeDeps.showMessage).not.toHaveBeenCalled();
  });

  it('shows info message when no subscriptions exist', async () => {
    const runtimeDeps = deps({
      getSubscriptions: vi.fn(async () => []),
    });

    await runManageSubscriptionsWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.openSubscriptionManagementModal).not.toHaveBeenCalled();
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('暂无订阅演员', 'info');
  });

  it('reports subscription loading failures', async () => {
    const runtimeDeps = deps({
      getSubscriptions: vi.fn(async () => { throw new Error('load failed'); }),
    });

    await runManageSubscriptionsWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.openSubscriptionManagementModal).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('显示管理订阅弹窗失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('加载失败，请重试', 'error');
  });
});
