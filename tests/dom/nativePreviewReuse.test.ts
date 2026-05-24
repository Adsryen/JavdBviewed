import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachNativeJavdbPreview,
  restoreNativeJavdbPreview,
} from '../../src/content/nativeJavdbPreview';

describe('native JavDB preview reuse', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('moves the native preview video into a hover container and restores it', async () => {
    const nativeParent = document.createElement('div');
    const video = document.createElement('video');
    video.id = 'preview-video';
    video.className = 'fancybox-video';
    video.src = 'blob:https://javdb.com/native-preview';
    video.style.display = 'none';
    nativeParent.appendChild(video);
    document.body.appendChild(nativeParent);

    const hoverContainer = document.createElement('div');
    document.body.appendChild(hoverContainer);

    const attached = attachNativeJavdbPreview(hoverContainer);

    expect(attached).toBe(video);
    expect(hoverContainer.querySelector('#preview-video')).toBe(video);
    expect(video.style.display).toBe('block');
    expect(video.style.opacity).toBe('1');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();

    restoreNativeJavdbPreview(video);

    expect(nativeParent.querySelector('#preview-video')).toBe(video);
    expect(video.style.display).toBe('none');
    expect(video.style.opacity).toBe('');
    expect(video.className).toBe('fancybox-video');
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
  });

  it('restores after the original next sibling has been removed', () => {
    const nativeParent = document.createElement('div');
    const video = document.createElement('video');
    video.id = 'preview-video';
    video.src = 'blob:https://javdb.com/native-preview';
    const nextSibling = document.createElement('a');
    nativeParent.append(video, nextSibling);
    document.body.appendChild(nativeParent);

    const hoverContainer = document.createElement('div');
    document.body.appendChild(hoverContainer);

    attachNativeJavdbPreview(hoverContainer);
    nextSibling.remove();
    restoreNativeJavdbPreview(video);

    expect(nativeParent.lastElementChild).toBe(video);
  });

  it('ignores empty native preview nodes', () => {
    const nativeParent = document.createElement('div');
    const video = document.createElement('video');
    video.id = 'preview-video';
    nativeParent.appendChild(video);
    document.body.appendChild(nativeParent);

    const hoverContainer = document.createElement('div');
    document.body.appendChild(hoverContainer);

    expect(attachNativeJavdbPreview(hoverContainer)).toBeNull();
    expect(nativeParent.querySelector('#preview-video')).toBe(video);
  });
});
