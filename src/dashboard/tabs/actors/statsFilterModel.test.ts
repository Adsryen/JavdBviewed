import { describe, expect, it } from 'vitest';
import { resolveActorStatsCardFilter } from './statsFilterModel';

describe('actors stats filter model', () => {
  it('resets filters to the default list for the all card', () => {
    expect(resolveActorStatsCardFilter('all')).toEqual({
      query: '',
      genderFilter: '',
      categoryFilter: '',
      blacklistFilter: 'exclude',
    });
  });

  it('maps gender, category and blacklist cards to filters', () => {
    expect(resolveActorStatsCardFilter('female')).toEqual({
      query: '',
      genderFilter: 'female',
      categoryFilter: '',
      blacklistFilter: 'exclude',
    });
    expect(resolveActorStatsCardFilter('uncensored')).toEqual({
      query: '',
      genderFilter: '',
      categoryFilter: 'uncensored',
      blacklistFilter: 'exclude',
    });
    expect(resolveActorStatsCardFilter('blacklisted')).toEqual({
      query: '',
      genderFilter: '',
      categoryFilter: '',
      blacklistFilter: 'only',
    });
  });

  it('sorts recently added actors by updatedAt descending', () => {
    expect(resolveActorStatsCardFilter('recentlyAdded')).toEqual({
      query: '',
      genderFilter: '',
      categoryFilter: '',
      blacklistFilter: 'exclude',
      sortBy: 'updatedAt',
      order: 'desc',
    });
  });

  it('returns null for unknown card filters', () => {
    expect(resolveActorStatsCardFilter('unknown')).toBeNull();
  });
});
