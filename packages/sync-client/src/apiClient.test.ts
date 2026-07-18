/**
 * @file apiClient.test.ts
 */
import { describe, expect, it } from 'vitest';
import { createApiClient } from './apiClient';
import { createMemoryTokenStore } from './memoryTokenStore';
import { createMockCloudTransport } from './mockTransport';
import { createSyncEngine, createMemoryCursorStore, createMemoryLocalStore } from './syncEngine';
import type { SyncEntity } from '@javdb/sync-protocol';

describe('apiClient + mock cloud', () => {
  it('registers, logs in, lists devices', async () => {
    const { transport } = createMockCloudTransport();
    const tokens = createMemoryTokenStore();
    const api = createApiClient({
      baseUrl: 'http://mock.local',
      transport,
      tokens,
    });

    await api.register({ identifier: 'u@test', password: 'secret' });
    const login = await api.login({
      identifier: 'u@test',
      password: 'secret',
      device: {
        id: 'dev-1',
        label: 'Test',
        clientType: 'extension',
      },
    });
    expect(login.accessToken).toBeTruthy();
    expect(await tokens.getAccessToken()).toBe(login.accessToken);

    const devices = await api.listDevices();
    expect(devices).toHaveLength(1);
    expect(devices[0]?.id).toBe('dev-1');
  });
});

describe('syncEngine session (server-authoritative)', () => {
  it('syncSession applies server apply and reports stats.message', async () => {
    const { transport, state } = createMockCloudTransport();
    const tokensA = createMemoryTokenStore();
    const apiA = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensA });
    await apiA.register({ identifier: 's@t', password: 'p' });
    await apiA.login({
      identifier: 's@t',
      password: 'p',
      device: { id: 'd1', label: 'A', clientType: 'extension' },
    });

    const video: SyncEntity = {
      id: 'v-session',
      type: 'video',
      revision: 1,
      updatedAt: 100,
      payload: { status: 'viewed' },
    };

    const localA = createMemoryLocalStore([video]) as ReturnType<typeof createMemoryLocalStore> & {
      enqueuePending: (e: SyncEntity) => Promise<void>;
    };
    await localA.enqueuePending(video);

    const engineA = createSyncEngine({
      api: apiA,
      local: localA,
      cursors: createMemoryCursorStore(),
    });
    const resultA = await engineA.syncSession('d1');
    expect(resultA.response.stats.uploaded).toBe(1);
    expect(resultA.pushed).toBe(1);
    expect(resultA.response.message).toMatch(/同步/);
    expect(state.entities.size).toBe(1);
    // accepted pending cleared
    expect(await localA.listPending()).toHaveLength(0);

    const tokensB = createMemoryTokenStore();
    const apiB = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensB });
    await apiB.login({
      identifier: 's@t',
      password: 'p',
      device: { id: 'd2', label: 'B', clientType: 'extension' },
    });
    const localB = createMemoryLocalStore();
    const engineB = createSyncEngine({
      api: apiB,
      local: localB,
      cursors: createMemoryCursorStore(),
    });
    const resultB = await engineB.syncSession('d2');
    expect(resultB.response.stats.downloaded).toBeGreaterThanOrEqual(1);
    expect(resultB.response.code).toBeTruthy();
    const all = await localB.listAll();
    expect(all.some((e) => e.id === 'v-session' && e.type === 'video')).toBe(true);
  });

  it('syncSession empty pending yields SYNC_EMPTY and does not wipe local', async () => {
    const { transport } = createMockCloudTransport();
    const tokens = createMemoryTokenStore();
    const api = createApiClient({ baseUrl: 'http://mock', transport, tokens });
    await api.register({ identifier: 'e@t', password: 'p' });
    await api.login({
      identifier: 'e@t',
      password: 'p',
      device: { id: 'de', label: 'E', clientType: 'extension' },
    });
    const keep: SyncEntity = {
      id: 'keep-local',
      type: 'video',
      revision: 1,
      updatedAt: 1,
      payload: { status: 'viewed' },
    };
    const local = createMemoryLocalStore([keep]);
    const engine = createSyncEngine({
      api,
      local,
      cursors: createMemoryCursorStore(),
    });
    const res = await engine.syncSession('de');
    expect(res.response.code).toBe('SYNC_EMPTY');
    expect(res.response.stats.uploaded).toBe(0);
    expect(res.response.stats.downloaded).toBe(0);
    const all = await local.listAll();
    expect(all.some((e) => e.id === 'keep-local')).toBe(true);
  });

  it('syncSession upsert apply does not remove local-only entities', async () => {
    const { transport } = createMockCloudTransport();
    const tokensA = createMemoryTokenStore();
    const apiA = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensA });
    await apiA.register({ identifier: 'u@t', password: 'p' });
    await apiA.login({
      identifier: 'u@t',
      password: 'p',
      device: { id: 'da', label: 'A', clientType: 'extension' },
    });
    const cloudOnly: SyncEntity = {
      id: 'cloud-1',
      type: 'video',
      revision: 1,
      updatedAt: 10,
      payload: { status: 'want' },
    };
    const localA = createMemoryLocalStore([cloudOnly]) as ReturnType<typeof createMemoryLocalStore> & {
      enqueuePending: (e: SyncEntity) => Promise<void>;
    };
    await localA.enqueuePending(cloudOnly);
    await createSyncEngine({
      api: apiA,
      local: localA,
      cursors: createMemoryCursorStore(),
    }).syncSession('da');

    const tokensB = createMemoryTokenStore();
    const apiB = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensB });
    await apiB.login({
      identifier: 'u@t',
      password: 'p',
      device: { id: 'db', label: 'B', clientType: 'extension' },
    });
    const localOnly: SyncEntity = {
      id: 'local-only',
      type: 'video',
      revision: 1,
      updatedAt: 1,
      payload: { status: 'viewed' },
    };
    const localB = createMemoryLocalStore([localOnly]);
    const res = await createSyncEngine({
      api: apiB,
      local: localB,
      cursors: createMemoryCursorStore(),
    }).syncSession('db');
    expect(res.response.stats.downloaded).toBeGreaterThanOrEqual(1);
    const ids = (await localB.listAll()).map((e) => e.id).sort();
    expect(ids).toContain('local-only');
    expect(ids).toContain('cloud-1');
  });

  it('syncSession keeps rejected items in pending', async () => {
    const { transport } = createMockCloudTransport();
    const tokens = createMemoryTokenStore();
    const api = createApiClient({ baseUrl: 'http://mock', transport, tokens });
    await api.register({ identifier: 'rej@t', password: 'p' });
    await api.login({
      identifier: 'rej@t',
      password: 'p',
      device: { id: 'dr', label: 'R', clientType: 'extension' },
    });

    const bad: SyncEntity = {
      id: '',
      type: 'video',
      revision: 1,
      updatedAt: 1,
      payload: { status: 'viewed' },
    };
    const good: SyncEntity = {
      id: 'good-1',
      type: 'video',
      revision: 1,
      updatedAt: 2,
      payload: { status: 'want' },
    };
    const local = createMemoryLocalStore() as ReturnType<typeof createMemoryLocalStore> & {
      enqueuePending: (e: SyncEntity) => Promise<void>;
    };
    await local.enqueuePending(bad);
    await local.enqueuePending(good);

    const res = await createSyncEngine({
      api,
      local,
      cursors: createMemoryCursorStore(),
    }).syncSession('dr');

    expect(res.response.stats.rejected).toBeGreaterThanOrEqual(1);
    expect(res.response.stats.uploaded).toBeGreaterThanOrEqual(1);
    expect(res.response.code).toBe('SYNC_PARTIAL');

    const pending = await local.listPending();
    // rejected (empty id) must remain; accepted good-1 cleared
    expect(pending.some((e) => e.id === '' && e.type === 'video')).toBe(true);
    expect(pending.some((e) => e.id === 'good-1')).toBe(false);
  });

  it('syncSession retries after 401 via refresh', async () => {
    const { transport } = createMockCloudTransport();
    const tokens = createMemoryTokenStore();
    let authFailures = 0;
    const api = createApiClient({
      baseUrl: 'http://mock',
      transport,
      tokens,
      onAuthFailure: () => {
        authFailures += 1;
      },
    });
    await api.register({ identifier: 'ref@t', password: 'p' });
    const login = await api.login({
      identifier: 'ref@t',
      password: 'p',
      device: { id: 'dref', label: 'Ref', clientType: 'extension' },
    });
    const refresh = await tokens.getRefreshToken();
    expect(refresh).toBeTruthy();

    // Corrupt access token; keep refresh so withAuthRetry can recover.
    await tokens.setTokens({
      accessToken: 'access_dead',
      refreshToken: refresh as string,
      userId: login.userId,
      deviceId: login.deviceId,
    });

    const video: SyncEntity = {
      id: 'after-refresh',
      type: 'video',
      revision: 1,
      updatedAt: 1,
      payload: { status: 'viewed' },
    };
    const local = createMemoryLocalStore([video]) as ReturnType<typeof createMemoryLocalStore> & {
      enqueuePending: (e: SyncEntity) => Promise<void>;
    };
    await local.enqueuePending(video);

    const res = await createSyncEngine({
      api,
      local,
      cursors: createMemoryCursorStore(),
    }).syncSession('dref');

    expect(res.response.stats.uploaded).toBe(1);
    expect(await tokens.getAccessToken()).not.toBe('access_dead');
    expect(authFailures).toBe(0);
    expect(await local.listPending()).toHaveLength(0);
  });

  it('syncSession surfaces auth failure when refresh is dead', async () => {
    const { transport } = createMockCloudTransport();
    const tokens = createMemoryTokenStore();
    let authFailures = 0;
    const api = createApiClient({
      baseUrl: 'http://mock',
      transport,
      tokens,
      onAuthFailure: () => {
        authFailures += 1;
      },
    });
    await api.register({ identifier: 'dead@t', password: 'p' });
    await api.login({
      identifier: 'dead@t',
      password: 'p',
      device: { id: 'ddead', label: 'D', clientType: 'extension' },
    });
    await tokens.setTokens({
      accessToken: 'access_dead',
      refreshToken: 'refresh_dead',
      userId: 'u',
      deviceId: 'ddead',
    });

    const local = createMemoryLocalStore();
    await expect(
      createSyncEngine({
        api,
        local,
        cursors: createMemoryCursorStore(),
      }).syncSession('ddead'),
    ).rejects.toBeTruthy();
    expect(authFailures).toBeGreaterThanOrEqual(1);
  });
});

describe('syncEngine', () => {
  it('pushes pending then pulls to another local store', async () => {
    const { transport, state } = createMockCloudTransport();
    const tokensA = createMemoryTokenStore();
    const apiA = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensA });
    await apiA.register({ identifier: 'a@t', password: 'p' });
    await apiA.login({
      identifier: 'a@t',
      password: 'p',
      device: { id: 'd1', label: 'A', clientType: 'extension' },
    });

    const video: SyncEntity = {
      id: 'v1',
      type: 'video',
      revision: 1,
      updatedAt: 100,
      payload: { status: 'viewed' },
    };

    const localA = createMemoryLocalStore([video]) as ReturnType<typeof createMemoryLocalStore> & {
      enqueuePending: (e: SyncEntity) => Promise<void>;
    };
    await localA.enqueuePending(video);

    const engineA = createSyncEngine({
      api: apiA,
      local: localA,
      cursors: createMemoryCursorStore(),
    });
    const resultA = await engineA.syncNow();
    expect(resultA.pushed).toBe(1);
    expect(state.entities.size).toBe(1);

    const tokensB = createMemoryTokenStore();
    const apiB = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensB });
    await apiB.login({
      identifier: 'a@t',
      password: 'p',
      device: { id: 'd2', label: 'B', clientType: 'extension' },
    });
    const localB = createMemoryLocalStore();
    const engineB = createSyncEngine({
      api: apiB,
      local: localB,
      cursors: createMemoryCursorStore(),
    });
    const resultB = await engineB.syncNow();
    expect(resultB.pulled).toBeGreaterThanOrEqual(1);
    const all = await localB.listAll();
    expect(all.some((e) => e.id === 'v1' && e.type === 'video')).toBe(true);
  });
});
