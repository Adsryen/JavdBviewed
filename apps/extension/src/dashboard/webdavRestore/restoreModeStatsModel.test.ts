import { describe, expect, it } from 'vitest';
import {
  buildRestoreModeStatItems,
  calculateRestoreModeConflictCount,
} from './restoreModeStatsModel';

const diffResult: any = {
  videoRecords: {
    summary: {
      totalLocal: 1200,
      conflictCount: 7,
    },
  },
  actorRecords: {
    summary: {
      totalLocal: 80,
      conflictCount: 2,
    },
  },
  newWorks: {
    subscriptions: {
      summary: {
        totalLocal: 5,
        conflictCount: 1,
      },
    },
    records: {
      summary: {
        totalLocal: 9,
        conflictCount: 4,
      },
    },
  },
};

describe('WebDAV restore mode stats model', () => {
  it('calculates conflict count across records, actors and new works', () => {
    expect(calculateRestoreModeConflictCount(diffResult)).toBe(14);
  });

  it('builds fixed stat target items for restore mode UI', () => {
    expect(buildRestoreModeStatItems(diffResult)).toEqual([
      { id: 'quickVideoCount', value: 1200 },
      { id: 'quickActorCount', value: 80 },
      { id: 'quickNewWorksSubsCount', value: 5 },
      { id: 'quickNewWorksRecsCount', value: 9 },
      { id: 'quickConflictCount', value: 14 },
    ]);
  });

  it('treats missing summary numbers as zero', () => {
    expect(buildRestoreModeStatItems({})).toEqual([
      { id: 'quickVideoCount', value: 0 },
      { id: 'quickActorCount', value: 0 },
      { id: 'quickNewWorksSubsCount', value: 0 },
      { id: 'quickNewWorksRecsCount', value: 0 },
      { id: 'quickConflictCount', value: 0 },
    ]);
  });
});
