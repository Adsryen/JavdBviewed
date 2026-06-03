import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActorSubscription } from '../../src/types';
import { openSubscriptionManagementModal } from '../../src/dashboard/tabs/newWorksSubscriptionModalRuntime';

function subscription(overrides: Partial<ActorSubscription> = {}): ActorSubscription {
  return {
    actorId: 'actor-1',
    actorName: 'Alice',
    avatarUrl: 'https://img.example.com/a.jpg',
    subscribedAt: new Date('2026-05-01T00:00:00+08:00').getTime(),
    lastCheckTime: new Date('2026-05-02T00:00:00+08:00').getTime(),
    enabled: true,
    ...overrides,
  };
}

function deps(overrides: Partial<Parameters<typeof openSubscriptionManagementModal>[1]> = {}) {
  return {
    showAddSubscriptionModal: vi.fn(),
    toggleSubscription: vi.fn(async () => undefined),
    removeSubscription: vi.fn(async () => undefined),
    confirmRemove: vi.fn(async () => true),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    handleSingleSubscriptionCheck: vi.fn(async () => undefined),
    logInfo: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

async function flushAsyncClick() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

describe('new works subscription modal runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('opens modal and closes from footer after animation delay', () => {
    const runtime = deps();

    const modal = openSubscriptionManagementModal([subscription()], runtime);

    expect(modal.className).toBe('subscription-management-modal');
    expect(document.body.contains(modal)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(modal.querySelector('.modal-overlay')?.classList.contains('visible')).toBe(true);

    modal.querySelector<HTMLElement>('#subscriptionManagementClose')?.click();
    expect(document.body.contains(modal)).toBe(true);
    vi.advanceTimersByTime(200);

    expect(document.body.contains(modal)).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('filters subscriptions by actor name and updates summary', () => {
    const runtime = deps();
    const modal = openSubscriptionManagementModal([
      subscription({ actorName: 'Alice' }),
      subscription({ actorId: 'actor-2', actorName: 'Bob' }),
    ], runtime);

    const input = modal.querySelector<HTMLInputElement>('#subscriptionManagementSearch')!;
    input.value = 'ali';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect((modal.querySelector('[data-actor-id="actor-1"]') as HTMLElement).style.display).toBe('');
    expect((modal.querySelector('[data-actor-id="actor-2"]') as HTMLElement).style.display).toBe('none');
    expect(modal.querySelector('.subscription-management-summary')?.textContent).toBe('搜索结果 1 / 2');
  });

  it('closes modal before opening add subscription selector', () => {
    const runtime = deps();
    const modal = openSubscriptionManagementModal([subscription()], runtime);

    modal.querySelector<HTMLElement>('#subscriptionManagementAddActor')?.click();
    vi.advanceTimersByTime(200);
    expect(document.body.contains(modal)).toBe(false);

    vi.advanceTimersByTime(20);
    expect(runtime.showAddSubscriptionModal).toHaveBeenCalledTimes(1);
  });

  it('toggles subscription and reverts checkbox when toggle fails', async () => {
    const runtime = deps({
      toggleSubscription: vi.fn(async () => { throw new Error('toggle failed'); }),
    });
    const modal = openSubscriptionManagementModal([subscription()], runtime);
    const toggle = modal.querySelector<HTMLInputElement>('[data-action="toggle"]')!;

    toggle.checked = false;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncClick();

    expect(runtime.toggleSubscription).toHaveBeenCalledWith('actor-1', false);
    expect(runtime.render).not.toHaveBeenCalled();
    expect(toggle.checked).toBe(true);
    expect(runtime.logError).toHaveBeenCalledWith('切换订阅状态失败:', expect.any(Error));
  });

  it('runs single actor check and removes confirmed subscriptions', async () => {
    const runtime = deps();
    const modal = openSubscriptionManagementModal([subscription()], runtime);

    const checkBtn = modal.querySelector<HTMLButtonElement>('[data-action="check-single"]')!;
    checkBtn.click();
    await flushAsyncClick();
    expect(runtime.handleSingleSubscriptionCheck).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'actor-1' }), checkBtn);

    modal.querySelector<HTMLElement>('[data-action="remove"]')?.click();
    await flushAsyncClick();

    expect(runtime.confirmRemove).toHaveBeenCalledWith('Alice');
    expect(runtime.removeSubscription).toHaveBeenCalledWith('actor-1');
    expect(modal.querySelector('[data-actor-id="actor-1"]')).toBeNull();
    expect(runtime.render).toHaveBeenCalledTimes(1);
    expect(runtime.showMessage).toHaveBeenCalledWith('已移除演员 Alice 的订阅', 'success');
  });
});
