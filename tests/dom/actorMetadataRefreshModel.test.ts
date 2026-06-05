import { describe, expect, it } from 'vitest';
import type { ActorRecord } from '../../src/types';
import {
  buildRefreshedActorRecord,
  buildActorMetadataRefreshToast,
  parseActorProfileHtml,
  sanitizeActorProfileHtml,
} from '../../src/dashboard/tabs/actors/metadataRefreshModel';

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Old Name',
    aliases: ['Old Alias'],
    gender: 'female',
    category: 'censored',
    avatarUrl: 'https://example.com/old.jpg',
    profileUrl: 'https://javdb.com/actors/actor-1',
    createdAt: 1,
    updatedAt: 10,
    syncInfo: { source: 'javdb', lastSyncAt: 9, syncStatus: 'success' },
    wikiData: { age: 20, source: 'wikipedia' },
    ...overrides,
  };
}

describe('actor metadata refresh model', () => {
  it('sanitizes external resource tags before DOM parsing', () => {
    const html = '<link rel="stylesheet"><script src="/x.js"></script><script>window.bad = true</script><div>ok</div>';

    expect(sanitizeActorProfileHtml(html)).toBe('<div>ok</div>');
  });

  it('parses actor profile html using existing JavDB selectors and cleanup rules', () => {
    const parsed = parseActorProfileHtml(
      `
        <div class="actor-section">
          <img src="https://example.com/new.jpg">
        </div>
        <h1 class="actor-section-name">New Name, Alias One，Alias Two 共 12 部影片</h1>
        <div class="panel-block">
          <span class="tag">男優</span>
          <span class="tag">无码</span>
        </div>
      `,
      actor(),
    );

    expect(parsed).toEqual({
      name: 'New Name',
      aliases: ['Alias One', 'Alias Two'],
      avatarUrl: 'https://example.com/new.jpg',
      gender: 'male',
      category: 'uncensored',
    });
  });

  it('falls back to actor id, current avatar and current category when page data is sparse', () => {
    const parsed = parseActorProfileHtml('<div class="panel-block"><span class="tag">普通</span></div>', actor());

    expect(parsed).toEqual({
      name: 'actor-1',
      aliases: [],
      avatarUrl: 'https://example.com/old.jpg',
      gender: 'female',
      category: 'censored',
    });
  });

  it('builds refreshed actor record, change summary and merged aliases', () => {
    const wikiData = {
      age: 26,
      heightCm: 165,
      cup: 'D',
      retired: false,
      ig: 'https://instagram.example/a',
      source: 'xslist' as const,
      fetchedAt: 123,
    };
    const result = buildRefreshedActorRecord(
      actor(),
      {
        name: 'New Name',
        aliases: ['Old Alias', 'New Alias'],
        avatarUrl: 'https://example.com/new.jpg',
        gender: 'male',
        category: 'uncensored',
      },
      wikiData,
      999,
    );

    expect(result.changes).toEqual({
      nameChanged: true,
      oldName: 'Old Name',
      newName: 'New Name',
      avatarChanged: true,
      genderChanged: true,
      oldGender: 'female',
      newGender: 'male',
      categoryChanged: true,
      oldCategory: 'censored',
      newCategory: 'uncensored',
    });
    expect(result.updatedActor).toMatchObject({
      name: 'New Name',
      aliases: ['Old Alias', 'New Alias'],
      avatarUrl: 'https://example.com/new.jpg',
      gender: 'male',
      category: 'uncensored',
      updatedAt: 999,
      syncInfo: {
        source: 'javdb',
        lastSyncAt: 999,
        syncStatus: 'success',
      },
      wikiData,
    });
  });

  it('shows actor wiki fetch failures in the refresh toast', () => {
    const toast = buildActorMetadataRefreshToast({
      success: true,
      changes: {
        nameChanged: false,
        avatarChanged: false,
        genderChanged: false,
        categoryChanged: false,
      },
      wikiFailures: [
        { source: 'wikipedia', message: 'HTTP 404', statusCode: 404 },
        { source: 'xslist', message: 'HTTP 403', statusCode: 403, reason: 'cloudflare_challenge' },
      ],
    });

    expect(toast.type).toBe('warning');
    expect(toast.message).toContain('📚 Wiki数据: 获取失败');
    expect(toast.message).toContain('Wikipedia: HTTP 404');
    expect(toast.message).toContain('xslist: HTTP 403（Cloudflare challenge）');
  });
});
