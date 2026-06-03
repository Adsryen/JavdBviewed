import { describe, expect, it } from 'vitest';
import type { ActorSubscription } from '../../types';
import { buildSubscriptionManagementModalHtml } from './newWorksSubscriptionModalViewModel';

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

describe('new works subscription modal view model', () => {
  it('renders subscription management modal with avatar, actions and summary', () => {
    const html = buildSubscriptionManagementModalHtml([
      subscription(),
      subscription({ actorId: 'actor-2', actorName: 'Bob', avatarUrl: undefined, enabled: false }),
    ]);

    expect(html).toContain('管理订阅演员');
    expect(html).toContain('id="subscriptionManagementSearch"');
    expect(html).toContain('data-actor-id="actor-1"');
    expect(html).toContain('src="https://img.example.com/a.jpg"');
    expect(html).toContain('class="subscription-avatar-placeholder"');
    expect(html).toContain('data-action="check-single"');
    expect(html).toContain('data-action="toggle"');
    expect(html).toContain('checked');
    expect(html).toContain('共 2 个订阅演员');
  });
});
