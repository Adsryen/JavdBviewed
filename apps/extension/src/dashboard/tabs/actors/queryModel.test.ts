import { describe, expect, it } from 'vitest';
import type { ActorRecord, ActorSubscription } from '../../../types';
import {
  buildActorStatusFilterValue,
  buildSubscribedActorSearchResult,
  resolveActorStatusFilterState,
} from './queryModel';

function actor(overrides: Partial<ActorRecord> & Pick<ActorRecord, 'id' | 'name'>): ActorRecord {
  return {
    aliases: [],
    gender: 'female',
    category: 'censored',
    profileUrl: `https://javdb.com/actors/${overrides.id}`,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function subscription(actorId: string, enabled = true): ActorSubscription {
  return {
    actorId,
    actorName: actorId,
    subscribedAt: 1,
    enabled,
  };
}

describe('actors query model', () => {
  it('maps status filter values to blacklist and subscription state', () => {
    expect(resolveActorStatusFilterState('sub_exclude')).toEqual({
      subscribedOnly: true,
      blacklistFilter: 'exclude',
    });
    expect(resolveActorStatusFilterState('only')).toEqual({
      subscribedOnly: false,
      blacklistFilter: 'only',
    });
    expect(buildActorStatusFilterValue({ subscribedOnly: true, blacklistFilter: 'exclude' })).toBe('sub_exclude');
    expect(buildActorStatusFilterValue({ subscribedOnly: false, blacklistFilter: 'all' })).toBe('all');
  });

  it('filters enabled subscriptions, query, gender, category and blacklist before sorting and paging', () => {
    const result = buildSubscribedActorSearchResult({
      actors: [
        actor({ id: 'a', name: 'Alice', aliases: ['Queen'], updatedAt: 30, details: { worksCount: 2 } }),
        actor({ id: 'b', name: 'Beth', aliases: ['Needle'], updatedAt: 20, details: { worksCount: 7 } }),
        actor({ id: 'c', name: 'Cara', aliases: ['Queen Bee'], category: 'uncensored', updatedAt: 10, details: { worksCount: 9 } }),
        actor({ id: 'd', name: 'Dana', aliases: ['Queen'], blacklisted: true, updatedAt: 40, details: { worksCount: 4 } }),
        actor({ id: 'e', name: 'Erin', aliases: ['Queen'], gender: 'male', updatedAt: 50, details: { worksCount: 5 } }),
      ],
      subscriptions: [
        subscription('a'),
        subscription('b', false),
        subscription('c'),
        subscription('d'),
        subscription('e'),
      ],
      query: 'queen',
      page: 1,
      pageSize: 1,
      sortBy: 'worksCount',
      order: 'desc',
      genderFilter: 'female',
      categoryFilter: 'censored',
      blacklistFilter: 'exclude',
    });

    expect(result).toEqual({
      actors: [expect.objectContaining({ id: 'a' })],
      total: 1,
      page: 1,
      pageSize: 1,
      hasMore: false,
    });
  });

  it('paginates subscribed actors and reports hasMore', () => {
    const result = buildSubscribedActorSearchResult({
      actors: [
        actor({ id: 'a', name: 'A', updatedAt: 1 }),
        actor({ id: 'b', name: 'B', updatedAt: 2 }),
        actor({ id: 'c', name: 'C', updatedAt: 3 }),
      ],
      subscriptions: [subscription('a'), subscription('b'), subscription('c')],
      query: '',
      page: 2,
      pageSize: 1,
      sortBy: 'updatedAt',
      order: 'desc',
      blacklistFilter: 'all',
    });

    expect(result.actors.map(item => item.id)).toEqual(['b']);
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(true);
  });
});
