import type { ListPreviewVideoInfo } from '../../previews';

export interface ListClickEnhancementOptions {
  videoInfo: ListPreviewVideoInfo;
  enableRightClickBackground: boolean;
  navigateTo: (url: string) => void;
  openFc2Dialog: (movieId: string, code: string, url: string) => Promise<void>;
  sendRuntimeMessage: (message: { type: string; url: string }) => Promise<unknown>;
  showToast: (message: string, type: 'success' | 'error') => void;
  openWindow: (url: string) => void;
  logger?: (...args: any[]) => void;
  now?: () => number;
  setTimeout?: (handler: () => void, timeout: number) => number;
}

export function attachListClickEnhancement(item: HTMLElement, options: ListClickEnhancementOptions): void {
  const linkElement = item.querySelector('a[href*="/v/"]') as HTMLAnchorElement | null;
  if (!linkElement) return;

  linkElement.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleListItemClick(options);
  });

  if (options.enableRightClickBackground) {
    attachRightClickBackgroundOpen(linkElement, options);
  }
}

export async function handleListItemClick(options: ListClickEnhancementOptions): Promise<void> {
  const { videoInfo } = options;

  if (!isFc2ListVideoCode(videoInfo.code)) {
    options.navigateTo(videoInfo.url);
    return;
  }

  options.logger?.(`[ListEnhancement] FC2 video detected: ${videoInfo.code}, opening FC2 dialog instead of navigating`);
  const movieId = extractMovieIdFromJavdbVideoUrl(videoInfo.url);
  if (!movieId) {
    options.logger?.('[ListEnhancement] Failed to extract movieId from URL:', videoInfo.url);
    options.showToast('无法解析FC2视频ID', 'error');
    return;
  }

  try {
    await options.openFc2Dialog(movieId, videoInfo.code, videoInfo.url);
  } catch (error) {
    options.logger?.('[ListEnhancement] Failed to open FC2 dialog:', error);
    options.showToast('FC2视频加载失败', 'error');
  }
}

export function isFc2ListVideoCode(code: string): boolean {
  return code.toUpperCase().includes('FC2') || code.toUpperCase().includes('FC2PPV');
}

export function extractMovieIdFromJavdbVideoUrl(url: string): string | null {
  return url.match(/\/v\/([^/?#]+)/)?.[1] || null;
}

function attachRightClickBackgroundOpen(linkElement: HTMLAnchorElement, options: ListClickEnhancementOptions): void {
  let rightClickHandled = false;
  const setTimeout = options.setTimeout || window.setTimeout.bind(window);

  const openInBackground = () => {
    const startedAt = options.now?.() ?? performance.now();
    options.showToast('已在后台打开', 'success');

    void options.sendRuntimeMessage({
      type: 'OPEN_TAB_BACKGROUND',
      url: options.videoInfo.url,
    }).then(() => {
      const finishedAt = options.now?.() ?? performance.now();
      options.logger?.(`[ListEnhancement] Background tab opened in ${Math.round(finishedAt - startedAt)}ms`);
    }).catch(error => {
      options.logger?.('Failed to open background tab:', error);
      options.openWindow(options.videoInfo.url);
    });
  };

  const handleRightClick = (event: MouseEvent, shouldCheckButton: boolean): void => {
    if (shouldCheckButton && event.button !== 2) return;
    event.preventDefault();
    event.stopPropagation();
    if (rightClickHandled) return;

    rightClickHandled = true;
    openInBackground();
    setTimeout(() => {
      rightClickHandled = false;
    }, 800);
  };

  linkElement.addEventListener('mousedown', event => handleRightClick(event, true));
  linkElement.addEventListener('contextmenu', event => handleRightClick(event, false));
}
