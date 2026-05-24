import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activatePreviewVideoPreload,
  releasePreviewVideoMedia,
} from '../../src/content/previewVideoPreload';

describe('preview video preload lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('activates full preload for a preview video source', () => {
    const video = document.createElement('video');
    const source = document.createElement('source');
    source.src = 'https://example.test/preview.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);

    activatePreviewVideoPreload(video);

    expect(video.preload).toBe('auto');
    expect(video.getAttribute('preload')).toBe('auto');
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledOnce();
  });

  it('does not reload an already active preview video', () => {
    const video = document.createElement('video');
    const source = document.createElement('source');
    source.src = 'https://example.test/preview.mp4';
    video.appendChild(source);

    activatePreviewVideoPreload(video);
    activatePreviewVideoPreload(video);

    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledOnce();
  });

  it('detaches media source on close while keeping it restorable', () => {
    const video = document.createElement('video');
    const source = document.createElement('source');
    source.setAttribute('src', 'https://example.test/preview.mp4');
    source.type = 'video/mp4';
    video.appendChild(source);

    releasePreviewVideoMedia(video);

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
    expect(video.preload).toBe('none');
    expect(source.getAttribute('src')).toBeNull();
    expect(source.dataset.jdbOriginalSrc).toBe('https://example.test/preview.mp4');

    activatePreviewVideoPreload(video);

    expect(source.getAttribute('src')).toBe('https://example.test/preview.mp4');
    expect(video.preload).toBe('auto');
  });

  it('does not reload or detach blob preview videos', () => {
    const video = document.createElement('video');
    video.id = 'preview-video';
    video.src = 'blob:https://javdb.com/test-preview';

    activatePreviewVideoPreload(video);
    releasePreviewVideoMedia(video);

    expect(video.src).toBe('blob:https://javdb.com/test-preview');
    expect(HTMLMediaElement.prototype.load).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
  });

  it('uses HLS playback for m3u8 preview sources when Hls is available', () => {
    const loadSource = vi.fn();
    const attachMedia = vi.fn();
    const destroy = vi.fn();
    const Hls = vi.fn(() => ({ loadSource, attachMedia, destroy }));
    (window as any).Hls = Hls;

    const video = document.createElement('video');
    const source = document.createElement('source');
    source.src = 'https://javdb.com/movies/ttm3u8/preview/395301/0/720p.m3u8?sign=a&amp;t=1';
    source.type = 'application/vnd.apple.mpegurl';
    video.appendChild(source);

    activatePreviewVideoPreload(video);

    expect(Hls).toHaveBeenCalledOnce();
    expect(loadSource).toHaveBeenCalledWith('https://javdb.com/movies/ttm3u8/preview/395301/0/720p.m3u8?sign=a&t=1');
    expect(attachMedia).toHaveBeenCalledWith(video);
    expect(HTMLMediaElement.prototype.load).not.toHaveBeenCalled();

    releasePreviewVideoMedia(video);

    expect(destroy).toHaveBeenCalledOnce();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();

    delete (window as any).Hls;
  });
});
