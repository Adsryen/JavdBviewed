import { describe, expect, it, vi } from 'vitest';
import { handleMagnetPushLogMessage } from '../../src/apps/background/dbMagnetPushLogMessageHandlers';

describe('db magnet push log message handlers', () => {
  it('adds one magnet push log entry and returns the inserted id', async () => {
    const deps = {
      add: vi.fn(async () => 42),
    };

    const response = await runHandler({
      type: 'DB:MAGNET_PUSH_LOGS_ADD',
      payload: {
        entry: {
          type: 'success',
          videoId: 'ABC-001',
          data: { traceId: 'trace-1', taskId: 'task-1' },
        },
      },
    }, deps);

    expect(response.handled).toBe(true);
    expect(deps.add).toHaveBeenCalledWith({
      type: 'success',
      videoId: 'ABC-001',
      data: { traceId: 'trace-1', taskId: 'task-1' },
    });
    expect(response.value).toEqual({ success: true, id: 42 });
  });

  it('queries magnet push logs and forwards pagination data', async () => {
    const deps = {
      query: vi.fn(async () => ({
        items: [{ id: 1, videoId: 'ABC-001' }],
        total: 1,
      })),
    };

    const response = await runHandler({
      type: 'DB:MAGNET_PUSH_LOGS_QUERY',
      payload: { query: 'ABC', limit: 20, offset: 0 },
    }, deps);

    expect(response.handled).toBe(true);
    expect(deps.query).toHaveBeenCalledWith({ query: 'ABC', limit: 20, offset: 0 });
    expect(response.value).toEqual({
      success: true,
      items: [{ id: 1, videoId: 'ABC-001' }],
      total: 1,
    });
  });

  it('exports all magnet push logs as JSON', async () => {
    const deps = {
      getAll: vi.fn(async () => [{ id: 1 }, { id: 2 }]),
    };

    const response = await runHandler({ type: 'DB:MAGNET_PUSH_LOGS_EXPORT' }, deps);

    expect(response.handled).toBe(true);
    expect(response.value).toEqual({
      success: true,
      json: JSON.stringify([{ id: 1 }, { id: 2 }]),
    });
  });

  it('returns false for unrelated DB messages', () => {
    const sendResponse = vi.fn();

    const handled = handleMagnetPushLogMessage({ type: 'DB:VIEWED_GET_ALL' }, sendResponse);

    expect(handled).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});

async function runHandler(message: any, deps: Record<string, any>): Promise<{ handled: boolean; value: any }> {
  return await new Promise((resolve) => {
    const handled = handleMagnetPushLogMessage(message, (value) => resolve({ handled, value }), deps as any);
  });
}
