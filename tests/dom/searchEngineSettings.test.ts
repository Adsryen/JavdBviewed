import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchEngineSettings } from '../../src/dashboard/tabs/settings/searchEngine/SearchEngineSettings';
import { STATE } from '../../src/dashboard/state';
import { DEFAULT_SETTINGS } from '../../src/utils/config';
import { mergeSearchEngineTemplates } from '../../src/utils/storage';

vi.mock('../../src/dashboard/logger', () => ({
  logAsync: vi.fn(),
}));

describe('search engine settings panel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders bundled search engines as readonly while custom engines remain editable', () => {
    document.body.innerHTML = `
      <select id="search-engine-category-filter">
        <option value="all">全部</option>
        <option value="search">搜索</option>
        <option value="resource">资源站</option>
        <option value="subtitle">字幕</option>
      </select>
      <div id="search-engine-list"></div>
      <button id="add-search-engine"></button>
    `;
    STATE.settings = {
      ...DEFAULT_SETTINGS,
      searchEngines: mergeSearchEngineTemplates([
        {
          id: 'private-site',
          name: 'Private Site',
          icon: 'assets/alternate-search.png',
          urlTemplate: 'https://private.test/search?q={{ID}}',
          category: 'resource',
        },
      ]),
    } as any;

    const panel = new SearchEngineSettings();
    (panel as any).initializeElements();
    (panel as any).renderSearchEngines();

    const bundledItem = document.querySelector<HTMLElement>('.search-engine-item[data-engine-id="javdb"]');
    const customItem = document.querySelector<HTMLElement>('.search-engine-item[data-engine-id="private-site"]');

    expect(bundledItem?.classList.contains('is-bundled')).toBe(true);
    expect(bundledItem?.querySelector<HTMLInputElement>('.name-input')?.disabled).toBe(true);
    expect(bundledItem?.querySelector<HTMLSelectElement>('.category-select')?.disabled).toBe(true);
    expect(bundledItem?.querySelector<HTMLInputElement>('.url-template-input')?.disabled).toBe(true);
    expect(bundledItem?.querySelector<HTMLInputElement>('.icon-url-input')?.disabled).toBe(true);
    expect(bundledItem?.querySelector<HTMLInputElement>('.enabled-input')?.disabled).toBe(false);
    expect(bundledItem?.querySelector<HTMLElement>('.enabled-slider')).not.toBeNull();
    expect(bundledItem?.querySelector<HTMLElement>('.enabled-cell')?.textContent?.trim()).toBe('');
    expect(bundledItem?.querySelector<HTMLButtonElement>('.delete-engine')?.disabled).toBe(true);

    expect(customItem?.classList.contains('is-bundled')).toBe(false);
    expect(customItem?.querySelector<HTMLInputElement>('.name-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLSelectElement>('.category-select')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLSelectElement>('.category-select')?.value).toBe('resource');
    expect(customItem?.querySelector<HTMLInputElement>('.url-template-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLInputElement>('.icon-url-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLInputElement>('.enabled-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLElement>('.enabled-slider')).not.toBeNull();
    expect(customItem?.querySelector<HTMLButtonElement>('.delete-engine')?.disabled).toBe(false);
  });

  it('lets bundled search engines be hidden without making their builtin fields editable', () => {
    document.body.innerHTML = `
      <select id="search-engine-category-filter">
        <option value="all">全部</option>
        <option value="search">搜索</option>
        <option value="resource">资源站</option>
        <option value="subtitle">字幕</option>
      </select>
      <div id="search-engine-list"></div>
      <button id="add-search-engine"></button>
    `;
    STATE.settings = {
      ...DEFAULT_SETTINGS,
      searchEngines: [
        {
          id: 'javdb',
          name: 'JavDB',
          icon: 'assets/javdb.ico',
          urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all',
          category: 'search',
        },
      ],
    } as any;

    const panel = new SearchEngineSettings();
    (panel as any).initializeElements();
    (panel as any).renderSearchEngines();

    const bundledItem = document.querySelector<HTMLElement>('.search-engine-item[data-engine-id="javdb"]')!;
    const enabledInput = bundledItem.querySelector<HTMLInputElement>('.enabled-input')!;
    enabledInput.checked = false;

    (panel as any).updateSearchEnginesFromUI();

    expect((STATE.settings.searchEngines as any[])[0]).toEqual(expect.objectContaining({
      id: 'javdb',
      name: 'JavDB',
      urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all',
      enabled: false,
    }));
    expect(bundledItem.querySelector<HTMLInputElement>('.name-input')?.disabled).toBe(true);
  });

  it('filters search engines by category and preserves hidden engines while saving visible edits', () => {
    document.body.innerHTML = `
      <select id="search-engine-category-filter">
        <option value="all">全部</option>
        <option value="search">搜索</option>
        <option value="resource">资源站</option>
        <option value="subtitle">字幕</option>
      </select>
      <div id="search-engine-list"></div>
      <button id="add-search-engine"></button>
    `;
    STATE.settings = {
      ...DEFAULT_SETTINGS,
      searchEngines: [
        {
          id: 'javdb',
          name: 'JavDB',
          icon: 'assets/javdb.ico',
          urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all',
          category: 'search',
        },
        {
          id: 'private-subtitle',
          name: 'Private Subtitle',
          icon: 'assets/alternate-search.png',
          urlTemplate: 'https://subtitle.test/search?q={{ID}}',
          category: 'subtitle',
        },
      ],
    } as any;

    const panel = new SearchEngineSettings();
    (panel as any).initializeElements();
    (panel as any).bindEvents();
    (panel as any).renderSearchEngines();

    const filter = document.getElementById('search-engine-category-filter') as HTMLSelectElement;
    filter.value = 'subtitle';
    filter.dispatchEvent(new Event('change'));

    const renderedItems = Array.from(document.querySelectorAll<HTMLElement>('.search-engine-item'));
    expect(renderedItems.map(item => item.dataset.engineId)).toEqual(['private-subtitle']);

    const visibleItem = renderedItems[0];
    visibleItem.querySelector<HTMLInputElement>('.name-input')!.value = 'Edited Subtitle';
    visibleItem.querySelector<HTMLSelectElement>('.category-select')!.value = 'resource';

    (panel as any).updateSearchEnginesFromUI();

    expect((STATE.settings.searchEngines as any[]).map(engine => engine.id)).toEqual([
      'javdb',
      'private-subtitle',
    ]);
    expect((STATE.settings.searchEngines as any[]).find(engine => engine.id === 'javdb')?.category).toBe('search');
    expect((STATE.settings.searchEngines as any[]).find(engine => engine.id === 'private-subtitle')?.name).toBe('Edited Subtitle');
    expect((STATE.settings.searchEngines as any[]).find(engine => engine.id === 'private-subtitle')?.category).toBe('resource');
  });

  it('opens an add modal and writes the new engine only after confirm', () => {
    document.body.innerHTML = `
      <div id="messageContainer"></div>
      <select id="search-engine-category-filter">
        <option value="all">全部</option>
        <option value="search">搜索</option>
        <option value="resource">资源站</option>
        <option value="subtitle">字幕</option>
      </select>
      <div id="search-engine-list"></div>
      <button id="add-search-engine"></button>
    `;
    STATE.settings = {
      ...DEFAULT_SETTINGS,
      searchEngines: [
        {
          id: 'javdb',
          name: 'JavDB',
          icon: 'assets/javdb.ico',
          urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all',
          category: 'search',
        },
      ],
    } as any;

    const panel = new SearchEngineSettings();
    (panel as any).initializeElements();
    (panel as any).bindEvents();
    (panel as any).renderSearchEngines();

    const initialCount = (STATE.settings.searchEngines as any[]).length;
    document.getElementById('add-search-engine')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('.search-engine-add-modal')).not.toBeNull();
    expect((STATE.settings.searchEngines as any[])).toHaveLength(initialCount);

    document.querySelector<HTMLInputElement>('.search-engine-modal-name')!.value = '字幕站';
    document.querySelector<HTMLInputElement>('.search-engine-modal-url')!.value = 'https://subtitle.example/search?q={{ID}}';
    document.querySelector<HTMLInputElement>('.search-engine-modal-icon')!.value = 'assets/alternate-search.png';
    document.querySelector<HTMLSelectElement>('.search-engine-modal-category')!.value = 'subtitle';
    document.querySelector<HTMLButtonElement>('.search-engine-modal-confirm')!.click();

    expect(document.querySelector('.search-engine-add-modal')).toBeNull();
    expect((STATE.settings.searchEngines as any[])).toHaveLength(initialCount + 1);
    expect((STATE.settings.searchEngines as any[]).at(-1)).toEqual(expect.objectContaining({
      name: '字幕站',
      urlTemplate: 'https://subtitle.example/search?q={{ID}}',
      icon: 'assets/alternate-search.png',
      category: 'subtitle',
    }));
  });
});
