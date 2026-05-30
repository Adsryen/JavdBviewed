import type {
  ListPreviewLoadOptions,
  ListPreviewPreferredSource,
  ListPreviewRuntimeSendMessage,
  ListPreviewVideoInfo,
} from '../../previews';

export interface PreviewHoverControllerOptions {
  window: Window;
  getPreviewDelay: () => number;
  getPreferredPreviewSource: () => ListPreviewPreferredSource;
  isScrolling: () => boolean;
  loadPreviewVideo: (
    coverElement: HTMLElement,
    videoInfo: ListPreviewVideoInfo,
    options: ListPreviewLoadOptions,
  ) => Promise<void>;
  activatePreviewVideoPreload: (video: HTMLVideoElement) => void;
  releasePreviewVideoMedia: (video: HTMLVideoElement) => void;
  runtimeSendMessage: ListPreviewRuntimeSendMessage;
}

export interface PreviewHoverController {
  attach: (coverElement: HTMLElement, videoInfo: ListPreviewVideoInfo) => void;
  show: (coverElement: HTMLElement, videoInfo: ListPreviewVideoInfo) => void;
  hide: (coverElement: HTMLElement) => void;
  load: (coverElement: HTMLElement, videoInfo: ListPreviewVideoInfo) => Promise<void>;
  getCurrentPlayingVideo: () => HTMLVideoElement | null;
}

export function createPreviewHoverController(options: PreviewHoverControllerOptions): PreviewHoverController {
  let previewTimer: number | null = null;
  let currentPlayingVideo: HTMLVideoElement | null = null;

  const showExistingVideo = (coverElement: HTMLElement): boolean => {
    const existingVideo = coverElement.querySelector('video');
    if (!existingVideo) {
      return false;
    }

    existingVideo.style.opacity = '1';
    options.activatePreviewVideoPreload(existingVideo);
    existingVideo.play().catch(() => {});
    currentPlayingVideo = existingVideo;
    return true;
  };

  const load = async (coverElement: HTMLElement, videoInfo: ListPreviewVideoInfo): Promise<void> => {
    if (!coverElement.classList.contains('x-holding')) {
      return;
    }

    if (showExistingVideo(coverElement)) {
      return;
    }

    await options.loadPreviewVideo(coverElement, videoInfo, {
      preferredPreviewSource: options.getPreferredPreviewSource(),
      runtimeSendMessage: options.runtimeSendMessage,
      onVideoCreated: (video) => {
        currentPlayingVideo = video;
      },
    });
  };

  const show = (coverElement: HTMLElement, videoInfo: ListPreviewVideoInfo): void => {
    coverElement.classList.add('x-holding');

    const delay = Number(options.getPreviewDelay() || 0);
    if (delay <= 0) {
      coverElement.classList.remove('x-holding');
      return;
    }

    if (currentPlayingVideo?.parentElement) {
      currentPlayingVideo.pause();
      currentPlayingVideo.style.opacity = '0';
    }

    if (showExistingVideo(coverElement)) {
      return;
    }

    previewTimer = options.window.setTimeout(() => {
      void load(coverElement, videoInfo);
    }, delay < 100 ? 100 : delay);
  };

  const hide = (coverElement: HTMLElement): void => {
    coverElement.classList.remove('x-holding');

    if (previewTimer) {
      options.window.clearTimeout(previewTimer);
      previewTimer = null;
    }

    const video = coverElement.querySelector('video');
    if (!video) return;

    video.style.opacity = '0';
    options.releasePreviewVideoMedia(video);

    if (currentPlayingVideo === video) {
      currentPlayingVideo = null;
    }
  };

  const attach = (coverElement: HTMLElement, videoInfo: ListPreviewVideoInfo): void => {
    coverElement.classList.add('x-cover', 'x-preview');

    coverElement.addEventListener('mouseenter', () => {
      if (options.isScrolling()) return;
      show(coverElement, videoInfo);
    });

    coverElement.addEventListener('mouseleave', (event) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && coverElement.contains(relatedTarget)) {
        return;
      }

      hide(coverElement);
    });
  };

  return {
    attach,
    show,
    hide,
    load,
    getCurrentPlayingVideo: () => currentPlayingVideo,
  };
}
