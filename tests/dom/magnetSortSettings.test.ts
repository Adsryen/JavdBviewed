/**
 * @file magnetSortSettings.test.ts
 * @description 磁力排序设置读写测试
 * @module tests/dom
 */
import { describe, expect, it, vi } from 'vitest';
import { STATE } from '../../src/dashboard/state';
import { bindEvents } from '../../src/dashboard/tabs/settings/enhancement/binding/enhancementBindEvents';
import { doLoadSettings } from '../../src/dashboard/tabs/settings/enhancement/settings/enhancementLoad';
import { doGetSettings } from '../../src/dashboard/tabs/settings/enhancement/settings/enhancementSettingsSync';

function checkbox(checked = false): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  return input;
}

function select(value = 'default'): HTMLSelectElement {
  const element = document.createElement('select');
  ['default', 'quality', 'seeders', 'size', 'date', 'subtitle'].forEach((mode) => {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = mode;
    element.appendChild(option);
  });
  element.value = value;
  return element;
}

function createHost(): Record<string, unknown> {
  return {
    enableTranslation: checkbox(),
    enableContentFilter: checkbox(),
    enableMagnetSearch: checkbox(true),
    enableAnchorOptimization: checkbox(),
    enableListEnhancement: checkbox(),
    enableActorEnhancement: checkbox(),
    enablePasswordHelper: checkbox(),
    enableSuperRanking: checkbox(true),
    passwordShowMethod: document.createElement('select'),
    passwordWaitTime: document.createElement('input'),
    magnetSourceSukebei: checkbox(true),
    magnetSourceBtdig: checkbox(true),
    magnetSourceBtsow: checkbox(true),
    magnetSourceTorrentz2: checkbox(),
    magnetSourceJavbus: checkbox(),
    magnetBlockMojContent: checkbox(true),
    magnetAutoSearch: checkbox(),
    magnetSortMode: select(),
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

describe('magnet sort settings', () => {
  it('loads and saves magnetSearch.sortMode through enhancement settings', async () => {
    const host = createHost();
    STATE.settings = {
      dataEnhancement: {},
      userExperience: {},
      listEnhancement: {},
      magnetSearch: {
        sources: { sukebei: true, btdig: true, btsow: true, torrentz2: false, javbus: false, custom: [] },
        sortMode: 'quality',
      },
    };

    await doLoadSettings(host);
    expect((host.magnetSortMode as HTMLSelectElement).value).toBe('quality');

    (host.magnetSortMode as HTMLSelectElement).value = 'seeders';
    const settings = doGetSettings(host);

    expect((settings.magnetSearch as { sortMode?: string }).sortMode).toBe('seeders');
  });

  it('falls back invalid saved magnetSearch.sortMode to the default option', async () => {
    const host = createHost();
    STATE.settings = {
      dataEnhancement: {},
      userExperience: {},
      listEnhancement: {},
      magnetSearch: {
        sources: { sukebei: true, btdig: true, btsow: true, torrentz2: false, javbus: false, custom: [] },
        sortMode: 'fork-custom-weight',
      },
    };

    await doLoadSettings(host);

    expect((host.magnetSortMode as HTMLSelectElement).value).toBe('default');
  });

  it('autosaves when magnet search subsettings change', () => {
    const host = {
      ...createHost(),
      handleSettingChange: vi.fn(),
    };

    bindEvents(host);

    (host.magnetSortMode as HTMLSelectElement).value = 'quality';
    (host.magnetSortMode as HTMLSelectElement).dispatchEvent(new Event('change'));
    (host.magnetAutoSearch as HTMLInputElement).checked = true;
    (host.magnetAutoSearch as HTMLInputElement).dispatchEvent(new Event('change'));
    (host.magnetBlockMojContent as HTMLInputElement).checked = false;
    (host.magnetBlockMojContent as HTMLInputElement).dispatchEvent(new Event('change'));

    expect(host.handleSettingChange).toHaveBeenCalledTimes(3);
  });
});
