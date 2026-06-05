import { describe, expect, it, vi } from 'vitest';
import type { ActorRecord } from '../../src/types';
import { refreshActorMetadataWorkflow } from '../../src/dashboard/tabs/actors/metadataRefreshWorkflow';

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Old Name',
    aliases: ['Old Alias'],
    gender: 'female',
    category: 'censored',
    profileUrl: 'https://javdb.com/actors/actor-1',
    avatarUrl: 'https://img.example.com/old.jpg',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function html() {
  return `
    <section class="actor-section">
      <div class="actor-section-name">New Name, New Alias 共 12 部影片</div>
      <img src="https://img.example.com/new.jpg">
    </section>
    <div class="panel-block">
      <span class="tag">男優</span>
      <span class="tag">无码</span>
    </div>
  `;
}

function response(overrides: Partial<Response> = {}): Pick<Response, 'ok' | 'status' | 'statusText' | 'text'> {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: vi.fn(async () => html()),
    ...overrides,
  };
}

function deps(overrides: Partial<Parameters<typeof refreshActorMetadataWorkflow>[1]> = {}) {
  return {
    getActorById: vi.fn(async () => actor()),
    buildActorUrl: vi.fn(async () => 'https://javdb.com/actors/actor-1'),
    fetchActorPage: vi.fn(async () => response()),
    getActorRemarks: vi.fn(async () => ({
      name: 'New Name',
      age: 26,
      heightCm: 160,
      cup: 'D',
      retired: false,
      ig: 'https://instagram.com/example',
      tw: 'https://x.com/example',
      wikiUrl: 'https://ja.wikipedia.org/wiki/New_Name',
      xslistUrl: 'https://xslist.org/person/example',
      source: 'wikipedia' as const,
      fetchedAt: 123,
    })),
    saveActor: vi.fn(async () => undefined),
    reloadActors: vi.fn(async () => undefined),
    refreshStats: vi.fn(async () => undefined),
    dispatchDataUpdated: vi.fn(),
    log: vi.fn(),
    ...overrides,
  };
}

describe('actor metadata refresh workflow', () => {
  it('refreshes profile, merges aliases, saves wiki data and updates UI hooks', async () => {
    const runtimeDeps = deps();

    const result = await refreshActorMetadataWorkflow('actor-1', runtimeDeps);

    expect(runtimeDeps.buildActorUrl).toHaveBeenCalledWith('/actors/actor-1');
    expect(runtimeDeps.fetchActorPage).toHaveBeenCalledWith('https://javdb.com/actors/actor-1');
    expect(runtimeDeps.getActorRemarks).toHaveBeenCalledWith('New Name');
    expect(runtimeDeps.saveActor).toHaveBeenCalledWith(expect.objectContaining({
      id: 'actor-1',
      name: 'New Name',
      aliases: ['Old Alias', 'New Alias'],
      avatarUrl: 'https://img.example.com/new.jpg',
      gender: 'male',
      category: 'uncensored',
      wikiData: expect.objectContaining({
        age: 26,
        heightCm: 160,
        cup: 'D',
        source: 'wikipedia',
      }),
    }));
    expect(runtimeDeps.reloadActors).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.refreshStats).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.dispatchDataUpdated).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.changes.nameChanged).toBe(true);
    expect(result.wikiData?.age).toBe(26);
  });

  it('throws when actor is missing before fetching remote page', async () => {
    const runtimeDeps = deps({
      getActorById: vi.fn(async () => undefined),
    });

    await expect(refreshActorMetadataWorkflow('missing', runtimeDeps)).rejects.toThrow('演员不存在');
    expect(runtimeDeps.fetchActorPage).not.toHaveBeenCalled();
  });

  it('throws http status errors from actor page fetch', async () => {
    const runtimeDeps = deps({
      fetchActorPage: vi.fn(async () => response({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })),
    });

    await expect(refreshActorMetadataWorkflow('actor-1', runtimeDeps)).rejects.toThrow('HTTP 404: Not Found');
    expect(runtimeDeps.saveActor).not.toHaveBeenCalled();
  });

  it('continues saving parsed profile when wiki lookup fails', async () => {
    const runtimeDeps = deps({
      getActorRemarks: vi.fn(async () => {
        throw new Error('wiki failed');
      }),
    });

    const result = await refreshActorMetadataWorkflow('actor-1', runtimeDeps);

    expect(runtimeDeps.saveActor).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Name',
      wikiData: undefined,
    }));
    expect(runtimeDeps.log).toHaveBeenCalledWith('WARN', 'Wiki数据获取出错', expect.any(Object));
    expect(result.wikiData).toBeUndefined();
  });

  it('keeps wiki lookup failure details when remarks diagnostics report source errors', async () => {
    const runtimeDeps = deps({
      getActorRemarks: vi.fn(async () => ({
        data: null,
        failures: [
          { source: 'wikipedia', message: 'HTTP 404', statusCode: 404, url: 'https://ja.wikipedia.org/wiki/New_Name' },
          { source: 'xslist', message: 'HTTP 403', statusCode: 403, url: 'https://xslist.org/search?query=New%20Name&lg=zh', reason: 'cloudflare_challenge' },
        ],
      } as any)),
    });

    const result = await refreshActorMetadataWorkflow('actor-1', runtimeDeps);

    expect(result.success).toBe(true);
    expect(result.wikiData).toBeUndefined();
    expect(result.wikiFailures).toEqual([
      { source: 'wikipedia', message: 'HTTP 404', statusCode: 404, url: 'https://ja.wikipedia.org/wiki/New_Name' },
      { source: 'xslist', message: 'HTTP 403', statusCode: 403, url: 'https://xslist.org/search?query=New%20Name&lg=zh', reason: 'cloudflare_challenge' },
    ]);
    expect(runtimeDeps.saveActor).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Name',
      wikiData: undefined,
    }));
  });
});
