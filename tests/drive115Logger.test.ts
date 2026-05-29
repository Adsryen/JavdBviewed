import { describe, expect, it } from 'vitest';

describe('Drive115AppLogger', () => {
  it('writes push logs to the dedicated magnet log pool', async () => {
    const sentMessages: Array<{ type: string; payload?: any }> = [];
    const originalChrome = (globalThis as any).chrome;

  (globalThis as any).chrome = {
    runtime: {
      id: 'test-runtime',
      lastError: null,
      sendMessage: (message: { type: string; payload?: any }, callback?: (response: any) => void) => {
        sentMessages.push(message);
        callback?.({ success: true });
      },
    },
    storage: {
      local: {
        get: (_keys: any, callback: (result: Record<string, any>) => void) => callback({}),
        set: (_value: any, callback?: () => void) => callback?.(),
      },
    },
  };

  try {
    const { Drive115AppLogger } = await import('../src/features/drive115/app/logger.ts');
    const logger = new Drive115AppLogger();

    await logger.logPushSuccess({
      source: 'test',
      videoId: 'ABC-115',
      magnetName: 'ABC-115 sample',
      magnetUrl: 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678',
      pageUrl: 'https://javdb.com/v/test',
      wpPathId: '0',
    });

    const magnetLogMessage = sentMessages.find((message) => message.type === 'DB:MAGNET_PUSH_LOGS_ADD');
    expect(magnetLogMessage).toBeTruthy();
    expect(magnetLogMessage?.payload.entry.type).toBe('push_success');
    expect(magnetLogMessage?.payload.entry.videoId).toBe('ABC-115');
    expect(magnetLogMessage?.payload.entry.data.magnetName).toBe('ABC-115 sample');
  } finally {
    (globalThis as any).chrome = originalChrome;
  }
  });
});
