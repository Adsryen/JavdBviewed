import type { ActorPagedSearchResult, ActorRecord, ActorSubscription } from '../../../types';

export type ActorBlacklistFilter = 'all' | 'exclude' | 'only';
export type ActorStatusFilterValue = ActorBlacklistFilter | 'sub_only' | 'sub_exclude';
export type ActorSortBy = 'name' | 'updatedAt' | 'worksCount';
export type ActorSortOrder = 'asc' | 'desc';

export interface ActorStatusFilterState {
  subscribedOnly: boolean;
  blacklistFilter: ActorBlacklistFilter;
}

export interface BuildSubscribedActorSearchResultInput {
  actors: ActorRecord[];
  subscriptions: Array<Pick<ActorSubscription, 'actorId'> & Partial<Pick<ActorSubscription, 'enabled'>>>;
  query: string;
  page: number;
  pageSize: number;
  sortBy: string;
  order: ActorSortOrder;
  genderFilter?: string;
  categoryFilter?: string;
  blacklistFilter: ActorBlacklistFilter;
}

export function buildActorStatusFilterValue(state: ActorStatusFilterState): ActorStatusFilterValue {
  if (state.subscribedOnly) {
    return state.blacklistFilter === 'exclude' ? 'sub_exclude' : 'sub_only';
  }
  return state.blacklistFilter;
}

export function resolveActorStatusFilterState(value: ActorStatusFilterValue): ActorStatusFilterState {
  switch (value) {
    case 'sub_only':
      return { subscribedOnly: true, blacklistFilter: 'all' };
    case 'sub_exclude':
      return { subscribedOnly: true, blacklistFilter: 'exclude' };
    case 'exclude':
      return { subscribedOnly: false, blacklistFilter: 'exclude' };
    case 'only':
      return { subscribedOnly: false, blacklistFilter: 'only' };
    case 'all':
    default:
      return { subscribedOnly: false, blacklistFilter: 'all' };
  }
}

export function buildSubscribedActorSearchResult(input: BuildSubscribedActorSearchResultInput): ActorPagedSearchResult {
  const subscribedActorIds = new Set(
    (input.subscriptions || [])
      .filter(subscription => subscription && subscription.enabled !== false)
      .map(subscription => subscription.actorId),
  );

  let actors = (input.actors || []).filter(actor => subscribedActorIds.has(actor.id));
  const lowerQuery = (input.query || '').trim().toLowerCase();
  if (lowerQuery) {
    actors = actors.filter(actor =>
      (actor.name || '').toLowerCase().includes(lowerQuery)
      || (Array.isArray(actor.aliases) && actor.aliases.some(alias => String(alias).toLowerCase().includes(lowerQuery))),
    );
  }
  if (input.genderFilter) actors = actors.filter(actor => actor.gender === input.genderFilter);
  if (input.categoryFilter) actors = actors.filter(actor => actor.category === input.categoryFilter);
  if (input.blacklistFilter === 'exclude') actors = actors.filter(actor => !actor.blacklisted);
  if (input.blacklistFilter === 'only') actors = actors.filter(actor => !!actor.blacklisted);

  const sortBy = normalizeActorSortBy(input.sortBy);
  const sortDirection = input.order === 'desc' ? -1 : 1;
  actors = [...actors].sort((a, b) => compareActors(a, b, sortBy, sortDirection));

  const page = Math.max(1, Number(input.page) || 1);
  const pageSize = Math.max(1, Number(input.pageSize) || 20);
  const total = actors.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    actors: actors.slice(start, end),
    total,
    page,
    pageSize,
    hasMore: end < total,
  };
}

function normalizeActorSortBy(sortBy: string): ActorSortBy {
  if (sortBy === 'updatedAt' || sortBy === 'worksCount') {
    return sortBy;
  }
  return 'name';
}

function compareActors(a: ActorRecord, b: ActorRecord, sortBy: ActorSortBy, sortDirection: 1 | -1): number {
  const aValue = getActorSortValue(a, sortBy);
  const bValue = getActorSortValue(b, sortBy);

  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return sortDirection === 1 ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  }

  return sortDirection === 1
    ? Number(aValue) - Number(bValue)
    : Number(bValue) - Number(aValue);
}

function getActorSortValue(actor: ActorRecord, sortBy: ActorSortBy): string | number {
  switch (sortBy) {
    case 'updatedAt':
      return actor.updatedAt || 0;
    case 'worksCount':
      return actor.details?.worksCount || 0;
    case 'name':
    default:
      return (actor.name || '').toLowerCase();
  }
}
