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
