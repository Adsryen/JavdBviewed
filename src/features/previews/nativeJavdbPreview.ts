interface NativePreviewState {
  parent: Node;
  nextSibling: Node | null;
  style: Partial<CSSStyleDeclaration>;
  className: string;
  muted: boolean;
  volume: number;
  controls: boolean;
}

const nativePreviewStates = new WeakMap<HTMLVideoElement, NativePreviewState>();

const STYLE_KEYS = [
  'display',
  'opacity',
  'position',
  'top',
  'left',
  'width',
  'height',
  'objectFit',
  'zIndex',
  'backgroundColor',
  'transition',
] as const;

export function attachNativeJavdbPreview(target: HTMLElement, volume?: number): HTMLVideoElement | null {
  const video = document.querySelector<HTMLVideoElement>('#preview-video');
  if (!video || target.contains(video)) {
    return video;
  }

  const hasMedia = !!(
    video.currentSrc ||
    video.getAttribute('src') ||
    video.querySelector('source')?.getAttribute('src')
  );
  if (!hasMedia) {
    return null;
  }

  const parent = video.parentNode;
  if (!parent) {
    return null;
  }

  if (!nativePreviewStates.has(video)) {
    const style = {} as Partial<CSSStyleDeclaration>;
    STYLE_KEYS.forEach(key => {
      style[key] = video.style[key];
    });
    nativePreviewStates.set(video, {
      parent,
      nextSibling: video.nextSibling,
      style,
      className: video.className,
      muted: video.muted,
      volume: video.volume,
      controls: video.controls,
    });
  }

  video.dataset.jdbNativePreviewAttached = '1';
  video.controls = true;
  video.muted = false;
  if (typeof volume === 'number' && Number.isFinite(volume)) {
    video.volume = Math.max(0, Math.min(1, volume));
  }
  video.playsInline = true;
  video.style.display = 'block';
  video.style.opacity = '1';
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.zIndex = '10';
  video.style.backgroundColor = 'inherit';
  video.style.transition = 'opacity 0.25s ease-in';
  video.classList.add('x-preview-video');

  target.appendChild(video);
  video.play().catch(() => {
    video.muted = true;
    video.play().catch(() => {});
  });
  return video;
}

export function restoreNativeJavdbPreview(video: HTMLVideoElement): boolean {
  const state = nativePreviewStates.get(video);
  if (!state) {
    return false;
  }

  try {
    video.pause();
  } catch {}

  const nextSibling = state.nextSibling && state.nextSibling.parentNode === state.parent ? state.nextSibling : null;
  state.parent.insertBefore(video, nextSibling);
  STYLE_KEYS.forEach(key => {
    video.style[key] = state.style[key] || '';
  });
  video.muted = state.muted;
  video.volume = state.volume;
  video.controls = state.controls;
  video.className = state.className;
  delete video.dataset.jdbNativePreviewAttached;
  nativePreviewStates.delete(video);
  return true;
}

export function isAttachedNativeJavdbPreview(video: HTMLVideoElement): boolean {
  return nativePreviewStates.has(video) || video.dataset.jdbNativePreviewAttached === '1';
}
