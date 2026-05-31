import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoDetailEnhancer } from '../../src/features/videoDetail';
import { STATE } from '../../src/features/contentState';

describe('VideoDetailEnhancer preview media loading', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    (window as any).__JDB_VERBOSE = false;
    STATE.settings = {
      listEnhancement: {
        previewVolume: 0.35,
      },
    } as any;

    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('creates preview videos with full preload enabled', () => {
    const enhancer = new VideoDetailEnhancer() as any;

    const video = enhancer.createVideoElement([
      { url: 'https://example.test/sample.mp4', type: 'video/mp4' },
    ]);

    expect(video.preload).toBe('auto');
    expect(video.volume).toBe(0.35);
  });

  it('detaches preview video media when preview closes', () => {
    const enhancer = new VideoDetailEnhancer() as any;
    const cover = document.createElement('div');
    cover.className = 'x-holding';
    const video = enhancer.createVideoElement([
      { url: 'https://example.test/sample.mp4', type: 'video/mp4' },
    ]);
    cover.appendChild(video);
    enhancer.currentPlayingVideo = video;

    enhancer.hidePreview(cover);

    expect(cover.classList.contains('x-holding')).toBe(false);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
    expect(cover.querySelector('video')).toBeNull();
    expect(enhancer.currentPlayingVideo).toBeNull();
  });
});
