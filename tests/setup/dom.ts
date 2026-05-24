import { vi } from 'vitest';

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  configurable: true,
});

Object.defineProperty(globalThis, 'chrome', {
  value: {
    runtime: {
      id: 'test-runtime',
      lastError: null,
      getURL: vi.fn((path: string) => `chrome-extension://test-runtime/${path}`),
      sendMessage: vi.fn((_message, callback) => callback?.({ ok: true, success: true })),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    storage: {
      local: {
        get: vi.fn((_keys, callback) => callback?.({})),
        set: vi.fn((_payload, callback) => callback?.()),
        remove: vi.fn((_keys, callback) => callback?.()),
      },
    },
  },
  configurable: true,
});
