/**
 * @file displaySettingsModel.test.ts
 * @description 显示设置模型：默认值与映射
 * @module apps/dashboard/pages/settings/display
 */
import { describe, expect, it } from 'vitest';
import {
  applyDisplayFormToSettings,
  DEFAULT_DISPLAY_SETTINGS_FORM,
  mapSettingsToDisplayForm,
  type DisplaySettingsFormState,
} from './displaySettingsModel';

describe('displaySettingsModel', () => {
  it('defaults match legacy: display false, two list flags true', () => {
    expect(DEFAULT_DISPLAY_SETTINGS_FORM).toEqual({
      hideViewed: false,
      hideBrowsed: false,
      hideVR: false,
      hideWant: false,
      hideBlacklistedActorsInList: false,
      hideNonFavoritedActorsInList: false,
      hideUnrecognizedActorsInList: true,
      treatSubscribedAsFavorited: true,
    });
  });

  it('maps empty / undefined settings to defaults', () => {
    expect(mapSettingsToDisplayForm(undefined)).toEqual(DEFAULT_DISPLAY_SETTINGS_FORM);
    expect(mapSettingsToDisplayForm({})).toEqual(DEFAULT_DISPLAY_SETTINGS_FORM);
    expect(mapSettingsToDisplayForm({ display: {}, listEnhancement: {} })).toEqual(
      DEFAULT_DISPLAY_SETTINGS_FORM,
    );
  });

  it('maps explicit display and listEnhancement fields', () => {
    const form = mapSettingsToDisplayForm({
      display: {
        hideViewed: true,
        hideBrowsed: true,
        hideVR: false,
        hideWant: true,
      },
      listEnhancement: {
        hideBlacklistedActorsInList: true,
        hideNonFavoritedActorsInList: true,
        hideUnrecognizedActorsInList: false,
        treatSubscribedAsFavorited: false,
      },
    });
    expect(form).toEqual({
      hideViewed: true,
      hideBrowsed: true,
      hideVR: false,
      hideWant: true,
      hideBlacklistedActorsInList: true,
      hideNonFavoritedActorsInList: true,
      hideUnrecognizedActorsInList: false,
      treatSubscribedAsFavorited: false,
    });
  });

  it('treats undefined hideUnrecognized / treatSubscribed as true', () => {
    const form = mapSettingsToDisplayForm({
      listEnhancement: {
        hideBlacklistedActorsInList: true,
      },
    });
    expect(form.hideUnrecognizedActorsInList).toBe(true);
    expect(form.treatSubscribedAsFavorited).toBe(true);
    expect(form.hideBlacklistedActorsInList).toBe(true);
  });

  it('merges form back into settings without dropping other listEnhancement keys', () => {
    const form: DisplaySettingsFormState = {
      ...DEFAULT_DISPLAY_SETTINGS_FORM,
      hideViewed: true,
      hideUnrecognizedActorsInList: false,
    };
    const next = applyDisplayFormToSettings(
      {
        display: { hideViewed: false },
        listEnhancement: {
          enableStatusButtons: true,
          hideUnrecognizedActorsInList: true,
        },
      } as any,
      form,
    );
    expect(next.display.hideViewed).toBe(true);
    expect(next.listEnhancement.hideUnrecognizedActorsInList).toBe(false);
    expect(next.listEnhancement.enableStatusButtons).toBe(true);
  });
});
