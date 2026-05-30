import type { ListEnhancementConfig, VideoPreviewOptions, VideoPreviewSource } from '../listEnhancement/domain/config';
import { activatePreviewVideoPreload } from './previewVideoPreload';
import {
  createPreviewCacheEntry,
  getPreviewSourceType,
  isHlsPreviewUrl,
  isKnownBadVbgflPreviewUrl,
  isVbgflMusumeCode,
  isVbgflPacoCode,
  isVbgflPondoCode,
  normalizePreviewUrl,
  parsePreviewCacheEntry,
  serializePreviewCacheEntry,
  type PreviewSourceName,
} from './previewSourceRules';

export interface ListPreviewVideoInfo {
  code: string;
  title: string;
  url: string;
}

export interface ListPreviewFetchResponse {
  success?: boolean;
  videoUrl?: string | null;
}

export type ListPreviewPreferredSource = NonNullable<ListEnhancementConfig['preferredPreviewSource']>;

export type ListPreviewRuntimeSendMessage = (
  message: { type: string; code?: string; url?: string },
) => Promise<ListPreviewFetchResponse | null | undefined>;

export type ListPreviewFetchUrl = (
  source: Exclude<PreviewSourceName, 'cache' | 'legacy' | 'test'>,
  videoInfo: ListPreviewVideoInfo,
) => Promise<string | null>;

export interface ListPreviewLoadOptions {
  preferredPreviewSource?: ListPreviewPreferredSource;
  runtimeSendMessage?: ListPreviewRuntimeSendMessage;
  onVideoCreated?: (video: HTMLVideoElement) => void;
}

const LIST_PREVIEW_AUTO_ORDER: Array<Exclude<PreviewSourceName, 'cache' | 'legacy' | 'test'>> = [
  'javdb',
  'javspyl',
  'avpreview',
  'vbgfl',
];

export function getListPreviewSourceOrder(preferredPreviewSource: ListPreviewPreferredSource = 'auto'): Array<Exclude<PreviewSourceName, 'cache' | 'legacy' | 'test'>> {
  if (preferredPreviewSource === 'auto') {
    return [...LIST_PREVIEW_AUTO_ORDER];
  }

  return [
    preferredPreviewSource,
    ...LIST_PREVIEW_AUTO_ORDER.filter(source => source !== preferredPreviewSource),
  ];
}

export async function fetchListPreviewSources(
  videoInfo: ListPreviewVideoInfo,
  options: {
    preferredPreviewSource?: ListPreviewPreferredSource;
    runtimeSendMessage?: ListPreviewRuntimeSendMessage;
    fetchPreviewUrl?: ListPreviewFetchUrl;
    skipJavdbHls?: boolean;
  } = {},
): Promise<VideoPreviewSource[]> {
  if (videoInfo.code.startsWith('TEST-')) {
    const testUrl = getListPreviewTestUrl(videoInfo.code);
    if (testUrl) {
      return [{
        url: testUrl,
        type: 'video/mp4',
        source: 'test',
      }];
    }
  }

  const sources: VideoPreviewSource[] = [];
  const order = getListPreviewSourceOrder(options.preferredPreviewSource);
  for (const source of order) {
    try {
      const url = options.fetchPreviewUrl
        ? await options.fetchPreviewUrl(source, videoInfo)
        : await resolveListPreviewSourceUrl(source, videoInfo, options.runtimeSendMessage);
      if (!url) {
        continue;
      }

      const normalizedUrl = normalizePreviewUrl(url);
      if ((options.skipJavdbHls ?? true) && source === 'javdb' && isHlsPreviewUrl(normalizedUrl)) {
        continue;
      }

      sources.push({
        url: normalizedUrl,
        type: getPreviewSourceType(normalizedUrl),
        source,
      });
    } catch {
      continue;
    }
  }

  return sources;
}

export async function loadListPreviewVideo(
  coverElement: HTMLElement,
  videoInfo: ListPreviewVideoInfo,
  options: ListPreviewLoadOptions = {},
): Promise<void> {
  if (!coverElement.classList.contains('x-holding')) {
    return;
  }

  const cacheKey = `video_preview_${videoInfo.code}`;
  let cachedEntry = null as ReturnType<typeof parsePreviewCacheEntry> | null;
  try {
    cachedEntry = parsePreviewCacheEntry(localStorage.getItem(cacheKey));
  } catch {}

  if (cachedEntry?.url && isKnownBadVbgflPreviewUrl(videoInfo.code, cachedEntry.url)) {
    try {
      localStorage.removeItem(cacheKey);
    } catch {}
    cachedEntry = null;
  }

  if (cachedEntry?.url) {
    const video = createListPreviewVideoElement(
      [{ url: cachedEntry.url, type: cachedEntry.type, source: cachedEntry.source }],
      {
        cacheKey,
        code: videoInfo.code,
        onCacheError: () => void loadListPreviewVideoFromSources(coverElement, videoInfo, options, cacheKey),
      },
    );
    coverElement.appendChild(video);
    options.onVideoCreated?.(video);
    activatePreviewVideoPreload(video);
    return;
  }

  await loadListPreviewVideoFromSources(coverElement, videoInfo, options, cacheKey);
}

export function createListPreviewVideoElement(
  sources: VideoPreviewSource[],
  options?: VideoPreviewOptions,
): HTMLVideoElement {
  const video = document.createElement('video');

  video.autoplay = true;
  video.muted = false;
  video.loop = true;
  video.playsInline = true;
  video.controls = true;
  video.preload = 'auto';
  video.volume = 0.5;
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  video.setAttribute('controlsList', 'nodownload noremoteplayback');
  video.className = 'fancybox-video x-preview-video';
  video.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.25s ease-in;
    background-color: inherit;
  `;

  sources.forEach(source => {
    const sourceElement = document.createElement('source');
    sourceElement.src = source.url;
    sourceElement.type = source.type;
    video.appendChild(sourceElement);
  });

  const persistPreviewCache = () => {
    if (!options || !sources[0]) return;
    try {
      const currentUrl = normalizePreviewUrl(video.currentSrc || sources[0].url);
      const cacheSource = sources.find(source => normalizePreviewUrl(source.url) === currentUrl) || sources[0];
      const entry = createPreviewCacheEntry(currentUrl, cacheSource.source || 'cache');
      localStorage.setItem(options.cacheKey, serializePreviewCacheEntry(entry));
    } catch {}
  };

  const retryPreview = () => {
    if (!options) return;
    try {
      localStorage.removeItem(options.cacheKey);
    } catch {}
    options.onCacheError?.();
  };

  video.addEventListener('loadeddata', persistPreviewCache);
  video.addEventListener('canplay', () => {
    persistPreviewCache();
    if (video.parentElement) {
      video.style.opacity = '1';
      activatePreviewVideoPreload(video);
      video.play().catch(() => {});
    }
  });
  video.addEventListener('error', () => {
    retryPreview();
    if (video.parentNode) {
      video.remove();
    }
  });
  video.addEventListener('keyup', (e) => {
    if (e.code === 'KeyM') {
      video.muted = !video.muted;
    }
    if (e.code === 'Enter' && video.requestFullscreen) {
      video.requestFullscreen();
    }
  });

  return video;
}

async function loadListPreviewVideoFromSources(
  coverElement: HTMLElement,
  videoInfo: ListPreviewVideoInfo,
  options: ListPreviewLoadOptions,
  cacheKey: string,
): Promise<void> {
  try {
    const videoSources = await fetchListPreviewSources(videoInfo, {
      preferredPreviewSource: options.preferredPreviewSource,
      runtimeSendMessage: options.runtimeSendMessage,
      skipJavdbHls: true,
    });

    if (!coverElement.classList.contains('x-holding')) {
      return;
    }

    if (videoSources.length === 0) {
      return;
    }

    const video = createListPreviewVideoElement(videoSources, {
      cacheKey,
      code: videoInfo.code,
      onCacheError: () => void loadListPreviewVideoFromSources(coverElement, videoInfo, options, cacheKey),
    });
    coverElement.appendChild(video);
    options.onVideoCreated?.(video);
    activatePreviewVideoPreload(video);
  } catch {}
}

function getListPreviewTestUrl(code: string): string | null {
  const testVideos: Record<string, string> = {
    'TEST-001': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'TEST-002': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'TEST-003': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  };

  return testVideos[code] || null;
}

async function resolveListPreviewSourceUrl(
  source: Exclude<PreviewSourceName, 'cache' | 'legacy' | 'test'>,
  videoInfo: ListPreviewVideoInfo,
  runtimeSendMessage?: ListPreviewRuntimeSendMessage,
): Promise<string | null> {
  switch (source) {
    case 'javspyl':
      return fetchFromRuntime(runtimeSendMessage, {
        type: 'FETCH_JAVSPYL_PREVIEW',
        code: videoInfo.code,
      });
    case 'avpreview':
      return fetchFromRuntime(runtimeSendMessage, {
        type: 'FETCH_AVPREVIEW_PREVIEW',
        code: videoInfo.code,
      });
    case 'vbgfl':
      return fetchFromVBGFL(videoInfo.code);
    case 'javdb':
    default:
      return fetchFromRuntime(runtimeSendMessage, {
        type: 'FETCH_JAVDB_PREVIEW',
        url: videoInfo.url,
      });
  }
}

async function fetchFromRuntime(
  runtimeSendMessage: ListPreviewRuntimeSendMessage | undefined,
  message: { type: string; code?: string; url?: string },
): Promise<string | null> {
  if (!runtimeSendMessage) {
    return null;
  }

  const response = await runtimeSendMessage(message);
  if (response?.success && typeof response.videoUrl === 'string') {
    return response.videoUrl;
  }
  return null;
}

async function fetchFromVBGFL(code: string): Promise<string | null> {
  const normalizedCode = code.replace(/HEYZO-/gi, '').toLowerCase();
  const urls: string[] = [];

  if (/^n\d{3,6}$/i.test(normalizedCode)) {
    urls.push(`https://my.cdn.tokyo-hot.com/media/samples/${normalizedCode}.mp4`);
  }

  if (code.includes('-') && /^\d{6}-\d{3}$/.test(code)) {
    urls.push(`https://smovie.caribbeancom.com/sample/movies/${normalizedCode}/720p.mp4`);
    urls.push(`https://smovie.caribbeancom.com/sample/movies/${normalizedCode}/480p.mp4`);
  }

  if (isVbgflPondoCode(code)) {
    const pondo = code.replace('-', '_').toLowerCase();
    urls.push(`https://smovie.1pondo.tv/sample/movies/${pondo}/1080p.mp4`);
    urls.push(`https://smovie.1pondo.tv/sample/movies/${pondo}/720p.mp4`);
  }

  if (code.toLowerCase().includes('heyzo') || /^\d{4}$/.test(normalizedCode)) {
    const heyzoCode = normalizedCode.replace('heyzo-', '');
    urls.push(`https://sample.heyzo.com/contents/3000/${heyzoCode}/heyzo_hd_${heyzoCode}_sample.mp4`);
  }

  if (isVbgflMusumeCode(code)) {
    const musume = code.replace('-', '_').toLowerCase();
    urls.push(`https://smovie.10musume.com/sample/movies/${musume}/720p.mp4`);
  }

  if (isVbgflPacoCode(code)) {
    const paco = code.replace('-', '_').toLowerCase();
    urls.push(`https://fms.pacopacomama.com/hls/sample/pacopacomama.com/${paco}/720p.mp4`);
  }

  return urls[0] || null;
}
