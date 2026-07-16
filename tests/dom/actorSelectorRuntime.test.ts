/**
 * @file actorSelectorRuntime.test.ts
 * @description 演员选择弹窗运行时测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActorSelector } from '../../apps/extension/src/dashboard/components/actorSelector';
import { actorManager } from '../../apps/extension/src/features/actors';
import type { ActorRecord } from '../../apps/extension/src/types';

vi.mock('../../apps/extension/src/features/actors', () => ({
  actorManager: {
    getAllActors: vi.fn(),
  },
}));

vi.mock('../../apps/extension/src/dashboard/ui/toast', () => ({
  showMessage: vi.fn(),
}));

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Actor One',
    aliases: [],
    gender: 'female',
    category: 'unknown',
    profileUrl: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('ActorSelector runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('excludes blacklisted actors and shows the excluded count in the add subscription modal', async () => {
    vi.mocked(actorManager.getAllActors).mockResolvedValue([
      actor({ id: 'actor-1', name: 'Visible Actor' }),
      actor({ id: 'actor-black', name: 'Blocked Actor', blacklisted: true }),
      actor({ id: 'actor-subscribed', name: 'Subscribed Actor' }),
    ]);

    const selector = new ActorSelector();
    await selector.showSelector(['actor-subscribed'], vi.fn());

    expect(document.querySelector('[data-actor-id="actor-1"]')).toBeTruthy();
    expect(document.querySelector('[data-actor-id="actor-black"]')).toBeNull();
    expect(document.querySelector('[data-actor-id="actor-subscribed"]')).toBeNull();
    const exclusionNote = document.querySelector('.actor-selector-exclusion-note');
    expect(exclusionNote).toBeTruthy();
    expect(exclusionNote?.textContent).toContain('已排除 1 位黑名单演员');
  });

  it('does not show blacklist exclusion note when no actors are blacklisted', async () => {
    vi.mocked(actorManager.getAllActors).mockResolvedValue([
      actor({ id: 'actor-1', name: 'Visible Actor' }),
      actor({ id: 'actor-2', name: 'Another Actor' }),
    ]);

    const selector = new ActorSelector();
    await selector.showSelector([], vi.fn());

    expect(document.querySelector('.actor-selector-exclusion-note')).toBeNull();
  });
});
