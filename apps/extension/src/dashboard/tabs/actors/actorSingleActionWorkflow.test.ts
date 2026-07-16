import { describe, expect, it, vi } from 'vitest';
import type { ActorRecord } from '../../../types';
import {
  deleteActorWorkflow,
  editActorSourceDataWorkflow,
  openActorWorksWorkflow,
} from './actorSingleActionWorkflow';

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Alice',
    aliases: [],
    gender: 'female',
    category: 'censored',
    profileUrl: 'https://javdb.com/actors/actor-1',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('actor single action workflow', () => {
  it('opens actor works page and logs the action', async () => {
    const deps = {
      getActorById: vi.fn(async () => actor()),
      buildActorUrl: vi.fn(async () => 'https://javdb.com/actors/actor-1'),
      openUrl: vi.fn(),
      showMessage: vi.fn(),
      log: vi.fn(),
      logError: vi.fn(),
    };

    await openActorWorksWorkflow('actor-1', deps);

    expect(deps.buildActorUrl).toHaveBeenCalledWith('/actors/actor-1');
    expect(deps.openUrl).toHaveBeenCalledWith('https://javdb.com/actors/actor-1');
    expect(deps.log).toHaveBeenCalledWith('INFO', '打开演员作品列表', expect.objectContaining({
      actorId: 'actor-1',
      actorName: 'Alice',
    }));
  });

  it('shows an error when actor is missing before opening works', async () => {
    const deps = {
      getActorById: vi.fn(async () => undefined),
      buildActorUrl: vi.fn(),
      openUrl: vi.fn(),
      showMessage: vi.fn(),
      log: vi.fn(),
      logError: vi.fn(),
    };

    await openActorWorksWorkflow('missing', deps);

    expect(deps.showMessage).toHaveBeenCalledWith('演员信息不存在', 'error');
    expect(deps.openUrl).not.toHaveBeenCalled();
  });

  it('loads actor and opens edit modal', async () => {
    const deps = {
      getActorById: vi.fn(async () => actor()),
      showActorEditModal: vi.fn(),
      showMessage: vi.fn(),
      logError: vi.fn(),
    };

    await editActorSourceDataWorkflow('actor-1', deps);

    expect(deps.showActorEditModal).toHaveBeenCalledWith(expect.objectContaining({ id: 'actor-1' }));
  });

  it('shows an error when actor is missing before editing', async () => {
    const deps = {
      getActorById: vi.fn(async () => undefined),
      showActorEditModal: vi.fn(),
      showMessage: vi.fn(),
      logError: vi.fn(),
    };

    await editActorSourceDataWorkflow('missing', deps);

    expect(deps.showMessage).toHaveBeenCalledWith('演员信息不存在', 'error');
    expect(deps.showActorEditModal).not.toHaveBeenCalled();
  });

  it('skips delete when confirmation is cancelled', async () => {
    const deps = {
      confirm: vi.fn(async () => false),
      deleteActor: vi.fn(),
      reloadActors: vi.fn(),
      refreshStats: vi.fn(),
      showMessage: vi.fn(),
      logError: vi.fn(),
    };

    await deleteActorWorkflow('actor-1', deps);

    expect(deps.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: '删除演员',
      type: 'danger',
    }));
    expect(deps.deleteActor).not.toHaveBeenCalled();
  });

  it('deletes actor and refreshes list when confirmed', async () => {
    const deps = {
      confirm: vi.fn(async () => true),
      deleteActor: vi.fn(async () => true),
      reloadActors: vi.fn(async () => undefined),
      refreshStats: vi.fn(async () => undefined),
      showMessage: vi.fn(),
      logError: vi.fn(),
    };

    await deleteActorWorkflow('actor-1', deps);

    expect(deps.deleteActor).toHaveBeenCalledWith('actor-1');
    expect(deps.showMessage).toHaveBeenCalledWith('演员已删除', 'success');
    expect(deps.reloadActors).toHaveBeenCalledTimes(1);
    expect(deps.refreshStats).toHaveBeenCalledTimes(1);
  });

  it('shows delete failure when delete service returns false', async () => {
    const deps = {
      confirm: vi.fn(async () => true),
      deleteActor: vi.fn(async () => false),
      reloadActors: vi.fn(),
      refreshStats: vi.fn(),
      showMessage: vi.fn(),
      logError: vi.fn(),
    };

    await deleteActorWorkflow('actor-1', deps);

    expect(deps.showMessage).toHaveBeenCalledWith('删除失败', 'error');
    expect(deps.reloadActors).not.toHaveBeenCalled();
  });
});
