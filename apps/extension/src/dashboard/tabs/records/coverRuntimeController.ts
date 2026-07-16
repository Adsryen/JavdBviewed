export interface CreateRecordsCoverRuntimeControllerOptions {
  fallbackUrl: string;
  rootSelector?: string;
  retryDelayMs?: number;
  documentRef?: Document;
  createObserver?: (callback: IntersectionObserverCallback, options: IntersectionObserverInit) => IntersectionObserver;
  setTimeoutFn?: (handler: () => void, timeout: number) => number;
}

export interface RecordsCoverRuntimeController {
  ensureTooltipElement: () => HTMLDivElement;
  setupObserver: () => IntersectionObserver | null;
  teardownObserver: () => void;
  getTooltipElement: () => HTMLDivElement | null;
  getObserver: () => IntersectionObserver | null;
}

export function createRecordsCoverRuntimeController(
  options: CreateRecordsCoverRuntimeControllerOptions,
): RecordsCoverRuntimeController {
  const documentRef = options.documentRef || document;
  const rootSelector = options.rootSelector || '.video-list-container';
  const retryDelayMs = options.retryDelayMs ?? 300;
  const setTimeoutFn = options.setTimeoutFn || ((handler, timeout) => window.setTimeout(handler, timeout));

  let imageTooltipElement: HTMLDivElement | null = null;
  let coverObserver: IntersectionObserver | null = null;

  const ensureTooltipElement = (): HTMLDivElement => {
    if (imageTooltipElement) return imageTooltipElement;

    const existing = documentRef.querySelector('.image-tooltip') as HTMLDivElement | null;
    if (existing) {
      imageTooltipElement = existing;
      return existing;
    }

    const element = documentRef.createElement('div');
    element.className = 'image-tooltip';
    documentRef.body.appendChild(element);
    imageTooltipElement = element;
    return element;
  };

  const loadImage = (image: HTMLImageElement, src: string) => {
    image.src = src;
    image.onload = () => {
      image.classList.add('loaded');
      (image.parentElement as HTMLElement | null)?.classList.remove('skeleton');
      image.removeAttribute('data-src');
    };
    image.onerror = () => {
      const retries = Number(image.getAttribute('data-retries') || '0');
      if (retries < 2) {
        image.setAttribute('data-retries', String(retries + 1));
        const current = image.getAttribute('data-src') || src;
        setTimeoutFn(() => { image.src = current; }, retryDelayMs);
        return;
      }

      image.src = options.fallbackUrl;
      image.classList.add('loaded');
      (image.parentElement as HTMLElement | null)?.classList.remove('skeleton');
      image.removeAttribute('data-src');
    };
  };

  const setupObserver = (): IntersectionObserver | null => {
    if (coverObserver) coverObserver.disconnect();
    const rootEl = documentRef.querySelector(rootSelector) as Element | null;
    const createObserver = options.createObserver || ((callback, observerOptions) => new IntersectionObserver(callback, observerOptions));

    coverObserver = createObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const image = entry.target as HTMLImageElement;
        const src = image.getAttribute('data-src');
        if (src) {
          loadImage(image, src);
        }
        coverObserver?.unobserve(image);
      });
    }, {
      root: rootEl || null,
      rootMargin: '150px',
      threshold: 0.01,
    });

    return coverObserver;
  };

  const teardownObserver = () => {
    if (coverObserver) {
      coverObserver.disconnect();
      coverObserver = null;
    }
  };

  return {
    ensureTooltipElement,
    setupObserver,
    teardownObserver,
    getTooltipElement: () => imageTooltipElement,
    getObserver: () => coverObserver,
  };
}
