import { describe, expect, it } from 'vitest';
import { buildActorStatsHtml } from './statsViewModel';

describe('actors stats view model', () => {
  it('renders actor stats cards with fallback counts', () => {
    const html = buildActorStatsHtml({
      total: 9,
      byGender: { female: 6 },
      byCategory: { censored: 4 },
      blacklisted: 2,
      recentlyAdded: 1,
    });

    expect(html).toContain('data-filter="all"');
    expect(html).toContain('<div class="stat-value">9</div>');
    expect(html).toContain('女演员');
    expect(html).toContain('<div class="stat-value">0</div>');
    expect(html).toContain('本周新增');
  });
});
