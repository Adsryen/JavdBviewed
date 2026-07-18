/**
 * @file abDeviceMerge.scenario.test.ts
 * @description 验证 A 全量上云后 B 子集设备接入的合并语义（不连真实网络）
 *
 * 场景：
 * - A：本地大库，已推到 Cloud
 * - B：本地较小子集（与 A 有交集 + 自有条目），首次同步
 *
 * 期望：
 * - B 不会因「云更大」而丢掉仅存在于 B 的本地条目
 * - B 会得到 A 独有的云端条目
 * - 同 id 冲突时 LWW 保留 revision 更高者（不整库替换）
 * - applyRemote 使用 bulkPut 语义，不是 clear-all
 */
import { describe, expect, it } from 'vitest';
import type { SyncEntity } from '@javdb/sync-protocol';
import { createApiClient } from './apiClient';
import { createMemoryTokenStore } from './memoryTokenStore';
import { createMockCloudTransport } from './mockTransport';
import {
  createMemoryCursorStore,
  createSyncEngine,
  type LocalEntityStore,
} from './syncEngine';
import { mergeEntityBatches } from './conflictPolicy';

function ent(
  type: string,
  id: string,
  revision: number,
  payload: Record<string, unknown>,
  updatedAt = revision * 10,
): SyncEntity {
  return { id, type, revision, updatedAt, payload: { id, ...payload } };
}

/** 模拟扩展本地库：Map 存储 + pending；applyRemote 只 put，从不 clear */
function createSimLocalStore(seed: SyncEntity[] = []): LocalEntityStore & {
  dump(): SyncEntity[];
  ids(type: string): string[];
  enqueueAll(list: SyncEntity[]): void;
} {
  const map = new Map<string, SyncEntity>();
  let pending: SyncEntity[] = [];
  const key = (e: SyncEntity) => `${e.type}\0${e.id}`;
  for (const e of seed) map.set(key(e), e);

  return {
    async listAll() {
      return [...map.values()];
    },
    async applyRemote(entities) {
      // 与 extensionEntityStore 一致：按条 put，不删未出现在 batch 中的本地 id
      for (const e of entities) {
        map.set(key(e), e);
      }
    },
    async listPending() {
      return [...pending];
    },
    async clearPending(keys) {
      const drop = new Set(keys.map((k) => `${k.type}\0${k.id}`));
      pending = pending.filter((e) => !drop.has(key(e)));
    },
    dump() {
      return [...map.values()];
    },
    ids(type: string) {
      return [...map.values()].filter((e) => e.type === type).map((e) => e.id).sort();
    },
    enqueueAll(list: SyncEntity[]) {
      // 首次 pending 为空时入队全量（ensureInitialPending）
      if (pending.length === 0) pending = [...list];
    },
  };
}

describe('A-full then B-subset device join', () => {
  it('merges without deleting B-only locals; B gains A-only from cloud', async () => {
    const { transport } = createMockCloudTransport();

    // --- A: large set ---
    const aLocal = [
      ent('video', 'SHARED-1', 1, { status: 'viewed', note: 'from-A' }),
      ent('video', 'A-ONLY-1', 1, { status: 'want' }),
      ent('video', 'A-ONLY-2', 1, { status: 'browsed' }),
      ent('actor', 'ACTOR-A', 1, { name: 'onlyA' }),
      ent('list', 'LIST-SHARED', 1, { name: 'shared-list' }),
    ];
    const storeA = createSimLocalStore(aLocal);
    storeA.enqueueAll(aLocal);

    const tokensA = createMemoryTokenStore();
    const apiA = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensA });
    await apiA.register({ identifier: 'user@t', password: 'p' });
    await apiA.login({
      identifier: 'user@t',
      password: 'p',
      device: { id: 'device-A', label: 'A', clientType: 'extension' },
    });

    const engineA = createSyncEngine({
      api: apiA,
      local: storeA,
      cursors: createMemoryCursorStore(),
    });
    const resA = await engineA.syncSession('device-A');
    expect(resA.pushed).toBe(aLocal.length);
    expect(resA.response.stats.uploaded).toBe(aLocal.length);
    expect(resA.response.code).toBe('SYNC_OK');

    // --- B: subset + B-only ---
    const bLocal = [
      // 与 A 同 id，但本地状态不同、revision 仍为 1（首装典型：本地 revision 占位）
      ent('video', 'SHARED-1', 1, { status: 'want', note: 'from-B-local' }, 5),
      ent('video', 'B-ONLY-1', 1, { status: 'viewed' }),
      ent('actor', 'ACTOR-B', 1, { name: 'onlyB' }),
      ent('list', 'LIST-SHARED', 1, { name: 'b-version-name' }, 5),
    ];
    const storeB = createSimLocalStore(bLocal);
    // 首次同步：pending 空 → 全量入队（与 ensureInitialPending 一致）
    storeB.enqueueAll(bLocal);
    const bIdsBefore = {
      video: storeB.ids('video'),
      actor: storeB.ids('actor'),
      list: storeB.ids('list'),
    };
    expect(bIdsBefore.video).toEqual(['B-ONLY-1', 'SHARED-1']);

    const tokensB = createMemoryTokenStore();
    const apiB = createApiClient({ baseUrl: 'http://mock', transport, tokens: tokensB });
    await apiB.login({
      identifier: 'user@t',
      password: 'p',
      device: { id: 'device-B', label: 'B', clientType: 'extension' },
    });

    const engineB = createSyncEngine({
      api: apiB,
      local: storeB,
      cursors: createMemoryCursorStore(),
    });
    const resB = await engineB.syncSession('device-B');

    // B 应从云拉到 A 推上去的数据（服务端 stats 权威）
    expect(resB.response.stats.downloaded).toBeGreaterThan(0);
    expect(resB.pulled).toBe(resB.response.stats.downloaded);
    expect(resB.response.message).toBeTruthy();

    const after = storeB.dump();
    const videoIds = storeB.ids('video');
    const actorIds = storeB.ids('actor');

    // B 独有条目必须还在
    expect(videoIds).toContain('B-ONLY-1');
    expect(actorIds).toContain('ACTOR-B');

    // A 独有应从云合并进来
    expect(videoIds).toContain('A-ONLY-1');
    expect(videoIds).toContain('A-ONLY-2');
    expect(actorIds).toContain('ACTOR-A');

    // 共享 id 仍在（不会被删）
    expect(videoIds).toContain('SHARED-1');
    expect(storeB.ids('list')).toContain('LIST-SHARED');

    // 本地条数只增不减（相对 B 原有 4 条 + A 独有）
    expect(after.length).toBeGreaterThanOrEqual(bLocal.length);
    expect(after.length).toBe(
      // SHARED-1, B-ONLY-1, A-ONLY-1, A-ONLY-2, ACTOR-A, ACTOR-B, LIST-SHARED
      7,
    );
  });

  it('mergeEntityBatches keeps local-only and remote-only keys (union)', () => {
    const local = [
      ent('video', 'L1', 1, { s: 'L' }),
      ent('video', 'S', 2, { s: 'L-newer-rev' }),
    ];
    const remote = [
      ent('video', 'R1', 1, { s: 'R' }),
      ent('video', 'S', 1, { s: 'R-older-rev' }),
    ];
    const merged = mergeEntityBatches(local, remote);
    const ids = merged.map((e) => e.id).sort();
    expect(ids).toEqual(['L1', 'R1', 'S']);
    const s = merged.find((e) => e.id === 'S')!;
    // higher revision wins
    expect(s.revision).toBe(2);
    expect((s.payload as { s: string }).s).toBe('L-newer-rev');
  });

  it('document applyRemote put-not-clear: writing subset does not remove other locals', async () => {
    const store = createSimLocalStore([
      ent('video', 'KEEP', 1, {}),
      ent('video', 'ALSO', 1, {}),
    ]);
    // 模拟 pull 合并结果里只有 KEEP 被更新（真实 merge 会带上全部；这里测 put 语义）
    await store.applyRemote([ent('video', 'KEEP', 2, { status: 'viewed' })]);
    expect(store.ids('video')).toEqual(['ALSO', 'KEEP']);
    expect(store.dump().find((e) => e.id === 'KEEP')?.revision).toBe(2);
  });
});
