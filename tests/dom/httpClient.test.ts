/**
 * @file httpClient.test.ts
 * @description HttpClient background fetch handling 测试
 * @module tests/dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../apps/extension/src/platform/network/httpClient';

describe('HttpClient background fetch handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects background fetch responses with HTTP error status', async () => {
    vi.spyOn(chrome.runtime, 'sendMessage').mockImplementation((_message: any, callback?: (response: any) => void) => {
      callback?.({
        success: true,
        status: 404,
        data: '<html><title>404 Not Found</title></html>',
      });
    });
    const client = new HttpClient();

    await expect(client.get<string>('https://example.test/missing', {
      responseType: 'text',
      retries: 0,
    })).rejects.toThrow('HTTP 404');
  });

  it('uses document-only accept headers for HTML document requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html><body>OK</body></html>', { status: 200 }),
    );
    const client = new HttpClient(window.location.origin, {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    await client.getDocument('/sync-page', { retries: 0 });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Accept).toBe('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.1');
    expect(headers?.Accept).not.toContain('image/');
  });
});
