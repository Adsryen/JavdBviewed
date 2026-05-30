import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createListPreviewVideoElement,
  fetchListPreviewSources,
  getListPreviewSourceOrder,
} from '../../src/features/previews/listPreviewLoader';
import {
  parsePreviewCacheEntry,
} from '../../src/features/previews/previewSourceRules';

describe('list preview loader', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  it('orders preview sources by preferred source with auto fallback', () => {
    expect(getListPreviewSourceOrder('auto')).toEqual(['javdb', 'javspyl', 'avpreview', 'vbgfl']);
    expect(getListPreviewSourceOrder('vbgfl')).toEqual(['vbgfl', 'javdb', 'javspyl', 'avpreview']);
  });

  it('skips JavDB HLS previews on list pages and continues to MP4 sources', async () => {
    const sources = await fetchListPreviewSources(
      { code: 'ABP-001', title: 'title', url: 'https://javdb.com/v/demo' },
      {
        preferredPreviewSource: 'javdb',
        fetchPreviewUrl: async (source) => {
          if (source === 'javdb') return 'https://javdb.com/preview/720p.m3u8?sign=a&amp;t=1';
          if (source === 'javspyl') return 'https://example.test/javspyl.mp4';
          return null;
        },
      },
    );

    expect(sources).toEqual([
      {
        url: 'https://example.test/javspyl.mp4',
        type: 'video/mp4',
        source: 'javspyl',
      },
    ]);
  });

  it('creates list preview video elements with cache persistence and retry cleanup', () => {
    const onCacheError = vi.fn();
    const video = createListPreviewVideoElement(
      [{ url: 'https://example.test/preview.mp4', type: 'video/mp4', source: 'javspyl' }],
      {
        cacheKey: 'video_preview_ABP-001',
        code: 'ABP-001',
        onCacheError,
      },
    );

    expect(video.autoplay).toBe(true);
    expect(video.controls).toBe(true);
    expect(video.className).toContain('x-preview-video');
    expect(video.querySelector('source')?.src).toBe('https://example.test/preview.mp4');

    video.dispatchEvent(new Event('loadeddata'));
    expect(parsePreviewCacheEntry(localStorage.getItem('video_preview_ABP-001'))).toMatchObject({
      url: 'https://example.test/preview.mp4',
      source: 'javspyl',
    });

    video.dispatchEvent(new Event('error'));
    expect(localStorage.getItem('video_preview_ABP-001')).toBeNull();
    expect(onCacheError).toHaveBeenCalledOnce();
  });
});
