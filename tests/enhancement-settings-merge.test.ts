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
});
