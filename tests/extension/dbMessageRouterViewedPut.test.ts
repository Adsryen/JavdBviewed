/**
 * @file dbMessageRouterViewedPut.test.ts
 * @description DB:VIEWED_PUT route tests
 * @module tests/extension
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DB:VIEWED_PUT route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('../../apps/extension/src/platform/storage/indexedDb');
  });

  it('returns the viewedPut result including skipped reason', async () => {
    const record = {
      id: 'SSIS-001',
      title: 'Existing trash record',
      status: 'viewed',
      createdAt: 1000,
      updatedAt: 2000,
    };
    const viewedPut = vi.fn().mockResolvedValue({
      success: true,
      skipped: true,
      reason: 'record_in_trash',
    });

    vi.doMock('../../apps/extension/src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../apps/extension/src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB: vi.fn(() => Promise.resolve({})),
        viewedPut,
      };
    });

    const { registerDbMessageRouter } = await import('../../apps/extension/src/background/dbRouter');
    registerDbMessageRouter();

    const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls.at(-1)?.[0];
    if (!listener) {
      throw new Error('DB message listener was not registered');
    }

    const response = await new Promise((resolve) => {
      const asyncResult = listener(
        { type: 'DB:VIEWED_PUT', payload: { record } },
        {} as chrome.runtime.MessageSender,
        resolve,
      );
      expect(asyncResult).toBe(true);
    });

    expect(viewedPut).toHaveBeenCalledWith(record);
    expect(response).toEqual({
      success: true,
      skipped: true,
      reason: 'record_in_trash',
    });
  });
});
