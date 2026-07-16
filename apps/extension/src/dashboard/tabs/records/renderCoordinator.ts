export interface CreateRecordsRenderCoordinatorOptions {
  videoList: HTMLElement;
  shouldUseIDB: () => boolean;
  setServerModeActive: (active: boolean) => void;
  renderServerPage: () => Promise<void>;
  updateFilteredRecords: () => void;
  renderVideoList: () => void;
  renderPagination: () => void;
  updateStats: () => void | Promise<void>;
  showLoading?: () => void;
}

export interface RecordsRenderCoordinator {
  render: () => void;
}

function defaultShowLoading(videoList: HTMLElement): void {
  try {
    videoList.innerHTML = '<li class="empty-list">加载中...</li>';
  } catch {}
}

export function createRecordsRenderCoordinator(
  options: CreateRecordsRenderCoordinatorOptions,
): RecordsRenderCoordinator {
  const render = () => {
    const useIDB = options.shouldUseIDB();
    options.setServerModeActive(useIDB);

    if (useIDB) {
      if (options.showLoading) options.showLoading();
      else defaultShowLoading(options.videoList);
      options.renderServerPage().finally(() => {
        void options.updateStats();
      });
      return;
    }

    options.updateFilteredRecords();
    options.renderVideoList();
    options.renderPagination();
    void options.updateStats();
  };

  return { render };
}
