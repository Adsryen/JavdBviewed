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
    expect(bundledItem?.querySelector<HTMLInputElement>('.url-template-input')?.disabled).toBe(true);
    expect(bundledItem?.querySelector<HTMLInputElement>('.icon-url-input')?.disabled).toBe(true);
    expect(bundledItem?.querySelector<HTMLButtonElement>('.delete-engine')?.disabled).toBe(true);

    expect(customItem?.classList.contains('is-bundled')).toBe(false);
    expect(customItem?.querySelector<HTMLInputElement>('.name-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLInputElement>('.url-template-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLInputElement>('.icon-url-input')?.disabled).toBe(false);
    expect(customItem?.querySelector<HTMLButtonElement>('.delete-engine')?.disabled).toBe(false);
  });
});
