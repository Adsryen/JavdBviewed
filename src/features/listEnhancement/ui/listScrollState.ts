export interface ListScrollStateController {
  init: () => void;
  cleanup: () => void;
  isScrolling: () => boolean;
}

export interface ListScrollStateOptions {
  document: Document;
  window: Window;
  restoreDelayMs?: number;
}

export function createListScrollStateController(options: ListScrollStateOptions): ListScrollStateController {
  const restoreDelayMs = options.restoreDelayMs ?? 100;
  let scrolling = false;
  let scrollTimer: number | null = null;
  let initialized = false;

  const getListContainer = (): HTMLElement | null => (
    options.document.querySelector('.movie-list') as HTMLElement | null
  );

  const restoreListState = (): void => {
    scrolling = false;
    getListContainer()?.style.removeProperty('pointer-events');
    scrollTimer = null;
  };

  const handleScroll = (): void => {
    scrolling = true;
    if (scrollTimer !== null) {
      options.window.clearTimeout(scrollTimer);
    }

    const container = getListContainer();
    if (container) {
      container.style.pointerEvents = 'none';
    }

    scrollTimer = options.window.setTimeout(restoreListState, restoreDelayMs);
  };

  return {
    init: () => {
      if (initialized) return;
      initialized = true;
      options.window.addEventListener('scroll', handleScroll);
    },
    cleanup: () => {
      if (!initialized) return;
      initialized = false;
      options.window.removeEventListener('scroll', handleScroll);
      if (scrollTimer !== null) {
        options.window.clearTimeout(scrollTimer);
      }
      restoreListState();
    },
    isScrolling: () => scrolling,
  };
}
