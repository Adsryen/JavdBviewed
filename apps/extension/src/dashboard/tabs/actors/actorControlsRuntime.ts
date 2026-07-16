import {
  buildActorStatusFilterValue,
  resolveActorStatusFilterState,
  type ActorBlacklistFilter,
  type ActorStatusFilterState,
  type ActorStatusFilterValue,
  type ActorSortOrder,
} from './queryModel';

export interface ActorControlsRuntimeHandlers {
  changeQuery(query: string): void;
  changeSort(sortBy: string, order: ActorSortOrder): void;
  changeGenderFilter(value: string): void;
  changeCategoryFilter(value: string): void;
  changeStatusFilter(state: ActorStatusFilterState): void;
  changeBlacklistFilter(value: ActorBlacklistFilter): void;
  changeSubscribedOnly(value: boolean): void;
  changePageSize(value: number): void;
  refreshActors(): void;
  toggleViewMode(): void;
  handleSelectAll(): void;
  handleBatchRefresh(): void;
  handleBatchBlacklist(): void;
  handleBatchSubscribe(): void;
  handleBatchDelete(): void;
  clearSelection(): void;
}

export function setupActorControlsRuntime(
  state: ActorStatusFilterState,
  handlers: ActorControlsRuntimeHandlers,
  doc: Document = document,
  win: Window = window,
): void {
  const searchInput = doc.getElementById('actorSearchInput') as HTMLInputElement | null;
  if (searchInput) {
    let searchTimeout: number | undefined;
    searchInput.addEventListener('input', () => {
      win.clearTimeout(searchTimeout);
      searchTimeout = win.setTimeout(() => {
        handlers.changeQuery(searchInput.value.trim());
      }, 300);
    });
  }

  const sortSelect = doc.getElementById('actorSortSelect') as HTMLSelectElement | null;
  if (sortSelect) {
    sortSelect.value = 'updatedAt_desc';
    sortSelect.addEventListener('change', () => {
      const [sortBy, sortOrder] = sortSelect.value.split('_');
      handlers.changeSort(sortBy, sortOrder === 'asc' ? 'asc' : 'desc');
    });
  }

  const genderFilter = doc.getElementById('actorGenderFilter') as HTMLSelectElement | null;
  if (genderFilter) {
    genderFilter.addEventListener('change', () => {
      handlers.changeGenderFilter(genderFilter.value);
    });
  }

  const categoryFilter = doc.getElementById('actorCategoryFilter') as HTMLSelectElement | null;
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      handlers.changeCategoryFilter(categoryFilter.value);
    });
  }

  const statusFilter = doc.getElementById('actorStatusFilter') as HTMLSelectElement | null;
  if (statusFilter) {
    statusFilter.value = buildActorStatusFilterValue(state);
    statusFilter.addEventListener('change', () => {
      handlers.changeStatusFilter(resolveActorStatusFilterState(statusFilter.value as ActorStatusFilterValue));
    });
  }

  const blacklistFilter = doc.getElementById('actorBlacklistFilter') as HTMLSelectElement | null;
  if (blacklistFilter) {
    blacklistFilter.addEventListener('change', () => {
      handlers.changeBlacklistFilter(blacklistFilter.value as ActorBlacklistFilter);
    });
  }

  const subscribedOnly = doc.getElementById('actorSubscribedOnly') as HTMLInputElement | null;
  if (subscribedOnly) {
    subscribedOnly.addEventListener('change', () => {
      handlers.changeSubscribedOnly(!!subscribedOnly.checked);
    });
  }

  const pageSizeSelect = doc.getElementById('actorPageSizeSelect') as HTMLSelectElement | null;
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', () => {
      handlers.changePageSize(parseInt(pageSizeSelect.value));
    });
  }

  const refreshBtn = doc.getElementById('refreshActorsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      handlers.refreshActors();
    });
  }

  const toggleViewModeBtn = doc.getElementById('toggleActorViewModeBtn');
  if (toggleViewModeBtn) {
    toggleViewModeBtn.addEventListener('click', () => {
      toggleViewModeBtn.classList.add('switching');
      win.setTimeout(() => {
        toggleViewModeBtn.classList.remove('switching');
      }, 500);

      handlers.toggleViewMode();
    });
  }

  const selectAllCheckbox = doc.getElementById('actorSelectAllCheckbox') as HTMLInputElement | null;
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => handlers.handleSelectAll());
  }

  const batchRefreshBtn = doc.getElementById('actorBatchRefreshBtn') as HTMLButtonElement | null;
  if (batchRefreshBtn) {
    batchRefreshBtn.addEventListener('click', () => handlers.handleBatchRefresh());
  }

  const batchBlacklistBtn = doc.getElementById('actorBatchBlacklistBtn') as HTMLButtonElement | null;
  if (batchBlacklistBtn) {
    batchBlacklistBtn.addEventListener('click', () => handlers.handleBatchBlacklist());
  }

  const batchSubscribeBtn = doc.getElementById('actorBatchSubscribeBtn') as HTMLButtonElement | null;
  if (batchSubscribeBtn) {
    batchSubscribeBtn.addEventListener('click', () => handlers.handleBatchSubscribe());
  }

  const batchDeleteBtn = doc.getElementById('actorBatchDeleteBtn') as HTMLButtonElement | null;
  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', () => handlers.handleBatchDelete());
  }

  const cancelBatchBtn = doc.getElementById('actorCancelBatchBtn') as HTMLButtonElement | null;
  if (cancelBatchBtn) {
    cancelBatchBtn.addEventListener('click', () => handlers.clearSelection());
  }
}

export function syncActorViewModeButton(currentViewMode: 'list' | 'card', doc: Document = document): void {
  const toggleViewModeBtn = doc.getElementById('toggleActorViewModeBtn');
  if (!toggleViewModeBtn) return;

  const icon = toggleViewModeBtn.querySelector('.view-icon') as HTMLElement | null;
  const text = toggleViewModeBtn.querySelector('.view-text') as HTMLElement | null;

  if (currentViewMode === 'list') {
    toggleViewModeBtn.classList.remove('card-mode');
    toggleViewModeBtn.classList.add('list-mode');
    if (icon) {
      icon.className = 'fas fa-list view-icon';
    }
    if (text) {
      text.textContent = '列表视图';
    }
    toggleViewModeBtn.title = '切换到卡片视图';
    return;
  }

  toggleViewModeBtn.classList.remove('list-mode');
  toggleViewModeBtn.classList.add('card-mode');
  if (icon) {
    icon.className = 'fas fa-th-large view-icon';
  }
  if (text) {
    text.textContent = '卡片视图';
  }
  toggleViewModeBtn.title = '切换到列表视图';
}
