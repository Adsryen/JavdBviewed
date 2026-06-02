import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActorPagedSearchResult, ActorRecord } from '../../src/types';
import { renderActorListRuntime } from '../../src/dashboard/tabs/actors/actorListRuntime';

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Alice',
    aliases: [],
    gender: 'female',
    category: 'censored',
    profileUrl: 'https://javdb.com/actors/actor-1',
    avatarUrl: 'https://img.example.com/a.jpg',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function result(actors: ActorRecord[]): ActorPagedSearchResult {
  return {
    actors,
    total: actors.length,
    page: 1,
    pageSize: 20,
    hasMore: false,
  };
}

describe('actor list runtime', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'IntersectionObserver');
  });

  it('renders empty state for filtered search without touching batch ui', () => {
    const container = document.createElement('div');
    const updateBatchUi = vi.fn();

    renderActorListRuntime(container, result([]), {
      currentQuery: 'alice',
      currentViewMode: 'list',
      selectedActorIds: new Set(),
      subscribedActorIds: new Set(),
      showBlacklistBadge: false,
      openActorWorks: vi.fn(),
      selectActor: vi.fn(),
      setupActorCard: vi.fn(),
      updateBatchUi,
    });

    expect(container.querySelector('.no-actors-text')?.textContent?.trim()).toBe('未找到匹配的演员');
    expect(updateBatchUi).not.toHaveBeenCalled();
  });

  it('renders cards, avatar shell, selected state and click selection', () => {
    const container = document.createElement('div');
    const selectActor = vi.fn();
    const setupActorCard = vi.fn();
    const updateBatchUi = vi.fn();

    renderActorListRuntime(container, result([actor()]), {
      currentQuery: '',
      currentViewMode: 'list',
      selectedActorIds: new Set(['actor-1']),
      subscribedActorIds: new Set(['actor-1']),
      showBlacklistBadge: true,
      openActorWorks: vi.fn(),
      selectActor,
      setupActorCard,
      updateBatchUi,
    });

    const card = container.querySelector<HTMLElement>('.actor-card[data-actor-id="actor-1"]')!;
    expect(container.classList.contains('list-view')).toBe(true);
    expect(container.querySelector('.actor-list')).toBeTruthy();
    expect(container.querySelector('.actor-subscribed-icon')).toBeTruthy();
    expect(card.classList.contains('selected')).toBe(true);
    expect(card.getAttribute('data-has-avatar')).toBe('true');
    expect(card.style.getPropertyValue('--avatar-bg')).toContain('https://img.example.com/a.jpg');
    expect(setupActorCard).toHaveBeenCalledWith(expect.objectContaining({ id: 'actor-1' }));
    expect(updateBatchUi).toHaveBeenCalledTimes(1);

    card.querySelector<HTMLElement>('.actor-works-btn')?.click();
    expect(selectActor).not.toHaveBeenCalled();

    card.click();
    expect(selectActor).toHaveBeenCalledWith('actor-1', false);
  });

  it('removes list-view class in card mode', () => {
    const container = document.createElement('div');
    container.classList.add('list-view');

    renderActorListRuntime(container, result([actor({ id: 'actor-2', name: 'Beth', avatarUrl: undefined })]), {
      currentQuery: '',
      currentViewMode: 'card',
      selectedActorIds: new Set(),
      subscribedActorIds: new Set(),
      showBlacklistBadge: false,
      openActorWorks: vi.fn(),
      selectActor: vi.fn(),
      setupActorCard: vi.fn(),
      updateBatchUi: vi.fn(),
    });

    expect(container.classList.contains('list-view')).toBe(false);
    expect(container.querySelector('.actor-grid')).toBeTruthy();
  });
});
