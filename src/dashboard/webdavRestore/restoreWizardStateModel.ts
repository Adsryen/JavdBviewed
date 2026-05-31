export interface WizardNavigationState {
  previousDisabled: boolean;
  nextHidden: boolean;
  startHidden: boolean;
}

export interface WizardStepValidationInput {
  currentStep: number;
  strategy: string;
  selectedContentCount: number;
}

export function buildWizardStepClassNames(currentStep: number, totalSteps: number): string[] {
  return Array.from({ length: Math.max(totalSteps, 0) }, (_, index) => {
    const stepNumber = index + 1;

    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return '';
  });
}

export function buildWizardNavigationState(currentStep: number, totalSteps: number): WizardNavigationState {
  const isLastStep = currentStep === totalSteps;

  return {
    previousDisabled: currentStep === 1,
    nextHidden: isLastStep,
    startHidden: !isLastStep,
  };
}

export function canProceedFromWizardStep(input: WizardStepValidationInput): boolean {
  switch (input.currentStep) {
    case 1:
      return Boolean(input.strategy);
    case 2:
      return input.selectedContentCount > 0;
    case 3:
      return true;
    default:
      return false;
  }
}
