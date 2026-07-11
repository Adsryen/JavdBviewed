/**
 * @file runtimeMessages.test.ts
 * @description sendRuntimeMessage 兼容门面单测
 * @module platform/browser
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendRuntimeMessage } from './runtimeMessages';

describe('sendRuntimeMessage', () => {
  beforeEach(() => {
    const g = globalThis as any;
    delete g.chrome;
    delete g.browser;
  });

  afterEach(() => {
    const g = globalThis as any;
    delete g.chrome;
    delete g.browser;
  });

  it('rejects when runtime is unavailable', async () => {
    await expect(sendRuntimeMessage({ type: 'PING' })).rejects.toThrow(/not available/i);
  });

  it('uses browser-aliased chrome and resolves response', async () => {
    const sendMessage = vi.fn((_msg: unknown, cb: (r: unknown) => void) => {
      cb({ ok: true });
    });
    (globalThis as any).browser = {
      runtime: {
        id: 'jav-assistant@self-hosted.local',
        sendMessage,
        lastError: undefined,
      },
    };

    const response = await sendRuntimeMessage<{ ok: boolean }>({ type: 'PING' });
    expect(response).toEqual({ ok: true });
    expect(sendMessage).toHaveBeenCalledWith({ type: 'PING' }, expect.any(Function));
    expect((globalThis as any).chrome?.runtime?.id).toBe('jav-assistant@self-hosted.local');
  });

  it('rejects chrome.runtime.lastError', async () => {
    (globalThis as any).chrome = {
      runtime: {
        id: 'test',
        lastError: null as { message: string } | null,
        sendMessage: vi.fn((_msg: unknown, cb: (r: unknown) => void) => {
          (globalThis as any).chrome.runtime.lastError = { message: 'The message port closed' };
          cb(undefined);
        }),
      },
    };

    await expect(sendRuntimeMessage({ type: 'X' })).rejects.toThrow(/message port closed/i);
  });
});
