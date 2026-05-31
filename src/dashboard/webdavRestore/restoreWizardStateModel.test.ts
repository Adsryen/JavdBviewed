import { describe, expect, it } from 'vitest';
import {
  buildWizardNavigationState,
  buildWizardStepClassNames,
  canProceedFromWizardStep,
} from './restoreWizardStateModel';

describe('WebDAV restore wizard state model', () => {
  it('builds step class names for current and completed steps', () => {
    expect(buildWizardStepClassNames(2, 3)).toEqual(['completed', 'active', '']);
  });

  it('builds navigation state for the first step', () => {
    expect(buildWizardNavigationState(1, 3)).toEqual({
      previousDisabled: true,
      nextHidden: false,
      startHidden: true,
    });
  });

  it('builds navigation state for the last step', () => {
    expect(buildWizardNavigationState(3, 3)).toEqual({
      previousDisabled: false,
      nextHidden: true,
      startHidden: false,
    });
  });

  it('validates wizard step progression', () => {
    expect(canProceedFromWizardStep({ currentStep: 1, strategy: 'smart', selectedContentCount: 0 })).toBe(true);
    expect(canProceedFromWizardStep({ currentStep: 1, strategy: '', selectedContentCount: 0 })).toBe(false);
    expect(canProceedFromWizardStep({ currentStep: 2, strategy: 'smart', selectedContentCount: 1 })).toBe(true);
    expect(canProceedFromWizardStep({ currentStep: 2, strategy: 'smart', selectedContentCount: 0 })).toBe(false);
    expect(canProceedFromWizardStep({ currentStep: 3, strategy: '', selectedContentCount: 0 })).toBe(true);
    expect(canProceedFromWizardStep({ currentStep: 99, strategy: 'smart', selectedContentCount: 1 })).toBe(false);
  });
});
