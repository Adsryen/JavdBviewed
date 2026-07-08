/**
 * @file listSortingControls.ts
 * @description 列表排序增强控件
 * @module features/listEnhancement
 */
import {
  detectNativeSortCapabilities,
  getAvailableListSortModes,
  readSortableItems,
  sortSortableItems,
  type ListSortingConfig,
  type ListSortingPositionStrategy,
  type ListSortMode,
} from '../application/listSorting';
import type { ListScrollPagingAppendEvent } from '../application/scrollPaging';

const TOOLBAR_CLASS = 'x-list-sort-toolbar';
const NOTICE_CLASS = 'x-list-sort-notice';
const PAGE_PROMPT_CLASS = 'x-list-sort-page-prompt';

export interface ListSortingControllerOptions {
  document: Document;
  window: Window;
  config: ListSortingConfig;
  logger?: (...args: unknown[]) => void;
}

export interface ListSortingController {
  init: () => void;
  cleanup: () => void;
  updateConfig: (config: ListSortingConfig) => void;
  applySort: (mode: ListSortMode, positionStrategy?: ListSortingPositionStrategy) => void;
  handleItemsAppended: (event: ListScrollPagingAppendEvent) => void;
  getActiveMode: () => ListSortMode;
}

function getSortModeLabel(mode: ListSortMode): string {
  if (mode === 'rating-desc') return '评分高优先';
  if (mode === 'rating-count-desc') return '评价人数多优先';
  return '原站顺序';
}

function findNativeToolbar(documentRef: Document): HTMLElement | null {
  const nativeButtons = documentRef.querySelector('.toolbar .buttons.has-addons');
  if (nativeButtons) {
    return nativeButtons.closest('.toolbar') as HTMLElement | null;
  }
  return documentRef.querySelector('.buttons.has-addons') as HTMLElement | null;
}

function findMovieList(documentRef: Document): HTMLElement | null {
  return documentRef.querySelector('.movie-list') as HTMLElement | null;
}

export function createListSortingController(options: ListSortingControllerOptions): ListSortingController {
  let config = options.config;
  let activeMode: ListSortMode = 'original';
  let toolbarElement: HTMLElement | null = null;
  let noticeElement: HTMLElement | null = null;
  let latestPromptElement: HTMLElement | null = null;
  let pendingAppendedCount = 0;

  const logger = (...args: unknown[]): void => {
    options.logger?.(...args);
  };

  const updateActiveButtons = (): void => {
    toolbarElement?.querySelectorAll<HTMLButtonElement>('[data-list-sort-mode]').forEach((button) => {
      const isActive = button.dataset.listSortMode === activeMode;
      button.classList.toggle('is-info', isActive);
      button.classList.toggle('is-selected', isActive);
    });
  };

  const clearNotice = (): void => {
    if (noticeElement) {
      noticeElement.textContent = '';
      noticeElement.hidden = true;
    }
  };

  const updateNotice = (): void => {
    if (!noticeElement) return;
    if (activeMode === 'original') {
      clearNotice();
      return;
    }

    const capabilities = detectNativeSortCapabilities(options.document);
    noticeElement.hidden = false;
    if (capabilities.activeLabel) {
      noticeElement.textContent = `当前列表先按原站「${capabilities.activeLabel}」加载，再整理已经加载的影片。`;
      return;
    }
    noticeElement.textContent = '只整理已经加载出来的影片；原站排序仍决定后续加载顺序。';
  };

  const clearPrompt = (): void => {
    latestPromptElement?.remove();
    latestPromptElement = null;
    pendingAppendedCount = 0;
  };

  const renderToolbar = (): void => {
    toolbarElement?.remove();
    toolbarElement = null;
    noticeElement = null;

    if (!config.enabled) return;

    const movieList = findMovieList(options.document);
    if (!movieList) return;

    const capabilities = detectNativeSortCapabilities(options.document);
    const modes = getAvailableListSortModes(capabilities);
    const wrapper = options.document.createElement('div');
    wrapper.className = TOOLBAR_CLASS;

    const buttons = options.document.createElement('div');
    buttons.className = 'buttons has-addons x-list-sort-buttons';
    modes.forEach((mode) => {
      const button = options.document.createElement('button');
      button.type = 'button';
      button.className = 'button is-small';
      button.dataset.listSortMode = mode;
      button.textContent = getSortModeLabel(mode);
      button.addEventListener('click', () => {
        applySort(mode);
      });
      buttons.appendChild(button);
    });

    const notice = options.document.createElement('div');
    notice.className = NOTICE_CLASS;
    notice.hidden = true;

    wrapper.append(buttons, notice);

    const nativeToolbar = findNativeToolbar(options.document);
    if (nativeToolbar?.parentElement) {
      nativeToolbar.insertAdjacentElement('afterend', wrapper);
    } else {
      movieList.insertAdjacentElement('beforebegin', wrapper);
    }

    toolbarElement = wrapper;
    noticeElement = notice;
    updateActiveButtons();
    updateNotice();
  };

  const applyDomOrder = (mode: ListSortMode): void => {
    const movieList = findMovieList(options.document);
    if (!movieList) return;
    const sorted = sortSortableItems(readSortableItems(options.document), mode);
    sorted.forEach(item => {
      movieList.appendChild(item.element);
    });
  };

  function applySort(mode: ListSortMode, positionStrategy: ListSortingPositionStrategy = config.autoResortPosition): void {
    if (!config.enabled) return;
    const previousScrollY = options.window.scrollY || options.window.pageYOffset || 0;
    activeMode = mode;
    clearPrompt();
    applyDomOrder(mode);
    updateActiveButtons();
    updateNotice();

    if (positionStrategy === 'top') {
      toolbarElement?.scrollIntoView({ block: 'start' });
    } else if (previousScrollY > 0) {
      options.window.scrollTo(0, previousScrollY);
    }
  }

  const renderPagePrompt = (firstAppendedItem: HTMLElement | null): void => {
    latestPromptElement?.remove();

    const movieList = findMovieList(options.document);
    if (!movieList) return;

    const prompt = options.document.createElement('div');
    prompt.className = PAGE_PROMPT_CLASS;

    const message = options.document.createElement('span');
    message.textContent = `新加载的 ${pendingAppendedCount} 部影片还没参与当前排序。`;

    const resortButton = options.document.createElement('button');
    resortButton.type = 'button';
    resortButton.className = 'button is-small is-info';
    resortButton.textContent = '重新排序已加载影片';
    resortButton.addEventListener('click', () => {
      applySort(activeMode);
    });

    const keepButton = options.document.createElement('button');
    keepButton.type = 'button';
    keepButton.className = 'button is-small';
    keepButton.textContent = '保持追加浏览';
    keepButton.addEventListener('click', () => {
      clearPrompt();
    });

    prompt.append(message, resortButton, keepButton);

    if (firstAppendedItem?.parentElement === movieList) {
      movieList.insertBefore(prompt, firstAppendedItem);
    } else {
      movieList.appendChild(prompt);
    }

    latestPromptElement = prompt;
  };

  const handleItemsAppended = (event: ListScrollPagingAppendEvent): void => {
    if (!config.enabled) return;
    readSortableItems(options.document);
    if (activeMode === 'original') return;

    if (config.appendStrategy === 'auto-resort') {
      logger('[ListSorting] auto resort after append', event);
      applySort(activeMode, config.autoResortPosition);
      return;
    }

    pendingAppendedCount += event.appended;
    renderPagePrompt(event.items[0] || null);
  };

  const cleanup = (): void => {
    toolbarElement?.remove();
    latestPromptElement?.remove();
    toolbarElement = null;
    noticeElement = null;
    latestPromptElement = null;
    pendingAppendedCount = 0;
    activeMode = 'original';
  };

  return {
    init(): void {
      if (!config.enabled) {
        cleanup();
        return;
      }
      readSortableItems(options.document);
      renderToolbar();
    },

    cleanup,

    updateConfig(nextConfig: ListSortingConfig): void {
      config = nextConfig;
      if (!config.enabled) {
        cleanup();
        return;
      }
      renderToolbar();
    },

    applySort,
    handleItemsAppended,

    getActiveMode(): ListSortMode {
      return activeMode;
    },
  };
}
