export type ConflictResolution = 'local' | 'cloud' | 'merge';

export interface ConflictNavigationState {
  previousDisabled: boolean;
  nextDisabled: boolean;
}

export interface ConflictProgressStyle {
  width: string;
  display: string;
  height: string;
  background: string;
  transition: string;
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

export function buildConflictProgressStyle(currentIndex: number, totalConflicts: number): ConflictProgressStyle {
  const progress = calculateConflictProgressPercent(currentIndex, totalConflicts);

  return {
    width: `${progress}%`,
    display: 'block',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.4s ease',
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
