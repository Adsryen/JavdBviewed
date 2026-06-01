export type RestoreMode = 'quick' | 'wizard' | 'expert';

export interface RestoreModeSwitchState {
  mode: RestoreMode;
  tabSelector: string;
  tabModeAttribute: string;
  contentSelector: string;
  targetContentId: string;
  activeClassName: string;
}

export interface RestoreInterfaceCleanupState {
  elementIdsToRemove: string[];
  selectorsToRemove: string[];
}

export function buildRestoreModeSwitchState(mode: RestoreMode): RestoreModeSwitchState {
  return {
    mode,
    tabSelector: '.mode-tab',
    tabModeAttribute: 'data-mode',
    contentSelector: '.restore-mode-content',
    targetContentId: `${mode}Mode`,
    activeClassName: 'active',
  };
}

export function buildRestoreInterfaceCleanupState(): RestoreInterfaceCleanupState {
  return {
    elementIdsToRemove: ['expertImpactPreview'],
    selectorsToRemove: [
      '#impactSummary',
      '.impact-preview',
    ],
  };
}
