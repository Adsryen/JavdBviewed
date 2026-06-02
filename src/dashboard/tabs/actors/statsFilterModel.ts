import type { ActorBlacklistFilter, ActorSortOrder } from './queryModel';

export interface ActorStatsCardFilterState {
  query: string;
  genderFilter: string;
  categoryFilter: string;
  blacklistFilter: ActorBlacklistFilter;
  sortBy?: 'updatedAt';
  order?: ActorSortOrder;
}

export function resolveActorStatsCardFilter(filterType: string | null): ActorStatsCardFilterState | null {
  switch (filterType) {
    case 'all':
      return createBaseState();
    case 'female':
    case 'male':
      return {
        ...createBaseState(),
        genderFilter: filterType,
      };
    case 'censored':
    case 'uncensored':
      return {
        ...createBaseState(),
        categoryFilter: filterType,
      };
    case 'blacklisted':
      return {
        ...createBaseState(),
        blacklistFilter: 'only',
      };
    case 'recentlyAdded':
      return {
        ...createBaseState(),
        sortBy: 'updatedAt',
        order: 'desc',
      };
    default:
      return null;
  }
}

function createBaseState(): ActorStatsCardFilterState {
  return {
    query: '',
    genderFilter: '',
    categoryFilter: '',
    blacklistFilter: 'exclude',
  };
}
