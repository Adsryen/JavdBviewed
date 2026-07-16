import { describe, expect, it } from 'vitest';
import type { NewWorksStats } from '../../types';
import {
  buildManageSubscriptionsButtonHtml,
  buildNewWorksStatsHtml,
} from './newWorksStatsViewModel';

function stats(overrides: Partial<NewWorksStats> = {}): NewWorksStats {
  return {
    totalSubscriptions: 12,
    activeSubscriptions: 9,
    totalNewWorks: 45,
    unreadWorks: 8,
    todayDiscovered: 3,
    lastCheckTime: new Date('2026-05-02T00:00:00+08:00').getTime(),
    ...overrides,
  };
}

describe('new works stats view model', () => {
  it('renders clickable stats cards with values and filter targets', () => {
    const html = buildNewWorksStatsHtml(stats());

    expect(html).toContain('data-filter="all"');
    expect(html).toContain('data-filter="active"');
    expect(html).toContain('data-filter="allWorks"');
    expect(html).toContain('data-filter="unread"');
    expect(html).toContain('data-filter="today"');
    expect(html).toContain('<div class="stat-value">12</div>');
    expect(html).toContain('<div class="stat-label">订阅演员</div>');
    expect(html).toContain('<div class="stat-value">8</div>');
    expect(html).toContain('<div class="stat-label">未读作品</div>');
  });

  it('renders manage subscriptions button badge with total count fallback', () => {
    expect(buildManageSubscriptionsButtonHtml(12)).toBe('<i class="fas fa-list"></i> 管理订阅 <span class="badge">12</span>');
    expect(buildManageSubscriptionsButtonHtml(undefined)).toBe('<i class="fas fa-list"></i> 管理订阅 <span class="badge">0</span>');
  });
});
