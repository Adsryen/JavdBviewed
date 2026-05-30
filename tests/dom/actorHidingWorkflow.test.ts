import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyActorBasedHiding,
} from '../../src/features/listEnhancement/application/actorHidingWorkflow';
import type { ActorRecord } from '../../src/types';

function createActor(id: string, name: string, overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id,
    name,
    aliases: [],
    gender: 'female',
    category: 'unknown',
    profileUrl: `https://javdb.com/actors/${id}`,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function createItem(actorIds: string[]): HTMLElement {
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = actorIds.map(id => `<a href="/actors/${id}">${id}</a>`).join('');
  document.body.appendChild(item);
  return item;
}

describe('actor hiding workflow', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('clears actor hiding when all actor filters are disabled', async () => {
    const item = createItem(['actor-a']);
    const clearActorOnlyHiding = vi.fn();

    await applyActorBasedHiding({
      item,
      videoInfo: { code: 'ABC-001', title: 'Sample', url: 'https://javdb.com/v/abc' },
      hideByBlacklist: false,
      hideByNonFavorited: false,
      hideUnrecognized: true,
      treatSubscribedAsFavorited: true,
      ensureActorIndex: vi.fn(),
      ensureSubscriptions: vi.fn(),
      getActorById: vi.fn(),
      hideItemByActor: vi.fn(),
      clearActorOnlyHiding,
      logger: vi.fn(),
    });

    expect(clearActorOnlyHiding).toHaveBeenCalledWith(item);
  });

  it('hides a list item when a DOM actor is blacklisted', async () => {
    const item = createItem(['actor-black']);
    const blacklisted = createActor('actor-black', 'Blocked Actor', { blacklisted: true });
    const hideItemByActor = vi.fn();

    await applyActorBasedHiding({
      item,
      videoInfo: { code: 'ABC-002', title: 'Sample', url: 'https://javdb.com/v/abc' },
      hideByBlacklist: true,
      hideByNonFavorited: true,
      hideUnrecognized: true,
      treatSubscribedAsFavorited: true,
      ensureActorIndex: vi.fn(async () => new Map()),
      ensureSubscriptions: vi.fn(async () => new Set()),
      getActorById: vi.fn(async () => blacklisted),
      hideItemByActor,
      clearActorOnlyHiding: vi.fn(),
      logger: vi.fn(),
    });

    expect(hideItemByActor).toHaveBeenCalledWith(item, 'ACTOR_BLACKLIST');
  });

  it('falls back to title matching when no DOM actor links exist', async () => {
    const item = createItem([]);
    const actor = createActor('actor-miho', 'Miho Nana');
    const clearActorOnlyHiding = vi.fn();

    await applyActorBasedHiding({
      item,
      videoInfo: { code: 'ABC-003', title: 'Great Movie Miho Nana', url: 'https://javdb.com/v/abc' },
      hideByBlacklist: true,
      hideByNonFavorited: true,
      hideUnrecognized: true,
      treatSubscribedAsFavorited: true,
      ensureActorIndex: vi.fn(async () => new Map([['miho nana', actor]])),
      ensureSubscriptions: vi.fn(async () => new Set()),
      getActorById: vi.fn(),
      hideItemByActor: vi.fn(),
      clearActorOnlyHiding,
      logger: vi.fn(),
    });

    expect(clearActorOnlyHiding).toHaveBeenCalledWith(item);
  });
});
