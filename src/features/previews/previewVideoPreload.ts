type HlsLike = {
  loadSource: (url: string) => void;
  attachMedia: (video: HTMLMediaElement) => void;
  destroy: () => void;
};

const HLS_INSTANCE_KEY = '__jdbPreviewHlsInstance';

export function activatePreviewVideoPreload(video: HTMLVideoElement): void {
  if (!isManagedPreviewVideo(video)) {
    return;
  }

  restorePreviewVideoSources(video);
  if (video.dataset.jdbPreviewPreloadActive === '1') {
    video.preload = 'auto';
    video.setAttribute('preload', 'auto');
    if (isHlsVideo(video)) {
      bindHlsPreview(video);
    }
    return;
  }

  video.preload = 'auto';
  video.setAttribute('preload', 'auto');
  if (isHlsVideo(video)) {
    bindHlsPreview(video);
  } else {
    video.load();
  }
  video.dataset.jdbPreviewPreloadActive = '1';
}

export function releasePreviewVideoMedia(video: HTMLVideoElement): void {
  if (!isManagedPreviewVideo(video)) {
    return;
  }

  video.pause();
  destroyHlsPreview(video);
  video.preload = 'none';
  video.setAttribute('preload', 'none');
  detachPreviewVideoSources(video);
  video.load();
  video.dataset.jdbPreviewPreloadActive = '0';
}

function restorePreviewVideoSources(video: HTMLVideoElement): void {
  const originalSrc = video.dataset.jdbOriginalSrc;
  if (originalSrc && !video.getAttribute('src')) {
    video.setAttribute('src', originalSrc);
  }

  video.querySelectorAll<HTMLSourceElement>('source').forEach(source => {
    const originalSourceSrc = source.dataset.jdbOriginalSrc;
    if (originalSourceSrc && !source.getAttribute('src')) {
      source.setAttribute('src', originalSourceSrc);
    }
  });
}

function isManagedPreviewVideo(video: HTMLVideoElement): boolean {
  const urls = [
    video.currentSrc,
    video.dataset.jdbPreviewHlsUrl || '',
    video.dataset.jdbOriginalSrc || '',
    video.getAttribute('src') || '',
    ...Array.from(video.querySelectorAll<HTMLSourceElement>('source')).map(source => source.getAttribute('src') || ''),
    ...Array.from(video.querySelectorAll<HTMLSourceElement>('source')).map(source => source.dataset.jdbOriginalSrc || ''),
  ];

  return urls.some(url => {
    if (!url) return false;
    if (url.startsWith('blob:')) return false;
    return true;
  });
}

function isHlsVideo(video: HTMLVideoElement): boolean {
  const urls = [
    video.currentSrc,
    video.dataset.jdbPreviewHlsUrl || '',
    video.getAttribute('src') || '',
    ...Array.from(video.querySelectorAll<HTMLSourceElement>('source')).map(source => source.getAttribute('src') || ''),
  ];

  return urls.some(url => /\.m3u8(?:[?#].*)?$/i.test(url.replace(/&amp;/g, '&')));
}

function bindHlsPreview(video: HTMLVideoElement): void {
  const url = getPreviewSourceUrl(video);
  if (!url) {
    return;
  }

  const existing = getHlsInstance(video);
  if (existing) {
    existing.destroy();
    delete (video as any)[HLS_INSTANCE_KEY];
  }

  video.dataset.jdbPreviewHlsUrl = url;
  const HlsCtor = (window as any).Hls;
  if (typeof HlsCtor !== 'function') {
    return;
  }

  const hls = new HlsCtor() as HlsLike;
  hls.loadSource(url);
  hls.attachMedia(video);
  (video as any)[HLS_INSTANCE_KEY] = hls;
}

function destroyHlsPreview(video: HTMLVideoElement): void {
  const instance = getHlsInstance(video);
  if (instance) {
    instance.destroy();
    delete (video as any)[HLS_INSTANCE_KEY];
  }

  delete video.dataset.jdbPreviewHlsUrl;
}

function getHlsInstance(video: HTMLVideoElement): HlsLike | null {
  return (video as any)[HLS_INSTANCE_KEY] || null;
}

function getPreviewSourceUrl(video: HTMLVideoElement): string | null {
  const sourceUrl = video.dataset.jdbPreviewHlsUrl || video.getAttribute('src') || video.currentSrc || video.querySelector('source')?.getAttribute('src') || null;
  if (!sourceUrl) {
    return null;
  }
  return sourceUrl.replace(/&amp;/g, '&');
}

function detachPreviewVideoSources(video: HTMLVideoElement): void {
  const src = video.getAttribute('src');
  if (src) {
    video.dataset.jdbOriginalSrc = src;
    video.removeAttribute('src');
  }

  video.querySelectorAll<HTMLSourceElement>('source').forEach(source => {
    const sourceSrc = source.getAttribute('src');
    if (!sourceSrc) return;
    source.dataset.jdbOriginalSrc = sourceSrc;
    source.removeAttribute('src');
  });
}
