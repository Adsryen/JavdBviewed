import { describe, expect, it } from 'vitest';

import { mergeEnhancementSettingsForSave } from '../src/dashboard/tabs/settings/enhancement/settings/enhancementSettingsMerge.ts';
import { DEFAULT_SETTINGS } from '../src/utils/config.ts';

describe('mergeEnhancementSettingsForSave', () => {
  it('preserves actor filter and preview volume fields', () => {
    const current = structuredClone(DEFAULT_SETTINGS);
    current.listEnhancement.hideBlacklistedActorsInList = true;
    current.listEnhancement.hideNonFavoritedActorsInList = true;
    current.listEnhancement.hideUnrecognizedActorsInList = false;
    current.listEnhancement.treatSubscribedAsFavorited = false;
    current.listEnhancement.previewVolume = 0.42;
    current.listEnhancement.listDisplayControl = {
      enabled: true,
      columnCount: 6,
      containerWidth: 120,
      enableContainerExpansion: true,
    };

    const merged = mergeEnhancementSettingsForSave(current, {
      enableListEnhancement: true,
      enableActorEnhancement: true,
      enableTranslation: false,
      enableContentFilter: false,
      enableMagnetSearch: false,
      enableAnchorOptimization: false,
      enablePasswordHelper: false,
    } as any);

    expect(merged.listEnhancement?.previewVolume).toBe(0.42);
    expect(merged.listEnhancement?.hideBlacklistedActorsInList).toBe(true);
    expect(merged.listEnhancement?.hideNonFavoritedActorsInList).toBe(true);
    expect(merged.listEnhancement?.hideUnrecognizedActorsInList).toBe(false);
    expect(merged.listEnhancement?.treatSubscribedAsFavorited).toBe(false);
    expect(merged.listEnhancement?.listDisplayControl?.columnCount).toBe(6);
    expect(merged.listEnhancement?.listDisplayControl?.containerWidth).toBe(120);
  });

  it('persists the list status quick action toggle with a default off value', () => {
    const current = structuredClone(DEFAULT_SETTINGS);

    const defaultMerged = mergeEnhancementSettingsForSave(current, {} as any);
    const enabledMerged = mergeEnhancementSettingsForSave(current, {
      enableStatusQuickAction: { checked: true },
    } as any);

    expect(defaultMerged.listEnhancement?.enableStatusQuickAction).toBe(false);
    expect(enabledMerged.listEnhancement?.enableStatusQuickAction).toBe(true);
  });

  it('persists the online availability failure tag toggle with a default off value', () => {
    const current = structuredClone(DEFAULT_SETTINGS);

    const defaultMerged = mergeEnhancementSettingsForSave(current, {} as any);
    const enabledMerged = mergeEnhancementSettingsForSave(current, {
      veShowOnlineAvailabilityFailures: { checked: true },
    } as any);

    expect(defaultMerged.videoEnhancement?.showOnlineAvailabilityFailures).toBe(false);
    expect(enabledMerged.videoEnhancement?.showOnlineAvailabilityFailures).toBe(true);
  });

  it('persists the detail subtitle search toggle with a default on value', () => {
    const current = structuredClone(DEFAULT_SETTINGS);

    const defaultMerged = mergeEnhancementSettingsForSave(current, {} as any);
    const disabledMerged = mergeEnhancementSettingsForSave(current, {
      veEnableSubtitleSearch: { checked: false },
    } as any);

    expect(defaultMerged.videoEnhancement?.enableSubtitleSearch).toBe(true);
    expect(disabledMerged.videoEnhancement?.enableSubtitleSearch).toBe(false);
  });

  it('persists the detail external entry toggles with default on values', () => {
    const current = structuredClone(DEFAULT_SETTINGS);

    const defaultMerged = mergeEnhancementSettingsForSave(current, {} as any);
    const disabledMerged = mergeEnhancementSettingsForSave(current, {
      veEnableExternalEntryPanel: { checked: false },
      veEnableExternalSearch: { checked: false },
    } as any);

    expect(defaultMerged.videoEnhancement?.enableExternalEntryPanel).toBe(true);
    expect(defaultMerged.videoEnhancement?.enableExternalSearch).toBe(true);
    expect(disabledMerged.videoEnhancement?.enableExternalEntryPanel).toBe(false);
    expect(disabledMerged.videoEnhancement?.enableExternalSearch).toBe(false);
  });

  it('persists online availability site enabled states from checkbox controls', () => {
    const current = structuredClone(DEFAULT_SETTINGS);

    const merged = mergeEnhancementSettingsForSave(current, {
      onlineAvailabilitySiteInputs: [
        { dataset: { siteKey: 'missav' }, checked: false },
        { dataset: { siteKey: 'jable' }, checked: true },
      ],
    } as any);

    expect(merged.videoEnhancement?.onlineAvailabilitySites).toEqual({
      missav: false,
      jable: true,
    });
  });
});
