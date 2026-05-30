import { describe, expect, it, vi } from 'vitest';
import { handleLogMessage } from '../../src/apps/background/dbLogMessageHandlers';

describe('db log message handlers', () => {
  it('adds one log entry and returns the inserted id', async () => {
    const deps = {
      add: vi.fn(async () => 7),
    };

    const response = await runHandler({
      type: 'DB:LOGS_ADD',
      payload: { entry: { level: 'INFO', message: 'hello' } },
    }, deps);

    expect(response.handled).toBe(true);
    expect(deps.add).toHaveBeenCalledWith({ level: 'INFO', message: 'hello' });
    expect(response.value).toEqual({ success: true, id: 7 });
  });

  it('queries logs and forwards result data', async () => {
    const deps = {
      query: vi.fn(async () => ({ items: [{ id: 1, message: 'hello' }], total: 1 })),
    };

    const response = await runHandler({
      type: 'DB:LOGS_QUERY',
      payload: { query: 'hello', limit: 20 },
    }, deps);

    expect(response.handled).toBe(true);
    expect(deps.query).toHaveBeenCalledWith({ query: 'hello', limit: 20 });
    expect(response.value).toEqual({
      success: true,
      items: [{ id: 1, message: 'hello' }],
      total: 1,
    });
  });

  it('exports logs as JSON', async () => {
    const deps = {
      exportJSON: vi.fn(async () => '[{"id":1}]'),
    };

    const response = await runHandler({ type: 'DB:LOGS_EXPORT' }, deps);

    expect(response.handled).toBe(true);
    expect(response.value).toEqual({ success: true, json: '[{"id":1}]' });
  });

  it('returns false for unrelated DB messages', () => {
    const sendResponse = vi.fn();

    const handled = handleLogMessage({ type: 'DB:VIEWED_GET_ALL' }, sendResponse);

    expect(handled).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});

async function runHandler(message: any, deps: Record<string, any>): Promise<{ handled: boolean; value: any }> {
  return await new Promise((resolve) => {
    const handled = handleLogMessage(message, (value) => resolve({ handled, value }), deps as any);
  });
}
