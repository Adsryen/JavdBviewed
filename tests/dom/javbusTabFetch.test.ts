import { afterEach, describe, expect, it, vi } from 'vitest';
import { javbusPageAjaxFetchScript } from '../../src/platform/browser/javbusTabFetch';
import { fetchJavbusAjaxViaRuntime } from '../../src/platform/browser/javbusRuntimeClient';
import { sendRuntimeMessage } from '../../src/platform/browser/runtimeMessages';

describe('JAVBUS tab ajax fetch fallback', () => {
  const originalSendMessage = (globalThis as any).chrome.runtime.sendMessage;
  const originalLastError = (globalThis as any).chrome.runtime.lastError;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).chrome.runtime.sendMessage = originalSendMessage;
    (globalThis as any).chrome.runtime.lastError = originalLastError;
    globalThis.fetch = originalFetch;
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('asks background to fetch JAVBUS ajax in a page tab', async () => {
    const sendMessage = vi.fn((message, callback) => {
      callback({ success: true, data: { ajaxHtml: '<tr><td>ok</td></tr>' } });
    });
    (globalThis as any).chrome.runtime.lastError = undefined;
    (globalThis as any).chrome.runtime.sendMessage = sendMessage;

    const html = await fetchJavbusAjaxViaRuntime('https://www.javbus.com/JUR-730', 12000);

    expect(html).toBe('<tr><td>ok</td></tr>');
    expect(sendMessage).toHaveBeenCalledWith(
      {
        type: 'FETCH_JAVBUS_AJAX_VIA_TAB',
        pageUrl: 'https://www.javbus.com/JUR-730',
        timeoutMs: 12000,
      },
      expect.any(Function),
    );
  });

  it('wraps callback-based runtime messages as promises', async () => {
    const sendMessage = vi.fn((message, callback) => {
      callback({ success: true, data: { value: 1 } });
    });
    (globalThis as any).chrome.runtime.lastError = undefined;
    (globalThis as any).chrome.runtime.sendMessage = sendMessage;

    await expect(sendRuntimeMessage({ type: 'demo', payload: { id: 1 } })).resolves.toEqual({
      success: true,
      data: { value: 1 },
    });
    expect(sendMessage).toHaveBeenCalledWith({ type: 'demo', payload: { id: 1 } }, expect.any(Function));
  });

  it('rejects runtime messages when Chrome reports lastError', async () => {
    (globalThis as any).chrome.runtime.lastError = { message: 'receiver missing' };
    (globalThis as any).chrome.runtime.sendMessage = vi.fn((_message, callback) => {
      callback(undefined);
    });

    await expect(sendRuntimeMessage({ type: 'demo' })).rejects.toThrow('receiver missing');
  });

  it('rejects runtime messages when runtime is unavailable', async () => {
    const originalChrome = (globalThis as any).chrome;
    Object.defineProperty(globalThis, 'chrome', {
      value: undefined,
      configurable: true,
    });

    await expect(sendRuntimeMessage({ type: 'demo' })).rejects.toThrow('Chrome runtime is not available');

    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('runs same-origin ajax from the JAVBUS page context', async () => {
    document.body.innerHTML = `
      <script>
        var gid = 68458436107;
        var uc = 0;
        var img = 'https://www.javbus.com/pics/cover/example.jpg';
      </script>
    `;
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      status: 200,
      text: async () => '<tr><td><a href="magnet:?xt=urn:btih:abc">JUR730</a></td></tr>',
    } as Response));
    globalThis.fetch = fetchMock as any;

    const result = await javbusPageAjaxFetchScript();

    expect(result.success).toBe(true);
    expect(result.ajaxUrl).toContain('/ajax/uncledatoolsbyajax.php?');
    expect(result.ajaxUrl).toContain('gid=68458436107');
    expect(result.ajaxHtml).toContain('magnet:?xt=urn:btih:abc');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/ajax/uncledatoolsbyajax.php?'),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'X-Requested-With': 'XMLHttpRequest' }),
      }),
    );
  });
});
