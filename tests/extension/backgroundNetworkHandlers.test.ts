import { describe, expect, it, vi } from 'vitest';
import {
  handleExternalDataFetch,
  handleFetchExternalCover,
} from '../../src/apps/background/networkMessageHandlers';

describe('background network message handlers', () => {
  it('rejects external data fetch without URL', async () => {
    const sendResponse = vi.fn();
    const scheduler = { enqueue: vi.fn() };

    await handleExternalDataFetch({}, sendResponse, scheduler as any);

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'No URL provided' });
    expect(scheduler.enqueue).not.toHaveBeenCalled();
  });

  it('returns text body, status, and headers from scheduled external fetch', async () => {
    const sendResponse = vi.fn();
    const scheduler = {
      enqueue: vi.fn(async () => new Response('hello', {
        status: 202,
        headers: { 'x-test': 'ok' },
      })),
    };

    await handleExternalDataFetch({
      url: 'https://example.com/data',
      options: { method: 'POST', body: 'payload', timeout: 1000 },
    }, sendResponse, scheduler as any);

    expect(scheduler.enqueue).toHaveBeenCalledWith(
      'https://example.com/data',
      expect.objectContaining({ method: 'POST', body: 'payload' }),
    );
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: 'hello',
      status: 202,
      headers: { 'content-type': 'text/plain;charset=UTF-8', 'x-test': 'ok' },
    });
  });

  it('extracts an external cover URL from BlogJav search results', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = vi.fn(async () => new Response(`
      <div class="post-item">
        <h2>ABC001 Sample Title</h2>
        <img data-src="/covers/abc001.jpg">
      </div>
    `, { status: 200 }));

    await handleFetchExternalCover({ code: 'ABC-001' }, sendResponse, fetchImpl as any);

    expect(fetchImpl).toHaveBeenCalledWith('https://blogjav.net/search?q=ABC-001');
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      imageUrl: 'https://blogjav.net/covers/abc001.jpg',
    });
  });
});
