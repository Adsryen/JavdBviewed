/**
 * @file listFavoriteQuickActionSettings.test.ts
 * @description 列表页收藏快捷入口设置绑定测试
 * @module tests/dom
 */
import { describe, expect, it, vi } from 'vitest';
import { STATE } from '../../src/dashboard/state';
import { bindEvents } from '../../src/dashboard/tabs/settings/enhancement/binding/enhancementBindEvents';
import { doLoadSettings } from '../../src/dashboard/tabs/settings/enhancement/settings/enhancementLoad';
import { doGetSettings } from '../../src/dashboard/tabs/settings/enhancement/settings/enhancementSettingsSync';
import { mergeEnhancementSettingsForSave } from '../../src/dashboard/tabs/settings/enhancement/settings/enhancementSettingsMerge';

function checkbox(checked = false): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  return input;
}

function select(): HTMLSelectElement {
  return document.createElement('select');
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
    passwordShowMethod: select(),
    passwordWaitTime: document.createElement('input'),
    magnetSourceSukebei: checkbox(true),
    magnetSourceBtdig: checkbox(true),
    magnetSourceBtsow: checkbox(true),
    magnetSourceTorrentz2: checkbox(),
    magnetSourceJavbus: checkbox(),
    magnetBlockMojContent: checkbox(true),
    magnetAutoSearch: checkbox(),
    magnetSortMode: select(),
    enableListFavoriteQuickAction: checkbox(),
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

describe('list favorite quick action settings', () => {
  it('loads and reads enableListFavoriteQuickAction through enhancement settings', async () => {
    const host = createHost();
    STATE.settings = {
      dataEnhancement: {},
      userExperience: {},
      magnetSearch: { sources: {} },
      listEnhancement: {
        enableListFavoriteQuickAction: true,
      },
    };

    await doLoadSettings(host);
    expect((host.enableListFavoriteQuickAction as HTMLInputElement).checked).toBe(true);

    (host.enableListFavoriteQuickAction as HTMLInputElement).checked = false;
    const settings = doGetSettings(host);

    expect((settings.listEnhancement as { enableListFavoriteQuickAction?: boolean }).enableListFavoriteQuickAction).toBe(false);
  });

  it('merges enableListFavoriteQuickAction into the saved list enhancement settings', () => {
    const host = createHost();
    (host.enableListFavoriteQuickAction as HTMLInputElement).checked = true;

    const settings = mergeEnhancementSettingsForSave({
      dataEnhancement: {},
      userExperience: {},
      videoEnhancement: {},
      listEnhancement: {
        enableListFavoriteQuickAction: false,
      },
    } as any, host);

    expect((settings.listEnhancement as { enableListFavoriteQuickAction?: boolean }).enableListFavoriteQuickAction).toBe(true);
  });

  it('autosaves when enableListFavoriteQuickAction changes', () => {
    const host = {
      ...createHost(),
      handleSettingChange: vi.fn(),
    };

    bindEvents(host);

    (host.enableListFavoriteQuickAction as HTMLInputElement).checked = true;
    (host.enableListFavoriteQuickAction as HTMLInputElement).dispatchEvent(new Event('change'));

    expect(host.handleSettingChange).toHaveBeenCalledTimes(1);
  });
});
