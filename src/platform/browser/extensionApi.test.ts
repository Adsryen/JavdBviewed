/**
 * @file extensionApi.test.ts
 * @description 扩展 API 门面单测（Chrome/Firefox 命名空间归一化）
 * @module platform/browser
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chromeCallbackToPromise,
  detectBackgroundRuntimeKind,
  detectBrowserEngine,
  ensureChromeNamespace,
  getExtensionApi,
  isExtensionRuntimeAvailable,
  isGeckoEngine,
} from './extensionApi';

function resetGlobals(): void {
  const g = globalThis as typeof globalThis & {
    chrome?: unknown;
    browser?: unknown;
    registration?: unknown;
    clients?: unknown;
  };
  delete g.chrome;
  delete g.browser;
  delete g.registration;
  delete g.clients;
}

describe('extensionApi', () => {
  beforeEach(() => {
    resetGlobals();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    resetGlobals();
    vi.unstubAllGlobals();
  });

  it('getExtensionApi prefers chrome over browser', () => {
    const chromeApi = { runtime: { id: 'chrome-id' } };
    const browserApi = { runtime: { id: 'browser-id' } };
    (globalThis as any).chrome = chromeApi;
    (globalThis as any).browser = browserApi;

    expect(getExtensionApi()).toBe(chromeApi);
  });

  it('getExtensionApi falls back to browser when chrome missing', () => {
    const browserApi = { runtime: { id: 'ff-id', sendMessage: vi.fn() } };
    (globalThis as any).browser = browserApi;

    expect(getExtensionApi()).toBe(browserApi);
  });

  it('ensureChromeNamespace aliases browser onto chrome', () => {
    const browserApi = {
      runtime: {
        id: 'jav-assistant@self-hosted.local',
        sendMessage: vi.fn(),
      },
    };
    (globalThis as any).browser = browserApi;

    const api = ensureChromeNamespace();
    expect(api).toBe(browserApi);
    expect((globalThis as any).chrome).toBe(browserApi);
    expect(isExtensionRuntimeAvailable()).toBe(true);
  });

  it('ensureChromeNamespace is idempotent when chrome.runtime exists', () => {
    const chromeApi = { runtime: { id: 'c' } };
    (globalThis as any).chrome = chromeApi;

    expect(ensureChromeNamespace()).toBe(chromeApi);
    expect(ensureChromeNamespace()).toBe(chromeApi);
  });

  it('isExtensionRuntimeAvailable is false without runtime', () => {
    expect(isExtensionRuntimeAvailable()).toBe(false);
    (globalThis as any).chrome = {};
    expect(isExtensionRuntimeAvailable()).toBe(false);
  });

  it('detectBrowserEngine recognizes Firefox UA as gecko', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    });
    expect(detectBrowserEngine()).toBe('gecko');
    expect(isGeckoEngine()).toBe(true);
  });

  it('detectBrowserEngine recognizes Chrome UA as chromium', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    expect(detectBrowserEngine()).toBe('chromium');
    expect(isGeckoEngine()).toBe(false);
  });

  it('detectBackgroundRuntimeKind returns service_worker when registration+clients present', () => {
    const g = globalThis as any;
    g.registration = { scope: '/' };
    g.clients = { matchAll: vi.fn() };
    // ensure chrome.runtime so event_page path is not taken first incorrectly
    g.chrome = { runtime: { id: 'x' } };

    expect(detectBackgroundRuntimeKind()).toBe('service_worker');
  });

  it('detectBackgroundRuntimeKind returns event_page for chrome.runtime without SW globals', () => {
    (globalThis as any).chrome = { runtime: { id: 'ff' } };
    expect(detectBackgroundRuntimeKind()).toBe('event_page');
  });

  it('chromeCallbackToPromise resolves via callback and rejects lastError', async () => {
    (globalThis as any).chrome = {
      runtime: { lastError: null as { message: string } | null },
    };

    const ok = await chromeCallbackToPromise<number>((cb) => {
      cb(42);
    });
    expect(ok).toBe(42);

    (globalThis as any).chrome.runtime.lastError = { message: 'port closed' };
    await expect(
      chromeCallbackToPromise((cb) => {
        cb(undefined as unknown as number);
      }),
    ).rejects.toThrow(/port closed/);
  });

  it('chromeCallbackToPromise accepts direct Promise return', async () => {
    (globalThis as any).chrome = { runtime: { lastError: null } };
    const value = await chromeCallbackToPromise<string>(() => Promise.resolve('direct'));
    expect(value).toBe('direct');
  });

  it('chromeCallbackToPromise rejects lastError on Promise-style return', async () => {
    (globalThis as any).chrome = {
      runtime: { lastError: null as { message: string } | null },
    };
    await expect(
      chromeCallbackToPromise<string>(() => {
        (globalThis as any).chrome.runtime.lastError = { message: 'promise lastError' };
        return Promise.resolve('should-not-resolve');
      }),
    ).rejects.toThrow(/promise lastError/);
  });
});
