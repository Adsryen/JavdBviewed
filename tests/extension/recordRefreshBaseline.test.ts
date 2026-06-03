import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../../src/utils/config';
import {
  setChromeStorage,
  setRuntimeMessageHandler,
} from '../setup/chrome';

const viewedPutMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/platform/storage/indexedDb', () => ({
  viewedPut: viewedPutMock,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('record refresh baseline', () => {
  it('parses JavDB search result links from the refresh feature module', async () => {
    const { parseSearchResults } = await import('../../src/features/records/refresh/application/javdbParsers');
    const html = `
      <div class="movie-list">
        <div class="item">
          <a href="/v/abc123" title="MKMP-577 Sample Title">
            <div class="video-title"><strong>MKMP-577</strong> Sample Title</div>
          </a>
        </div>
      </div>
    `;

    expect(parseSearchResults(html, 'MKMP-577')).toEqual({
      href: 'https://javdb.com/v/abc123',
      title: 'MKMP-577 Sample Title',
    });
  });

  it('parses JavDB detail metadata from the refresh feature module', async () => {
    const { parseDetailPage } = await import('../../src/features/records/refresh/application/javdbParsers');
    const html = `
      <div class="panel-block">
        <strong>日期:</strong>
        <span class="value">2026-05-28</span>
      </div>
      <a data-fancybox="gallery" href="https://c0.jdbstatic.com/covers/ab/abc123.jpg"></a>
      <div class="panel-block">
        <strong>類別:</strong>
        <span class="value">
          <a href="/tags/drama">剧情</a>
          <a href="/tags/hd">高清</a>
          <a href="/tags/drama">剧情</a>
        </span>
      </div>
    `;

    expect(parseDetailPage(html)).toEqual({
      releaseDate: '2026-05-28',
      tags: ['剧情', '高清'],
      javdbImage: 'https://c0.jdbstatic.com/covers/ab/abc123.jpg',
    });
  });

  it('detects Cloudflare challenge pages while allowing normal JavDB content', async () => {
    const { isCloudflareChallenge } = await import('../../src/features/records/refresh/application/cloudflareVerification');

    expect(isCloudflareChallenge(`
      <html>
        <title>Security Verification</title>
        <form id="cf-challenge">Please complete the security check</form>
      </html>
    `)).toBe(true);

    expect(isCloudflareChallenge(`
      <div class="video-detail">
        <p>Security Verification mentioned in cached text</p>
      </div>
    `)).toBe(false);
  });

  it('detects FC2 record ids from the refresh feature module', async () => {
    const { isFC2Video } = await import('../../src/features/records/refresh/application/fc2Refresh');

    expect(isFC2Video('FC2-4903984')).toBe(true);
    expect(isFC2Video('fc2ppv-4903984')).toBe(true);
    expect(isFC2Video('MKMP-577')).toBe(false);
  });

  it('persists refreshed migrated records to the IndexedDB viewed store', async () => {
    const existingRecord = {
      createdAt: 1754054380645,
      id: 'ZEAA-087',
      javdbImage: null,
      javdbUrl: 'https://javdb.com/v/k46a5z',
      releaseDate: null,
      status: 'browsed',
      tags: ['tampermonkey-import'],
      title: 'ZEAA-087',
      updatedAt: 1756311543641,
    };

    setChromeStorage({ [STORAGE_KEYS.IDB_MIGRATED]: true });
    setRuntimeMessageHandler((message) => {
      if (message.type === 'DB:VIEWED_GET_ALL') {
        return { success: true, records: [existingRecord] };
      }
      if (message.type === 'DB:VIEWED_PUT') {
        return { success: true };
      }
      return { success: true };
    });

    const fetchMock = vi.fn(async () => new Response(`
      <html>
        <head><title>ZEAA-087 Milk Title | JavDB</title></head>
        <body>
          <div class="panel-block">
            <strong>日期:</strong>
            <span class="value">2023-10-12</span>
          </div>
          <img class="video-cover" src="https://c0.jdbstatic.com/covers/k4/k46a5z.jpg" />
          <div class="panel-block">
            <strong>類別:</strong>
            <span class="value">
              <a href="/tags?c4=15">mature</a>
              <a href="/tags?c5=100">milk</a>
            </span>
          </div>
        </body>
      </html>
    `, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { refreshRecordById } = await import('../../src/features/records/refresh/application/recordRefresh');
    const updated = await refreshRecordById('ZEAA-087');

    expect(updated).toMatchObject({
      id: 'ZEAA-087',
      releaseDate: '2023-10-12',
      javdbUrl: 'https://javdb.com/v/k46a5z',
      javdbImage: 'https://c0.jdbstatic.com/covers/k4/k46a5z.jpg',
      tags: ['mature', 'milk'],
    });

    expect(viewedPutMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'ZEAA-087',
      releaseDate: '2023-10-12',
      javdbUrl: 'https://javdb.com/v/k46a5z',
      javdbImage: 'https://c0.jdbstatic.com/covers/k4/k46a5z.jpg',
      tags: ['mature', 'milk'],
    }));
  });
});
