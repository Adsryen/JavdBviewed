import { describe, expect, it, vi } from 'vitest';
import { createRecordsViewToolbarController } from '../../src/dashboard/tabs/records/viewToolbarController';

function setupDom() {
  document.body.innerHTML = `
    <button id="toggleCoversBtn"></button>
    <button id="toggleViewModeBtn"><i class="view-icon"></i><span class="view-text"></span></button>
    <button id="myFavoritesBtn"></button>
    <ul id="videoList"></ul>
  `;

  return {
    toggleCoversBtn: document.getElementById('toggleCoversBtn') as HTMLButtonElement,
    toggleViewModeBtn: document.getElementById('toggleViewModeBtn') as HTMLButtonElement,
    favoritesButton: document.getElementById('myFavoritesBtn') as HTMLButtonElement,
    videoList: document.getElementById('videoList') as HTMLUListElement,
  };
}

describe('records view toolbar controller', () => {
  it('renders cover and view mode button states', () => {
    const elements = setupDom();
    const controller = createRecordsViewToolbarController({
      ...elements,
      getCoversEnabled: () => true,
      setCoversEnabled: vi.fn(),
      getViewMode: () => 'card',
      setViewMode: vi.fn(),
      getFavoritesActive: () => false,
      setFavoritesActive: vi.fn(),
      persistSettings: vi.fn(),
      onFilterChanged: vi.fn(),
      onRender: vi.fn(),
    });

    controller.update();

    expect(elements.toggleCoversBtn.textContent).toContain('隐藏封面');
    expect(elements.toggleCoversBtn.classList.contains('toggle-on')).toBe(true);
    expect(elements.toggleViewModeBtn.classList.contains('card-mode')).toBe(true);
    expect(elements.toggleViewModeBtn.querySelector('.view-icon')?.className).toBe('fas fa-th-large view-icon');
    expect(elements.toggleViewModeBtn.querySelector('.view-text')?.textContent).toBe('卡片视图');
    expect(elements.videoList.classList.contains('card-view')).toBe(true);
  });

  it('toggles covers and persists settings', () => {
    const elements = setupDom();
    let coversEnabled = false;
    const persistSettings = vi.fn();
    const onRender = vi.fn();
    const controller = createRecordsViewToolbarController({
      ...elements,
      getCoversEnabled: () => coversEnabled,
      setCoversEnabled: (enabled) => {
        coversEnabled = enabled;
      },
      getViewMode: () => 'list',
      setViewMode: vi.fn(),
      getFavoritesActive: () => false,
      setFavoritesActive: vi.fn(),
      persistSettings,
      onFilterChanged: vi.fn(),
      onRender,
    });

    controller.bind();
    elements.toggleCoversBtn.click();

    expect(coversEnabled).toBe(true);
    expect(persistSettings).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(elements.toggleCoversBtn.textContent).toContain('隐藏封面');
  });

  it('cycles view mode and toggles favorites filter', () => {
    const elements = setupDom();
    let viewMode: 'list' | 'card' = 'list';
    let favoritesActive = false;
    const persistSettings = vi.fn();
    const onRender = vi.fn();
    const onFilterChanged = vi.fn();
    const controller = createRecordsViewToolbarController({
      ...elements,
      getCoversEnabled: () => false,
      setCoversEnabled: vi.fn(),
      getViewMode: () => viewMode,
      setViewMode: (nextMode) => {
        viewMode = nextMode;
      },
      getFavoritesActive: () => favoritesActive,
      setFavoritesActive: (active) => {
        favoritesActive = active;
      },
      persistSettings,
      onFilterChanged,
      onRender,
    });

    controller.bind();
    elements.toggleViewModeBtn.click();
    elements.favoritesButton.click();

    expect(viewMode).toBe('card');
    expect(persistSettings).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(favoritesActive).toBe(true);
    expect(onFilterChanged).toHaveBeenCalledTimes(1);
    expect(elements.favoritesButton.classList.contains('active')).toBe(true);
  });
});
