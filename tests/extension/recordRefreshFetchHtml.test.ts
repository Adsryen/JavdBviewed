/**
 * @file recordRefreshFetchHtml.test.ts
 * @description 记录刷新 HTML 抓取请求头测试
 * @module tests/extension
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHtml } from '../../apps/extension/src/features/records/refresh/application/cloudflareVerification';

describe('record refresh fetchHtml request headers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not advertise image or video resources for background HTML fetches', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html><body><div class="video-meta"></div></body></html>', { status: 200 }),
    );

    await fetchHtml('https://javdb.com/v/abc123');

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Accept).toBe('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.1');
    expect(headers?.Accept).not.toContain('image/');
    expect(headers?.Accept).not.toContain('video/');
  });
});
