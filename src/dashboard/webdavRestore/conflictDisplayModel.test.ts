import { describe, expect, it } from 'vitest';
import {
  buildConflictModalHideState,
  buildConflictModalShowState,
  buildConflictDisplayState,
} from './conflictDisplayModel';

describe('WebDAV restore conflict display model', () => {
  it('builds display state for current conflict', () => {
    const state = buildConflictDisplayState({
      conflicts: [
        {
          id: 'AAA-001',
          local: { updatedAt: Date.UTC(2026, 4, 30, 1, 2, 3) },
          cloud: { updatedAt: Date.UTC(2026, 4, 31, 4, 5, 6) },
          recommendation: 'cloud',
        },
      ],
      currentIndex: 0,
      conflictType: 'video',
      resolutions: {},
    });

    expect(state).toMatchObject({
      currentIndexText: '1',
      title: 'AAA-001',
      typeLabel: '视频记录',
      localTime: expect.stringContaining('2026'),
      cloudTime: expect.stringContaining('2026'),
      selectedResolution: 'cloud',
    });
    expect(state?.conflict.id).toBe('AAA-001');
  });

  it('uses saved resolution before recommendation and merge fallback', () => {
    expect(buildConflictDisplayState({
      conflicts: [{ id: 'AAA-001', recommendation: 'cloud' }],
      currentIndex: 0,
      conflictType: 'actor',
      resolutions: { 'AAA-001': 'local' },
    })?.selectedResolution).toBe('local');

    expect(buildConflictDisplayState({
      conflicts: [{ id: 'AAA-002' }],
      currentIndex: 0,
      conflictType: 'actor',
      resolutions: {},
    })?.selectedResolution).toBe('merge');
  });

  it('returns null when conflict index is out of range', () => {
    expect(buildConflictDisplayState({
      conflicts: [],
      currentIndex: 0,
      conflictType: 'video',
      resolutions: {},
    })).toBeNull();

    expect(buildConflictDisplayState({
      conflicts: [{ id: 'AAA-001' }],
      currentIndex: 2,
      conflictType: 'video',
      resolutions: {},
    })).toBeNull();
  });

  it('builds conflict modal show and hide states', () => {
    expect(buildConflictModalShowState()).toEqual({
      modalId: 'conflictResolutionModal',
      classNamesToAdd: ['visible'],
      classNamesToRemove: ['hidden'],
    });

    expect(buildConflictModalHideState()).toEqual({
      modalId: 'conflictResolutionModal',
      classNamesToAdd: ['hidden'],
      classNamesToRemove: ['visible'],
    });
  });
});
