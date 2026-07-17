/**
 * @file mediaLibraryIndexAdapter.test.ts
 * @description 媒体库索引适配器测试
 * @module apps/dashboard/pages/media
 */
import { describe, expect, it } from 'vitest';
import type { EmbyLibraryState } from '../../../../features/embyLibrary/types';
import {
  buildServerOpenUrl,
  buildServerPlayUrl,
  hasLibraryIndex,
  hueFromCode,
  mapLibraryStateToBrowseItems,
  mergeLocalWatchEvidence,
} from './mediaLibraryIndexAdapter';

describe('mediaLibraryIndexAdapter', () => {
  it('maps library state entries to browse items', () => {
    const state: EmbyLibraryState = {
      updatedAt: 1,
      entries: {
        'ABC-123': [
          {
            serverType: 'emby',
            serverName: 'Home',
            serverUrl: 'http://emby.local',
            itemId: '1',
            itemName: 'Sample Title',
            coverImageUrl: 'http://emby.local/Items/1/Images/Primary',
            serverId: 'srv1',
            userData: {
              played: false,
              positionTicks: 10,
              runtimeTicks: 100,
              percent: 37,
              lastPlayedAt: 0,
            },
            updatedAt: 1,
          },
        ],
        'XYZ-9': [
          {
            serverType: 'jellyfin',
            serverName: 'JF',
            serverUrl: 'http://jf.local',
            itemId: '2',
            itemName: 'Other',
            userData: {
              played: true,
              positionTicks: 0,
              runtimeTicks: 0,
              percent: 100,
              lastPlayedAt: 1,
            },
            updatedAt: 1,
          },
        ],
      },
    };

    const items = mapLibraryStateToBrowseItems(state);
    expect(items).toHaveLength(2);
    expect(items[0].code).toBe('ABC-123');
    expect(items[0].source).toBe('emby');
    expect(items[0].coverImageUrl).toContain('Primary');
    expect(items[0].serverId).toBe('srv1');
    expect(items[0].watchState).toBe('in_progress');
    expect(items[1].source).toBe('jellyfin');
    expect(items[1].watchState).toBe('watched');
    expect(hasLibraryIndex(state)).toBe(true);
    expect(hasLibraryIndex({ entries: {}, updatedAt: 0 })).toBe(false);
  });

  it('builds server web open url for indexed items', () => {
    const url = buildServerOpenUrl({
      source: 'emby',
      serverUrl: 'http://emby.local/',
      itemId: '42',
      serverId: 'abc',
    });
    expect(url).toContain('/web/index.html#!/item?id=42');
    expect(url).toContain('serverId=abc');
    expect(buildServerOpenUrl({ source: '115', serverUrl: 'x', itemId: '1' } as any)).toBeNull();

    const play = buildServerPlayUrl({
      source: 'emby',
      serverUrl: 'http://emby.local/',
      itemId: '42',
      serverId: 'abc',
    });
    // 外链回退为详情；真正播放由 EMBY_LIBRARY_RESOLVE_STREAM 取直链
    expect(play).toContain('#!/item?id=42');
    expect(play).toContain('serverId=abc');
  });

  it('produces stable hue for a code', () => {
    expect(hueFromCode('ABC-123')).toBe(hueFromCode('ABC-123'));
    expect(hueFromCode('ABC-123')).toBeGreaterThanOrEqual(0);
    expect(hueFromCode('ABC-123')).toBeLessThan(360);
  });

  it('merges local 115 evidence into watch state', () => {
    const items = mapLibraryStateToBrowseItems({
      updatedAt: 1,
      entries: {
        'ABC-1': [
          {
            serverType: 'emby',
            serverName: 'H',
            serverUrl: 'http://e',
            itemId: '1',
            itemName: 't',
            updatedAt: 1,
          },
        ],
      },
    });
    const merged = mergeLocalWatchEvidence(items, {
      'ABC-1': {
        source: 'drive115',
        percent: 95,
        watched: true,
        lastPlayedAt: 9,
      },
    });
    expect(merged[0].watchState).toBe('watched');
    expect(merged[0].userData?.percent).toBe(95);
  });
});
