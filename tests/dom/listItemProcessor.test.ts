import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STATE } from '../../src/features/contentState';
import { VIDEO_STATUS } from '../../src/utils/config';
import type { VideoRecord } from '../../src/types';
import { processVisibleItems } from '../../src/features/listEnhancement/content/itemProcessor';

vi.mock('../../src/features/videoDetail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/videoDetail')>();
  return {
    ...actual,
    isPageProperlyLoaded: vi.fn(() => true),
  };
});

function createRecord(id: string, status: VideoRecord['status']): VideoRecord {
  return {
    id,
    title: `Title ${id}`,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function renderListItem(videoId: string, extraTitle = ''): HTMLElement {
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `
    <div class="video-title">
      <strong>${videoId}</strong>
      <span>${extraTitle}</span>
    </div>
    <div class="tags has-addons"></div>
  `;
  document.body.appendChild(item);
  return item;
}

describe('list item processor', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="movie-list"></div>';
    STATE.settings = {
      display: {
        hideViewed: false,
        hideBrowsed: false,
        hideWant: false,
        hideVR: false,
      },
      listEnhancement: {
        showStatusBadge: true,
      },
    } as any;
    STATE.records = {};
    STATE.isSearchPage = false;
    STATE.observer?.disconnect();
    STATE.observer = null;
    if (STATE.debounceTimer) {
      window.clearTimeout(STATE.debounceTimer);
      STATE.debounceTimer = null;
    }
  });

  afterEach(() => {
    STATE.observer?.disconnect();
    STATE.observer = null;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('adds a viewed status badge for known records', async () => {
    const list = document.querySelector('.movie-list')!;
    list.appendChild(renderListItem('ABC-001'));
    STATE.records = {
      'ABC-001': createRecord('ABC-001', VIDEO_STATUS.VIEWED),
    };

    processVisibleItems();

    const tag = document.querySelector('.custom-status-tag');
    expect(tag?.textContent).toBe('已观看');
    expect(tag?.className).toContain('is-success');
  });

  it('hides VR list items when the display setting is enabled', async () => {
    const list = document.querySelector('.movie-list')!;
    const item = renderListItem('ABC-002', 'Sample 【VR】');
    list.appendChild(item);
    (STATE.settings as any).display.hideVR = true;

    processVisibleItems();

    expect(item.style.display).toBe('none');
    expect(item.getAttribute('data-hidden-by-default')).toBe('true');
    expect(item.getAttribute('data-hide-reason')).toBe('VR');
  });

  it('hides records by status according to display settings', async () => {
    const list = document.querySelector('.movie-list')!;
    const item = renderListItem('ABC-003');
    list.appendChild(item);
    STATE.records = {
      'ABC-003': createRecord('ABC-003', VIDEO_STATUS.BROWSED),
    };
    (STATE.settings as any).display.hideBrowsed = true;

    processVisibleItems();

    expect(item.style.display).toBe('none');
    expect(item.getAttribute('data-hidden-by-default')).toBe('true');
    expect(item.getAttribute('data-hide-reason')).toBe('BROWSED');
  });

  it('adds Emby and Jellyfin library badges for indexed list items', async () => {
    const list = document.querySelector('.movie-list')!;
    list.appendChild(renderListItem('ABC-004'));
    (STATE.settings as any).emby = {
      mediaServers: [
        {
          id: 'emby-main',
          type: 'emby',
          name: 'Main Emby',
          url: 'http://emby.local:8096',
          apiKey: 'secret',
          enabled: true,
        },
        {
          id: 'jf-main',
          type: 'jellyfin',
          name: 'Main Jellyfin',
          url: 'http://jf.local:8096',
          apiKey: 'secret',
          enabled: true,
        },
      ],
      libraryStatus: {
        enabled: true,
        showOnList: true,
      },
    };
    (STATE as any).embyLibraryState = {
      entries: {
        'ABC-004': [
          {
            serverType: 'emby',
            serverName: 'Main Emby',
            serverUrl: 'http://emby.local:8096',
            itemId: 'emby-item',
            serverId: 'emby-server',
            itemName: 'ABC-004',
            updatedAt: 100,
          },
          {
            serverType: 'jellyfin',
            serverName: 'Main Jellyfin',
            serverUrl: 'http://jf.local:8096',
            itemId: 'jf-item',
            serverId: 'jf-server',
            itemName: 'ABC-004',
            updatedAt: 100,
          },
        ],
      },
      updatedAt: 100,
    };

    processVisibleItems();

    const badges = Array.from(document.querySelectorAll<HTMLAnchorElement>('.emby-library-status-tag'));
    expect(badges.map((badge) => badge.textContent)).toEqual(['Emby已入库', 'Jellyfin已入库']);
    expect(badges[0].href).toBe('http://emby.local:8096/web/index.html#!/item?id=emby-item&serverId=emby-server');
    expect(badges[1].href).toBe('http://jf.local:8096/web/index.html#!/details?id=jf-item&serverId=jf-server');
  });

  it('skips library badges when library status is disabled', async () => {
    const list = document.querySelector('.movie-list')!;
    list.appendChild(renderListItem('ABC-005'));
    (STATE.settings as any).emby = {
      libraryStatus: {
        enabled: false,
        showOnList: true,
      },
    };
    (STATE as any).embyLibraryState = {
      entries: {
        'ABC-005': [
          {
            serverType: 'emby',
            serverName: 'Main Emby',
            serverUrl: 'http://emby.local:8096',
            itemId: 'emby-item',
            itemName: 'ABC-005',
            updatedAt: 100,
          },
        ],
      },
      updatedAt: 100,
    };

    processVisibleItems();

    expect(document.querySelector('.emby-library-status-tag')).toBeNull();
  });
});
