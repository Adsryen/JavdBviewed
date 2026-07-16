import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_INSIGHTS_TEMPLATE_FALLBACK,
  fetchInsightsVideoRecordsPaged,
  loadInsightsTemplate,
} from './supportRuntime';

describe('insights support runtime', () => {
  it('loads template html and falls back when fetch fails', async () => {
    const fetchOk = vi.fn(async () => new Response('<html>template</html>'));
    await expect(loadInsightsTemplate({
      getTemplateUrl: () => 'chrome-extension://assets/templates/insights-report.html',
      fetchFn: fetchOk,
    })).resolves.toBe('<html>template</html>');
    expect(fetchOk).toHaveBeenCalledWith('chrome-extension://assets/templates/insights-report.html');

    await expect(loadInsightsTemplate({
      getTemplateUrl: () => 'bad-url',
      fetchFn: async () => { throw new Error('network'); },
    })).resolves.toBe(DEFAULT_INSIGHTS_TEMPLATE_FALLBACK);
  });

  it('reads viewed records page by page until exhausted', async () => {
    const dbViewedPage = vi.fn(async ({ offset }: { offset: number; limit: number }) => {
      if (offset === 0) return { items: [{ id: 'a' }, { id: 'b' }], total: 5 };
      if (offset === 2) return { items: [{ id: 'c' }, { id: 'd' }], total: 5 };
      return { items: [{ id: 'e' }], total: 5 };
    });

    await expect(fetchInsightsVideoRecordsPaged(dbViewedPage, 2)).resolves.toEqual([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
      { id: 'e' },
    ]);
    expect(dbViewedPage).toHaveBeenCalledWith({ offset: 0, limit: 2, orderBy: 'updatedAt', order: 'desc' });
    expect(dbViewedPage).toHaveBeenCalledWith({ offset: 2, limit: 2, orderBy: 'updatedAt', order: 'desc' });
    expect(dbViewedPage).toHaveBeenCalledWith({ offset: 4, limit: 2, orderBy: 'updatedAt', order: 'desc' });
  });
});
