import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../src/platform/network/httpClient';

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
});
