import { describe, expect, it, vi } from 'vitest';
import type { ActorSubscription } from '../../types';
import { runSingleSubscriptionCheckWorkflow } from './newWorksSingleSubscriptionCheckWorkflow';

function subscription(overrides: Partial<ActorSubscription> = {}): ActorSubscription {
  return {
    actorId: 'actor-1',
    actorName: 'Alice',
    subscribedAt: 1,
    enabled: true,
    ...overrides,
  };
}

function button() {
  return {
    disabled: false,
    innerHTML: '<i class="fas fa-sync-alt"></i>',
  } as HTMLButtonElement;
}

function deps(overrides: Partial<Parameters<typeof runSingleSubscriptionCheckWorkflow>[0]['deps']> = {}) {
  return {
    sendSingleActorCheck: vi.fn(async () => ({
      success: true,
      result: {
        identified: 5,
        effective: 2,
        discovered: 1,
      },
    })),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works single subscription check workflow', () => {
  it('checks one actor, renders and restores button after success', async () => {
    const runtimeDeps = deps();
    const checkButton = button();

    await runSingleSubscriptionCheckWorkflow({
      subscription: subscription(),
      button: checkButton,
      deps: runtimeDeps,
    });

    expect(checkButton.disabled).toBe(false);
    expect(checkButton.innerHTML).toBe('<i class="fas fa-sync-alt"></i>');
    expect(runtimeDeps.showMessage).toHaveBeenNthCalledWith(1, '已开始检查 Alice', 'info');
    expect(runtimeDeps.sendSingleActorCheck).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'actor-1',
      actorName: 'Alice',
    }));
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenLastCalledWith('Alice: 识别 5，有效 2，新增 1', 'success');
  });

  it('uses info result when no new works were discovered', async () => {
    const runtimeDeps = deps({
      sendSingleActorCheck: vi.fn(async () => ({
        success: true,
        result: { discovered: 0 },
      })),
    });

    await runSingleSubscriptionCheckWorkflow({
      subscription: subscription({ actorName: 'Bob' }),
      button: button(),
      deps: runtimeDeps,
    });

    expect(runtimeDeps.showMessage).toHaveBeenLastCalledWith('Bob: 新增 0', 'info');
  });

  it('reports failed background response and restores button', async () => {
    const runtimeDeps = deps({
      sendSingleActorCheck: vi.fn(async () => ({ success: false, error: '后台失败' })),
    });
    const checkButton = button();

    await runSingleSubscriptionCheckWorkflow({
      subscription: subscription(),
      button: checkButton,
      deps: runtimeDeps,
    });

    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('检查演员 Alice 失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenLastCalledWith('检查 Alice 失败: 后台失败', 'error');
    expect(checkButton.disabled).toBe(false);
    expect(checkButton.innerHTML).toBe('<i class="fas fa-sync-alt"></i>');
  });
});
