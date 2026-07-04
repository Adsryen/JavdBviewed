import { describe, expect, it, vi } from 'vitest';
import { handleEmbyLibraryCheckCodes, handleEmbyLibrarySync } from './handlers';
import type { EmbyLibraryState, EmbyMediaServer } from '../types';

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type FetchMock = ReturnType<typeof vi.fn<FetchImpl>>;

const server: EmbyMediaServer = {
  id: 'main',
  type: 'emby',
  name: 'Main',
  url: 'http://media.local:8096/',
  apiKey: 'api-secret',
  enabled: true,
};

function createFetchMock(impl: FetchImpl): FetchMock {
  return vi.fn<FetchImpl>(impl);
}

function createDeps(fetchImpl: typeof fetch, storedState: EmbyLibraryState = { entries: {}, updatedAt: 0 }) {
  return {
    getSettings: vi.fn(async () => ({
      emby: {
        mediaServers: [server],
        libraryStatus: {
          enabled: true,
          showOnList: true,
          showOnDetail: true,
        },
      },
    })),
    getState: vi.fn(async () => storedState),
    saveState: vi.fn(async () => {}),
    fetchImpl,
    now: vi.fn(() => 1000),
  };
}

describe('emby library background handlers', () => {
  it('syncs enabled servers and saves a redacted library state', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = createFetchMock(async () => new Response(JSON.stringify({
      Items: [
        {
          Id: 'item-1',
          Name: 'ABC-101 Sample',
          Path: '/movies/ABC-101.mkv',
          ImageTags: { Primary: 'cover-tag' },
        },
      ],
    }), { status: 200 }));
    const deps = createDeps(fetchImpl);

    await handleEmbyLibrarySync({ manual: true }, sendResponse, deps);

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://media.local:8096/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Path%2CPrimaryImageAspectRatio%2CImageTags&api_key=api-secret',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(deps.saveState).toHaveBeenCalledWith(expect.objectContaining({
      updatedAt: 1000,
      serverResults: [
        expect.objectContaining({ serverId: 'main', success: true, itemCount: 1 }),
      ],
    }));
    const savedState = deps.saveState.mock.calls[0][0] as EmbyLibraryState;
    expect(savedState.entries['ABC-101'][0]).toMatchObject({
      serverName: 'Main',
      serverUrl: 'http://media.local:8096',
      itemId: 'item-1',
      coverImageUrl: 'http://media.local:8096/Items/item-1/Images/Primary?tag=cover-tag',
    });
    expect(JSON.stringify(savedState)).not.toContain('api-secret');
    expect(sendResponse).toHaveBeenCalledWith({ success: true, synced: 1, failed: 0 });
  });

  it('keeps previous successful entries when a server returns 401', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = createFetchMock(async () => new Response('unauthorized', { status: 401 }));
    const previousState: EmbyLibraryState = {
      entries: {
        'ABC-102': [{
          serverType: 'emby',
          serverName: 'Main',
          serverUrl: 'http://media.local:8096',
          itemId: 'old-item',
          itemName: 'ABC-102',
          updatedAt: 500,
        }],
      },
      updatedAt: 500,
    };
    const deps = createDeps(fetchImpl, previousState);

    await handleEmbyLibrarySync({ manual: true }, sendResponse, deps);

    expect(deps.saveState).toHaveBeenCalledWith(expect.objectContaining({
      entries: previousState.entries,
      serverResults: [
        expect.objectContaining({ serverId: 'main', success: false, error: 'API Key 错误' }),
      ],
    }));
    expect(sendResponse).toHaveBeenCalledWith({ success: false, synced: 0, failed: 1 });
  });

  it('preserves the last successful index timestamp when every server fails', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = createFetchMock(async () => new Response('server error', { status: 500 }));
    const previousState: EmbyLibraryState = {
      entries: {
        'ABC-103': [{
          serverType: 'emby',
          serverName: 'Main',
          serverUrl: 'http://media.local:8096',
          itemId: 'old-item',
          itemName: 'ABC-103',
          updatedAt: 500,
        }],
      },
      updatedAt: 500,
    };
    const deps = createDeps(fetchImpl, previousState);

    await handleEmbyLibrarySync({ manual: true }, sendResponse, deps);

    expect(deps.saveState).toHaveBeenCalledWith(expect.objectContaining({
      entries: previousState.entries,
      updatedAt: 500,
      serverResults: [
        expect.objectContaining({ serverId: 'main', success: false, error: '连接失败 (500)' }),
      ],
    }));
    expect(sendResponse).toHaveBeenCalledWith({ success: false, synced: 0, failed: 1 });
  });

  it('times out stalled media server requests and keeps the previous index', async () => {
    vi.useFakeTimers();
    try {
      const sendResponse = vi.fn();
      const fetchImpl = createFetchMock((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
      }));
      const previousState: EmbyLibraryState = {
        entries: {
          'ABC-104': [{
            serverType: 'emby',
            serverName: 'Main',
            serverUrl: 'http://media.local:8096',
            itemId: 'old-item',
            itemName: 'ABC-104',
            updatedAt: 500,
          }],
        },
        updatedAt: 500,
      };
      const deps = createDeps(fetchImpl, previousState);

      const syncPromise = handleEmbyLibrarySync({ manual: true }, sendResponse, deps);
      await vi.advanceTimersByTimeAsync(15000);
      await syncPromise;

      expect(deps.saveState).toHaveBeenCalledWith(expect.objectContaining({
        entries: previousState.entries,
        updatedAt: 500,
        serverResults: [
          expect.objectContaining({ success: false, error: '连接超时' }),
        ],
      }));
      expect(sendResponse).toHaveBeenCalledWith({ success: false, synced: 0, failed: 1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('replaces previous entries for the same server URL after a server is renamed', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = createFetchMock(async () => new Response(JSON.stringify({
      Items: [
        { Id: 'new-item', Name: 'ABC-105 Renamed Server Hit', Path: '/movies/ABC-105.mkv' },
      ],
    }), { status: 200 }));
    const previousState: EmbyLibraryState = {
      entries: {
        'ABC-105': [{
          serverType: 'emby',
          serverName: 'Old Name',
          serverUrl: 'http://media.local:8096',
          itemId: 'old-item',
          itemName: 'ABC-105',
          updatedAt: 500,
        }],
      },
      updatedAt: 500,
    };
    const deps = createDeps(fetchImpl, previousState);

    await handleEmbyLibrarySync({ manual: true }, sendResponse, deps);

    const savedState = deps.saveState.mock.calls[0][0] as EmbyLibraryState;
    expect(savedState.entries['ABC-105']).toHaveLength(1);
    expect(savedState.entries['ABC-105'][0]).toMatchObject({
      serverName: 'Main',
      itemId: 'new-item',
    });
  });

  it('checks duplicate codes once with search variants and filters noisy server results', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = createFetchMock(async (input: RequestInfo | URL) => {
      const searchTerm = new URL(String(input)).searchParams.get('SearchTerm');
      const itemsByTerm: Record<string, unknown[]> = {
        'ABC-201': [
          { Id: 'item-201', Name: 'ABC-201 Search Hit', Path: '/movies/ABC-201.mkv' },
          { Id: 'noise-999', Name: 'ABC-999 Noisy Hit', Path: '/movies/ABC-999.mkv' },
        ],
        ABC201: [
          { Id: 'item-201', Name: 'ABC-201 Search Hit', Path: '/movies/ABC-201.mkv' },
          { Id: 'item-201-compact', Name: 'ABC201 Compact Hit', Path: '/movies/ABC201.mkv' },
        ],
      };

      return new Response(JSON.stringify({
        Items: itemsByTerm[searchTerm || ''] || [],
      }), { status: 200 });
    });
    const deps = createDeps(fetchImpl);

    await handleEmbyLibraryCheckCodes({ codes: ['abc-201', 'ABC_201'] }, sendResponse, deps);

    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(fetchImpl.mock.calls.map(([url]) => new URL(String(url)).searchParams.get('SearchTerm'))).toEqual([
      'ABC-201',
      'ABC201',
      'ABC_201',
      'abc-201',
      'abc201',
      'abc_201',
    ]);
    expect(deps.saveState).toHaveBeenCalledWith(expect.objectContaining({
      entries: expect.objectContaining({
        'ABC-201': [
          expect.objectContaining({ itemId: 'item-201' }),
          expect.objectContaining({ itemId: 'item-201-compact' }),
        ],
      }),
    }));
    const savedState = deps.saveState.mock.calls[0][0] as EmbyLibraryState;
    expect(savedState.entries['ABC-201'].map((entry) => entry.itemId)).toEqual([
      'item-201',
      'item-201-compact',
    ]);
    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      checked: 1,
      matches: {
        'ABC-201': [
          expect.objectContaining({ itemId: 'item-201' }),
          expect.objectContaining({ itemId: 'item-201-compact' }),
        ],
      },
    }));
  });

  it('keeps the full sync timestamp when realtime checks update entries', async () => {
    const sendResponse = vi.fn();
    const fetchImpl = createFetchMock(async () => new Response(JSON.stringify({
      Items: [
        { Id: 'item-202', Name: 'ABC-202 Search Hit', Path: '/movies/ABC-202.mkv' },
      ],
    }), { status: 200 }));
    const previousState: EmbyLibraryState = {
      entries: {},
      updatedAt: 500,
    };
    const deps = createDeps(fetchImpl, previousState);

    await handleEmbyLibraryCheckCodes({ codes: ['ABC-202'] }, sendResponse, deps);

    expect(deps.saveState).toHaveBeenCalledWith(expect.objectContaining({
      entries: expect.objectContaining({
        'ABC-202': [
          expect.objectContaining({ itemId: 'item-202', updatedAt: 1000 }),
        ],
      }),
      updatedAt: 500,
    }));
  });
});
