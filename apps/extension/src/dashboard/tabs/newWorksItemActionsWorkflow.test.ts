import { describe, expect, it, vi } from 'vitest';
import {
  runDeleteWorksWorkflow,
  runMarkWorksAsReadWorkflow,
  runVisitWorkWorkflow,
} from './newWorksItemActionsWorkflow';

function deps(overrides: Partial<Parameters<typeof runMarkWorksAsReadWorkflow>[0]['deps']> = {}) {
  return {
    markAsRead: vi.fn(async () => undefined),
    render: vi.fn(async () => undefined),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works item actions workflow', () => {
  it('marks works as read and renders', async () => {
    const runtimeDeps = deps();

    await runMarkWorksAsReadWorkflow({
      workIds: ['A', 'B'],
      deps: runtimeDeps,
    });

    expect(runtimeDeps.markAsRead).toHaveBeenCalledWith(['A', 'B']);
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
  });

  it('logs mark as read failures', async () => {
    const runtimeDeps = deps({
      markAsRead: vi.fn(async () => { throw new Error('mark failed'); }),
    });

    await runMarkWorksAsReadWorkflow({
      workIds: ['A'],
      deps: runtimeDeps,
    });

    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('标记已读失败:', expect.any(Error));
  });

  it('opens matched work url and marks it as read after visiting', async () => {
    const runtimeDeps = {
      getNewWorks: vi.fn(async () => ({
        works: [
          { id: 'A', javdbUrl: 'https://javdb.com/v/A' },
          { id: 'B', javdbUrl: 'https://javdb.com/v/B' },
        ],
      })),
      openUrl: vi.fn(),
      markWorksAsRead: vi.fn(async () => undefined),
      logError: vi.fn(),
    };

    await runVisitWorkWorkflow({
      workId: 'B',
      deps: runtimeDeps,
    });

    expect(runtimeDeps.getNewWorks).toHaveBeenCalledWith({ search: 'B' });
    expect(runtimeDeps.openUrl).toHaveBeenCalledWith('https://javdb.com/v/B');
    expect(runtimeDeps.markWorksAsRead).toHaveBeenCalledWith(['B']);
  });

  it('skips opening and marking when visited work is not found', async () => {
    const runtimeDeps = {
      getNewWorks: vi.fn(async () => ({ works: [] })),
      openUrl: vi.fn(),
      markWorksAsRead: vi.fn(async () => undefined),
      logError: vi.fn(),
    };

    await runVisitWorkWorkflow({
      workId: 'missing',
      deps: runtimeDeps,
    });

    expect(runtimeDeps.openUrl).not.toHaveBeenCalled();
    expect(runtimeDeps.markWorksAsRead).not.toHaveBeenCalled();
  });

  it('logs visit failures', async () => {
    const runtimeDeps = {
      getNewWorks: vi.fn(async () => { throw new Error('visit failed'); }),
      openUrl: vi.fn(),
      markWorksAsRead: vi.fn(async () => undefined),
      logError: vi.fn(),
    };

    await runVisitWorkWorkflow({
      workId: 'A',
      deps: runtimeDeps,
    });

    expect(runtimeDeps.openUrl).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('访问作品失败:', expect.any(Error));
  });

  it('deletes works after confirmation, clears selection and renders', async () => {
    const runtimeDeps = {
      confirm: vi.fn(() => true),
      deleteWorks: vi.fn(async () => undefined),
      clearSelection: vi.fn(),
      render: vi.fn(async () => undefined),
      logError: vi.fn(),
    };

    await runDeleteWorksWorkflow({
      workIds: ['A', 'B'],
      deps: runtimeDeps,
    });

    expect(runtimeDeps.confirm).toHaveBeenCalledWith('确定要删除 2 个作品吗？');
    expect(runtimeDeps.deleteWorks).toHaveBeenCalledWith(['A', 'B']);
    expect(runtimeDeps.clearSelection).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
  });

  it('skips delete when confirmation is cancelled', async () => {
    const runtimeDeps = {
      confirm: vi.fn(() => false),
      deleteWorks: vi.fn(async () => undefined),
      clearSelection: vi.fn(),
      render: vi.fn(async () => undefined),
      logError: vi.fn(),
    };

    await runDeleteWorksWorkflow({
      workIds: ['A'],
      deps: runtimeDeps,
    });

    expect(runtimeDeps.deleteWorks).not.toHaveBeenCalled();
    expect(runtimeDeps.clearSelection).not.toHaveBeenCalled();
    expect(runtimeDeps.render).not.toHaveBeenCalled();
  });

  it('logs delete failures', async () => {
    const runtimeDeps = {
      confirm: vi.fn(() => true),
      deleteWorks: vi.fn(async () => { throw new Error('delete failed'); }),
      clearSelection: vi.fn(),
      render: vi.fn(async () => undefined),
      logError: vi.fn(),
    };

    await runDeleteWorksWorkflow({
      workIds: ['A'],
      deps: runtimeDeps,
    });

    expect(runtimeDeps.clearSelection).not.toHaveBeenCalled();
    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('删除作品失败:', expect.any(Error));
  });
});
