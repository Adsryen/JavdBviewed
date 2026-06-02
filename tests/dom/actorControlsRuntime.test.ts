import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupActorControlsRuntime, syncActorViewModeButton } from '../../src/dashboard/tabs/actors/actorControlsRuntime';

function renderControls() {
  document.body.innerHTML = `
    <input id="actorSearchInput">
    <select id="actorSortSelect">
      <option value="updatedAt_desc"></option>
      <option value="name_asc"></option>
    </select>
    <select id="actorGenderFilter">
      <option value=""></option>
      <option value="female"></option>
    </select>
    <select id="actorCategoryFilter">
      <option value=""></option>
      <option value="uncensored"></option>
    </select>
    <select id="actorStatusFilter">
      <option value="all"></option>
      <option value="only"></option>
      <option value="sub_exclude"></option>
    </select>
    <select id="actorBlacklistFilter">
      <option value="all"></option>
      <option value="exclude"></option>
      <option value="only"></option>
    </select>
    <input id="actorSubscribedOnly" type="checkbox">
    <select id="actorPageSizeSelect">
      <option value="20"></option>
      <option value="50"></option>
    </select>
    <button id="refreshActorsBtn"></button>
    <button id="toggleActorViewModeBtn">
      <i class="view-icon"></i>
      <span class="view-text"></span>
    </button>
    <input id="actorSelectAllCheckbox" type="checkbox">
    <button id="actorBatchRefreshBtn"></button>
    <button id="actorBatchBlacklistBtn"></button>
    <button id="actorBatchSubscribeBtn"></button>
    <button id="actorBatchDeleteBtn"></button>
    <button id="actorCancelBatchBtn"></button>
  `;
}

function handlers() {
  return {
    changeQuery: vi.fn(),
    changeSort: vi.fn(),
    changeGenderFilter: vi.fn(),
    changeCategoryFilter: vi.fn(),
    changeStatusFilter: vi.fn(),
    changeBlacklistFilter: vi.fn(),
    changeSubscribedOnly: vi.fn(),
    changePageSize: vi.fn(),
    refreshActors: vi.fn(),
    toggleViewMode: vi.fn(),
    handleSelectAll: vi.fn(),
    handleBatchRefresh: vi.fn(),
    handleBatchBlacklist: vi.fn(),
    handleBatchSubscribe: vi.fn(),
    handleBatchDelete: vi.fn(),
    clearSelection: vi.fn(),
  };
}

describe('actor controls runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    renderControls();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('binds filters and keeps search input debounced', () => {
    const runtimeHandlers = handlers();
    setupActorControlsRuntime({
      subscribedOnly: true,
      blacklistFilter: 'exclude',
    }, runtimeHandlers);

    expect((document.getElementById('actorStatusFilter') as HTMLSelectElement).value).toBe('sub_exclude');

    const searchInput = document.getElementById('actorSearchInput') as HTMLInputElement;
    searchInput.value = '  alice  ';
    searchInput.dispatchEvent(new Event('input'));
    expect(runtimeHandlers.changeQuery).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(runtimeHandlers.changeQuery).toHaveBeenCalledWith('alice');

    const sortSelect = document.getElementById('actorSortSelect') as HTMLSelectElement;
    sortSelect.value = 'name_asc';
    sortSelect.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changeSort).toHaveBeenCalledWith('name', 'asc');

    const statusFilter = document.getElementById('actorStatusFilter') as HTMLSelectElement;
    statusFilter.value = 'only';
    statusFilter.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changeStatusFilter).toHaveBeenCalledWith({
      subscribedOnly: false,
      blacklistFilter: 'only',
    });
  });

  it('binds optional controls and batch buttons', () => {
    const runtimeHandlers = handlers();
    setupActorControlsRuntime({
      subscribedOnly: false,
      blacklistFilter: 'all',
    }, runtimeHandlers);

    const genderFilter = document.getElementById('actorGenderFilter') as HTMLSelectElement;
    genderFilter.value = 'female';
    genderFilter.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changeGenderFilter).toHaveBeenCalledWith('female');

    const categoryFilter = document.getElementById('actorCategoryFilter') as HTMLSelectElement;
    categoryFilter.value = 'uncensored';
    categoryFilter.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changeCategoryFilter).toHaveBeenCalledWith('uncensored');

    const blacklistFilter = document.getElementById('actorBlacklistFilter') as HTMLSelectElement;
    blacklistFilter.value = 'exclude';
    blacklistFilter.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changeBlacklistFilter).toHaveBeenCalledWith('exclude');

    const subscribedOnly = document.getElementById('actorSubscribedOnly') as HTMLInputElement;
    subscribedOnly.checked = true;
    subscribedOnly.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changeSubscribedOnly).toHaveBeenCalledWith(true);

    const pageSize = document.getElementById('actorPageSizeSelect') as HTMLSelectElement;
    pageSize.value = '50';
    pageSize.dispatchEvent(new Event('change'));
    expect(runtimeHandlers.changePageSize).toHaveBeenCalledWith(50);

    document.getElementById('refreshActorsBtn')?.click();
    document.getElementById('actorSelectAllCheckbox')?.dispatchEvent(new Event('change'));
    document.getElementById('actorBatchRefreshBtn')?.click();
    document.getElementById('actorBatchBlacklistBtn')?.click();
    document.getElementById('actorBatchSubscribeBtn')?.click();
    document.getElementById('actorBatchDeleteBtn')?.click();
    document.getElementById('actorCancelBatchBtn')?.click();

    expect(runtimeHandlers.refreshActors).toHaveBeenCalledTimes(1);
    expect(runtimeHandlers.handleSelectAll).toHaveBeenCalledTimes(1);
    expect(runtimeHandlers.handleBatchRefresh).toHaveBeenCalledTimes(1);
    expect(runtimeHandlers.handleBatchBlacklist).toHaveBeenCalledTimes(1);
    expect(runtimeHandlers.handleBatchSubscribe).toHaveBeenCalledTimes(1);
    expect(runtimeHandlers.handleBatchDelete).toHaveBeenCalledTimes(1);
    expect(runtimeHandlers.clearSelection).toHaveBeenCalledTimes(1);
  });

  it('binds view mode toggle animation and syncs button labels', () => {
    const runtimeHandlers = handlers();
    setupActorControlsRuntime({
      subscribedOnly: false,
      blacklistFilter: 'all',
    }, runtimeHandlers);

    const button = document.getElementById('toggleActorViewModeBtn')!;
    button.click();

    expect(button.classList.contains('switching')).toBe(true);
    expect(runtimeHandlers.toggleViewMode).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    expect(button.classList.contains('switching')).toBe(false);

    syncActorViewModeButton('card');
    expect(button.classList.contains('card-mode')).toBe(true);
    expect(button.querySelector('.view-icon')?.className).toBe('fas fa-th-large view-icon');
    expect(button.querySelector('.view-text')?.textContent).toBe('卡片视图');
    expect(button.getAttribute('title')).toBe('切换到列表视图');

    syncActorViewModeButton('list');
    expect(button.classList.contains('list-mode')).toBe(true);
    expect(button.querySelector('.view-icon')?.className).toBe('fas fa-list view-icon');
    expect(button.querySelector('.view-text')?.textContent).toBe('列表视图');
    expect(button.getAttribute('title')).toBe('切换到卡片视图');
  });
});
