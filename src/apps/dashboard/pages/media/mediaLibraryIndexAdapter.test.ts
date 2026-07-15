/**
 * @file mediaLibraryIndexAdapter.test.ts
 * @description 媒体库索引适配器测试
 * @module apps/dashboard/pages/media
 */
import { describe, expect, it } from 'vitest';
import type { EmbyLibraryState } from '../../../../features/embyLibrary/types';
import {
  buildServerOpenUrl,
  hasLibraryIndex,
  hueFromCode,
  mapLibraryStateToBrowseItems,
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
    expect(items[1].source).toBe('jellyfin');
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
  });

  it('produces stable hue for a code', () => {
    expect(hueFromCode('ABC-123')).toBe(hueFromCode('ABC-123'));
    expect(hueFromCode('ABC-123')).toBeGreaterThanOrEqual(0);
    expect(hueFromCode('ABC-123')).toBeLessThan(360);
  });
});
