import { describe, expect, it } from 'vitest';
import {
  buildLibraryIndex,
  buildMediaItemCoverImageUrl,
  buildMediaItemUrl,
  findLibraryMatches,
  generateVideoCodeSearchTerms,
  normalizeVideoCode,
} from './libraryIndex';
import type { EmbyMediaServer } from '../types';

const embyServer: EmbyMediaServer = {
  id: 'emby-main',
  type: 'emby',
  name: 'Main Emby',
  url: 'http://192.168.1.10:8096/',
  apiKey: 'secret',
  enabled: true,
};

const jellyfinServer: EmbyMediaServer = {
  id: 'jf-main',
  type: 'jellyfin',
  name: 'Main Jellyfin',
  url: 'http://192.168.1.11:8096',
  apiKey: 'secret',
  enabled: true,
};

describe('emby library index', () => {
  it('generates conservative search terms for common code variants', () => {
    expect(generateVideoCodeSearchTerms('ABC-123')).toEqual([
      'ABC-123',
      'ABC123',
      'ABC_123',
      'abc-123',
      'abc123',
      'abc_123',
    ]);
    expect(generateVideoCodeSearchTerms('abc_123')).toEqual([
      'ABC-123',
      'ABC123',
      'ABC_123',
      'abc-123',
      'abc123',
      'abc_123',
    ]);
    expect(generateVideoCodeSearchTerms('FC2-PPV-123456')).toEqual([
      'FC2-PPV-123456',
      'FC2PPV123456',
      'FC2_PPV_123456',
      'fc2-ppv-123456',
      'fc2ppv123456',
      'fc2_ppv_123456',
    ]);
  });

  it('normalizes video codes from media item names and paths', () => {
    expect(normalizeVideoCode('abc_001')).toBe('ABC-001');
    expect(normalizeVideoCode('FC2-PPV-123456')).toBe('FC2-PPV-123456');

    const index = buildLibraryIndex(embyServer, [
      { Id: '1', Name: 'ABC-001 Sample Title', Path: '/media/other.mkv' },
      { Id: '2', Name: 'No code title', Path: '/media/fc2-ppv-123456.mp4' },
      { Id: '3', Name: 'ignored title', Path: '' },
    ]);

    expect(Object.keys(index.entries)).toEqual(['ABC-001', 'FC2-PPV-123456']);
    expect(index.entries['ABC-001'][0]).toMatchObject({
      serverType: 'emby',
      serverName: 'Main Emby',
      itemId: '1',
      itemName: 'ABC-001 Sample Title',
    });
  });

  it('keeps Emby and Jellyfin matches separated for the same code', () => {
    const embyIndex = buildLibraryIndex(embyServer, [
      { Id: 'emby-item', Name: 'ABC-002', Path: '/emby/ABC-002.mkv' },
    ]);
    const jellyfinIndex = buildLibraryIndex(jellyfinServer, [
      { Id: 'jf-item', Name: 'ABC_002', Path: '/jellyfin/ABC_002.mkv' },
    ]);

    const matches = findLibraryMatches({
      entries: {
        ...embyIndex.entries,
        'ABC-002': [
          ...embyIndex.entries['ABC-002'],
          ...jellyfinIndex.entries['ABC-002'],
        ],
      },
      updatedAt: 100,
    }, 'abc-002');

    expect(matches.map((match) => `${match.serverType}:${match.itemId}`)).toEqual([
      'emby:emby-item',
      'jellyfin:jf-item',
    ]);
  });

  it('builds media item links without leaking api keys', () => {
    const url = buildMediaItemUrl({
      serverType: 'emby',
      serverName: 'Main Emby',
      serverUrl: 'http://192.168.1.10:8096/',
      itemId: 'abc123',
      serverId: 'emby-server',
      itemName: 'ABC-003',
      updatedAt: 123,
    });

    expect(url).toBe('http://192.168.1.10:8096/web/index.html#!/item?id=abc123&serverId=emby-server');
    expect(url).not.toContain('secret');
  });

  it('builds token-free cover image URLs from primary image metadata', () => {
    const url = buildMediaItemCoverImageUrl(embyServer, {
      Id: 'item/with space',
      Name: 'ABC-003',
      PrimaryImageTag: 'primary-tag-1',
      ImageTags: { Primary: 'primary-tag-1' },
    });

    expect(url).toBe('http://192.168.1.10:8096/Items/item%2Fwith%20space/Images/Primary?tag=primary-tag-1');
    expect(url).not.toContain('api_key');
    expect(url).not.toContain(embyServer.apiKey);
    expect(buildMediaItemCoverImageUrl(embyServer, { Id: 'item-no-image', Name: 'ABC-003' })).toBeUndefined();
  });

  it('stores optional cover URLs in library index entries', () => {
    const index = buildLibraryIndex(embyServer, [
      {
        Id: 'cover-item',
        Name: 'ABC-004 Cover Hit',
        Path: '/media/ABC-004.mkv',
        ImageTags: { Primary: 'cover-tag' },
      },
    ], 123);

    expect(index.entries['ABC-004'][0]).toMatchObject({
      itemId: 'cover-item',
      coverImageUrl: 'http://192.168.1.10:8096/Items/cover-item/Images/Primary?tag=cover-tag',
    });
    expect(JSON.stringify(index)).not.toContain(embyServer.apiKey);
  });

  it('builds Jellyfin media item links with the details route and server id', () => {
    const index = buildLibraryIndex(jellyfinServer, [
      { Id: 'jf item/301', ServerId: 'jf-server-1', Name: 'ABC-301 Sample' },
    ], 123);

    const entry = index.entries['ABC-301'][0];

    expect(entry.serverId).toBe('jf-server-1');
    expect(buildMediaItemUrl(entry)).toBe(
      'http://192.168.1.11:8096/web/index.html#!/details?id=jf%20item%2F301&serverId=jf-server-1',
    );
  });
});
