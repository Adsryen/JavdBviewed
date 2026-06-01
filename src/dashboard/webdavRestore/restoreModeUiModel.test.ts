import { describe, expect, it } from 'vitest';
import {
  buildRestoreInterfaceCleanupState,
  buildRestoreModeSwitchState,
} from './restoreModeUiModel';

describe('WebDAV restore mode UI model', () => {
  it('builds state for switching restore mode tabs and content', () => {
    expect(buildRestoreModeSwitchState('wizard')).toEqual({
      mode: 'wizard',
      tabSelector: '.mode-tab',
      tabModeAttribute: 'data-mode',
      contentSelector: '.restore-mode-content',
      targetContentId: 'wizardMode',
      activeClassName: 'active',
    });
  });

  it('builds cleanup state for legacy expert preview elements', () => {
    expect(buildRestoreInterfaceCleanupState()).toEqual({
      elementIdsToRemove: ['expertImpactPreview'],
      selectorsToRemove: [
        '#impactSummary',
        '.impact-preview',
      ],
    });
  });
});
