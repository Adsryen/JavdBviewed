import {
  formatTimestamp,
  getConflictTypeLabel,
  type ConflictDetailType,
} from './conflictDetailModel';
import type { ConflictResolution } from './conflictNavigationModel';

export interface ConflictDisplayInput {
  conflicts: any[];
  currentIndex: number;
  conflictType: ConflictDetailType;
  resolutions: Record<string, ConflictResolution>;
}

export interface ConflictDisplayState {
  conflict: any;
  currentIndexText: string;
  title: string;
  typeLabel: string;
  localTime?: string;
  cloudTime?: string;
  selectedResolution: ConflictResolution;
}

export interface ConflictModalVisibilityState {
  modalId: string;
  classNamesToAdd: string[];
  classNamesToRemove: string[];
}

export function buildConflictDisplayState(input: ConflictDisplayInput): ConflictDisplayState | null {
  const conflict = input.conflicts[input.currentIndex];
  if (!conflict) return null;

  return {
    conflict,
    currentIndexText: String(input.currentIndex + 1),
    title: String(conflict.id ?? ''),
    typeLabel: getConflictTypeLabel(input.conflictType),
    localTime: conflict.local?.updatedAt ? formatTimestamp(conflict.local.updatedAt) : undefined,
    cloudTime: conflict.cloud?.updatedAt ? formatTimestamp(conflict.cloud.updatedAt) : undefined,
    selectedResolution: input.resolutions[conflict.id] || conflict.recommendation || 'merge',
  };
}

export function buildConflictModalShowState(): ConflictModalVisibilityState {
  return {
    modalId: 'conflictResolutionModal',
    classNamesToAdd: ['visible'],
    classNamesToRemove: ['hidden'],
  };
}

export function buildConflictModalHideState(): ConflictModalVisibilityState {
  return {
    modalId: 'conflictResolutionModal',
    classNamesToAdd: ['hidden'],
    classNamesToRemove: ['visible'],
  };
}
