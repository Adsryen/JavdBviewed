import { describe, expect, it } from 'vitest';
import {
  applyBatchConflictResolution,
  buildConflictNavigationState,
  calculateConflictProgressPercent,
} from './conflictNavigationModel';

describe('WebDAV restore conflict navigation model', () => {
  it('calculates conflict progress percent from the current index', () => {
    expect(calculateConflictProgressPercent(0, 4)).toBe(25);
    expect(calculateConflictProgressPercent(1, 4)).toBe(50);
    expect(calculateConflictProgressPercent(3, 4)).toBe(100);
  });

  it('returns zero progress when there are no conflicts', () => {
    expect(calculateConflictProgressPercent(0, 0)).toBe(0);
  });

  it('builds conflict navigation button state', () => {
    expect(buildConflictNavigationState(0, 3)).toEqual({
      previousDisabled: true,
      nextDisabled: false,
    });
    expect(buildConflictNavigationState(1, 3)).toEqual({
      previousDisabled: false,
      nextDisabled: false,
    });
    expect(buildConflictNavigationState(2, 3)).toEqual({
      previousDisabled: false,
      nextDisabled: true,
    });
  });

  it('applies a batch conflict resolution while preserving existing keys', () => {
    expect(applyBatchConflictResolution({
      conflicts: [{ id: 'a' }, { id: 'b' }],
      existingResolutions: { old: 'cloud' },
      resolution: 'local',
    })).toEqual({
      old: 'cloud',
      a: 'local',
      b: 'local',
    });
  });
});
