export type ConflictResolution = 'local' | 'cloud' | 'merge';

export interface ConflictNavigationState {
  previousDisabled: boolean;
  nextDisabled: boolean;
}

export interface ConflictLike {
  id: string;
}

export function calculateConflictProgressPercent(currentIndex: number, totalConflicts: number): number {
  if (totalConflicts <= 0) return 0;

  const percent = ((currentIndex + 1) / totalConflicts) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function buildConflictNavigationState(currentIndex: number, totalConflicts: number): ConflictNavigationState {
  return {
    previousDisabled: currentIndex <= 0,
    nextDisabled: totalConflicts <= 0 || currentIndex >= totalConflicts - 1,
  };
}

export function applyBatchConflictResolution(input: {
  conflicts: ConflictLike[];
  existingResolutions: Record<string, ConflictResolution>;
  resolution: ConflictResolution;
}): Record<string, ConflictResolution> {
  const nextResolutions = { ...input.existingResolutions };

  input.conflicts.forEach(conflict => {
    nextResolutions[conflict.id] = input.resolution;
  });

  return nextResolutions;
}
