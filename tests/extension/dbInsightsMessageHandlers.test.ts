import { describe, expect, it, vi } from 'vitest';
import { handleInsightsMessage } from '../../src/apps/background/dbInsightsMessageHandlers';

describe('db insights message handlers', () => {
  it('stores one insights view and broadcasts a change event', async () => {
    const sendRuntimeMessage = vi.fn();
    const deps = {
      viewsPut: vi.fn(async () => {}),
      sendRuntimeMessage,
    };

    const response = await runHandler({
      type: 'DB:INSIGHTS_VIEWS_PUT',
      payload: { view: { date: '2026-05-30', views: 3 } },
    }, deps);

    expect(response.handled).toBe(true);
    expect(deps.viewsPut).toHaveBeenCalledWith({ date: '2026-05-30', views: 3 });
    expect(sendRuntimeMessage).toHaveBeenCalledWith({
      type: 'DB:INSIGHTS_VIEWS_CHANGED',
      payload: { date: '2026-05-30', count: 1 },
    });
    expect(response.value).toEqual({ success: true });
  });

  it('lists reports with the default limit', async () => {
    const deps = {
      reportsList: vi.fn(async () => [{ month: '2026-05' }]),
    };

    const response = await runHandler({ type: 'DB:INSIGHTS_REPORTS_LIST', payload: {} }, deps);

    expect(response.handled).toBe(true);
    expect(deps.reportsList).toHaveBeenCalledWith(24);
    expect(response.value).toEqual({
      success: true,
      records: [{ month: '2026-05' }],
    });
  });

  it('returns trend points for records with a default cumulative mode', async () => {
    const deps = {
      trendsRecordsRange: vi.fn(async () => [{ date: '2026-05-30', count: 7 }]),
    };

    const response = await runHandler({
      type: 'DB:TRENDS_RECORDS_RANGE',
      payload: { startDate: '2026-05-01', endDate: '2026-05-30' },
    }, deps);

    expect(response.handled).toBe(true);
    expect(deps.trendsRecordsRange).toHaveBeenCalledWith('2026-05-01', '2026-05-30', 'cumulative');
    expect(response.value).toEqual({
      success: true,
      points: [{ date: '2026-05-30', count: 7 }],
    });
  });

  it('returns false for unrelated DB messages', () => {
    const sendResponse = vi.fn();

    const handled = handleInsightsMessage({ type: 'DB:VIEWED_GET_ALL' }, sendResponse);

    expect(handled).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});

async function runHandler(message: any, deps: Record<string, any>): Promise<{ handled: boolean; value: any }> {
  return await new Promise((resolve) => {
    const handled = handleInsightsMessage(message, (value) => resolve({ handled, value }), deps as any);
  });
}
