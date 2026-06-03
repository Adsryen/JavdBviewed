import { describe, expect, it, vi } from 'vitest';
import { createNewWorksSubscriptionActionsRuntime } from '../../src/dashboard/tabs/newWorksSubscriptionActionsRuntime';
import type { ActorRecord, ActorSubscription } from '../../src/types';

describe('new works subscription actions runtime', () => {
  it('opens actor selector with subscribed ids and adds selected actors', async () => {
    let onSelected!: (actors: ActorRecord[]) => Promise<void>;
    const addSubscription = vi.fn(async () => undefined);
    const render = vi.fn(async () => undefined);
    const runtime = createNewWorksSubscriptionActionsRuntime({
      initialize: vi.fn(async () => undefined),
      getSubscriptions: vi.fn(async () => [
        { actorId: 'actor-1', actorName: 'A', enabled: true } as ActorSubscription,
      ]),
      showActorSelector: vi.fn((_ids, callback) => {
        onSelected = callback;
      }),
      addSubscription,
      getGlobalSubscriptionsForModal: vi.fn(),
      openSubscriptionManagementModal: vi.fn(),
      toggleSubscription: vi.fn(),
      removeSubscription: vi.fn(),
      confirmRemove: vi.fn(),
      sendSingleActorCheck: vi.fn(),
      render,
      showMessage: vi.fn(),
      logInfo: vi.fn(),
      logError: vi.fn(),
    });

    await runtime.showAddSubscriptionModal();
    await onSelected([{ id: 'actor-2', name: 'B' } as ActorRecord]);

    expect(addSubscription).toHaveBeenCalledWith('actor-2');
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('opens subscription management modal with loaded subscriptions', async () => {
    const subscriptions = [
      { actorId: 'actor-1', actorName: 'A', enabled: true } as ActorSubscription,
    ];
    const openSubscriptionManagementModal = vi.fn();
    const runtime = createNewWorksSubscriptionActionsRuntime({
      initialize: vi.fn(),
      getSubscriptions: vi.fn(async () => subscriptions),
      showActorSelector: vi.fn(),
      addSubscription: vi.fn(),
      getGlobalSubscriptionsForModal: vi.fn(async () => subscriptions),
      openSubscriptionManagementModal,
      toggleSubscription: vi.fn(),
      removeSubscription: vi.fn(),
      confirmRemove: vi.fn(),
      sendSingleActorCheck: vi.fn(),
      render: vi.fn(),
      showMessage: vi.fn(),
      logInfo: vi.fn(),
      logError: vi.fn(),
    });

    await runtime.showManageSubscriptionsModal();

    expect(openSubscriptionManagementModal).toHaveBeenCalledWith(subscriptions, expect.any(Object));
  });
});
