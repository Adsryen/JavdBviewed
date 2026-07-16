/**
 * @file listSortingSettings.test.ts
 * @description 列表排序增强设置绑定测试
 * @module tests/dom
 */
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STATE } from '../../apps/extension/src/dashboard/state';
import { bindEvents } from '../../apps/extension/src/dashboard/tabs/settings/enhancement/binding/enhancementBindEvents';
import { doLoadSettings } from '../../apps/extension/src/dashboard/tabs/settings/enhancement/settings/enhancementLoad';
import { doGetSettings } from '../../apps/extension/src/dashboard/tabs/settings/enhancement/settings/enhancementSettingsSync';

function checkbox(checked = false): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  return input;
}

function select(values: string[], value: string): HTMLSelectElement {
  const element = document.createElement('select');
  values.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    element.appendChild(option);
  });
  element.value = value;
  return element;
}

function createHost(): Record<string, unknown> {
  return {
    enableTranslation: checkbox(),
    enableContentFilter: checkbox(),
    enableMagnetSearch: checkbox(),
    enableAnchorOptimization: checkbox(),
    enableListEnhancement: checkbox(true),
    enableActorEnhancement: checkbox(),
    enablePasswordHelper: checkbox(),
    enableSuperRanking: checkbox(true),
    passwordShowMethod: select(['0'], '0'),
    passwordWaitTime: document.createElement('input'),
    magnetSourceSukebei: checkbox(true),
    magnetSourceBtdig: checkbox(true),
    magnetSourceBtsow: checkbox(true),
    magnetSourceTorrentz2: checkbox(),
    magnetSourceJavbus: checkbox(),
    magnetBlockMojContent: checkbox(true),
    magnetAutoSearch: checkbox(),
    magnetSortMode: select(['default'], 'default'),
    enableListSorting: checkbox(),
    listSortingAppendStrategy: select(['prompt', 'auto-resort'], 'prompt'),
    listSortingAutoResortPosition: select(['preserve', 'top'], 'preserve'),
    renderFilterRules: () => {},
    mountTranslationConfigIntoVideoBlock: () => {},
    toggleConfigSections: () => {},
    injectMagnetConcurrencyControls: () => {},
    initEnhancementToggles: () => {},
    updateAllToggleStates: () => {},
    bindSubtabLinks: () => {},
    bindOrchestratorControls: () => {},
    switchSubtab: () => {},
    setupVolumeControlStyles: () => {},
    setupAnchorConfigStyles: () => {},
    setupCheckboxGroupStyles: () => {},
    initializeActorEnhancementEvents: () => {},
    setupSubSettingsHoverBehavior: () => {},
  };
}

describe('list sorting settings', () => {
  it('renders the sorting card under other enhancements with stacked subsettings', () => {
    const partialPath = path.resolve(process.cwd(), 'apps/extension/src/dashboard/partials/tabs/settings-enhancement.html');
    document.body.innerHTML = fs.readFileSync(partialPath, 'utf8');

    const sortingToggle = document.querySelector<HTMLElement>('[data-target="enableListSorting"]');
    const sortingCard = sortingToggle?.closest<HTMLElement>('.form-group');
    const sortingStatus = sortingCard?.querySelector<HTMLElement>('.enhancement-feature-status.beta');
    const sortingOptionsRow = document.querySelector<HTMLElement>('#listSortingConfig .list-sorting-options-stack');

    expect(sortingCard?.getAttribute('data-subtab')).toBe('other');
    expect(sortingCard?.textContent).toContain('排序增强');
    expect(sortingStatus?.textContent?.trim()).toBe('beta');
    expect(sortingOptionsRow).not.toBeNull();
    expect(sortingOptionsRow?.querySelectorAll('.list-sorting-option-row')).toHaveLength(2);
  });

  it('keeps list sorting subsetting selects compact inside each row', () => {
    const cssPath = path.resolve(process.cwd(), 'apps/extension/src/dashboard/styles/05-pages/settings/enhancement.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('#enhancement-settings .list-sorting-option-row');
    expect(css).toContain('flex-wrap: wrap');
    expect(css).toContain('#enhancement-settings .list-sorting-option-row .select-input');
    expect(css).toContain('width: auto');
    expect(css).toContain('max-width: 100%');
    expect(css).not.toContain('#enhancement-settings .list-sorting-options-stack .form-group-inline {\n    width: 100%;\n}');
  });

  it('loads and reads list sorting config through enhancement settings', async () => {
    const host = createHost();
    STATE.settings = {
      dataEnhancement: {},
      userExperience: {},
      magnetSearch: { sources: {} },
      listEnhancement: {
        sorting: {
          enabled: true,
          appendStrategy: 'auto-resort',
          autoResortPosition: 'top',
        },
      },
    };

    await doLoadSettings(host);

    expect((host.enableListSorting as HTMLInputElement).checked).toBe(true);
    expect((host.listSortingAppendStrategy as HTMLSelectElement).value).toBe('auto-resort');
    expect((host.listSortingAutoResortPosition as HTMLSelectElement).value).toBe('top');

    (host.enableListSorting as HTMLInputElement).checked = false;
    (host.listSortingAppendStrategy as HTMLSelectElement).value = 'prompt';
    (host.listSortingAutoResortPosition as HTMLSelectElement).value = 'preserve';

    const settings = doGetSettings(host);

    expect((settings.listEnhancement as any).sorting).toEqual({
      enabled: false,
      appendStrategy: 'prompt',
      autoResortPosition: 'preserve',
    });
  });

  it('autosaves when list sorting subsettings change', () => {
    const host = {
      ...createHost(),
      handleSettingChange: vi.fn(),
    };

    bindEvents(host);

    (host.listSortingAppendStrategy as HTMLSelectElement).value = 'auto-resort';
    (host.listSortingAppendStrategy as HTMLSelectElement).dispatchEvent(new Event('change'));
    (host.listSortingAutoResortPosition as HTMLSelectElement).value = 'top';
    (host.listSortingAutoResortPosition as HTMLSelectElement).dispatchEvent(new Event('change'));

    expect(host.handleSettingChange).toHaveBeenCalledTimes(2);
  });
});
