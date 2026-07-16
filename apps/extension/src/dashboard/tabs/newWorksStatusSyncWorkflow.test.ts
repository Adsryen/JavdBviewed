import { describe, expect, it, vi } from 'vitest';
import { runNewWorksStatusSyncWorkflow } from './newWorksStatusSyncWorkflow';

function deps(overrides: Partial<Parameters<typeof runNewWorksStatusSyncWorkflow>[0]['deps']> = {}) {
  return {
    setSyncButtonLoading: vi.fn(),
    syncWithVideoRecords: vi.fn(async () => ({
      updated: 4,
      details: [
        { id: 'A', oldStatus: 'new', newStatus: 'viewed' },
        { id: 'B', oldStatus: 'new', newStatus: 'browsed' },
        { id: 'C', oldStatus: 'new', newStatus: 'want' },
        { id: 'D', oldStatus: 'new', newStatus: 'viewed' },
      ],
    })),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    logInfo: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works status sync workflow', () => {
  it('syncs statuses, renders and shows first three update details', async () => {
    const runtimeDeps = deps();

    await runNewWorksStatusSyncWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.setSyncButtonLoading).toHaveBeenNthCalledWith(1, true);
    expect(runtimeDeps.syncWithVideoRecords).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith(
      '已同步 4 个作品的状态\n\n更新详情:\nA: new → viewed\nB: new → browsed\nC: new → want\n...还有 1 个作品',
      'success',
    );
    expect(runtimeDeps.setSyncButtonLoading).toHaveBeenLastCalledWith(false);
  });

  it('shows info message when no statuses changed', async () => {
    const runtimeDeps = deps({
      syncWithVideoRecords: vi.fn(async () => ({ updated: 0, details: [] })),
    });

    await runNewWorksStatusSyncWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('没有需要同步的作品状态', 'info');
    expect(runtimeDeps.setSyncButtonLoading).toHaveBeenLastCalledWith(false);
  });

  it('reports sync failure and restores button state', async () => {
    const runtimeDeps = deps({
      syncWithVideoRecords: vi.fn(async () => { throw new Error('sync failed'); }),
    });

    await runNewWorksStatusSyncWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('同步新作品状态失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('同步状态失败，请重试', 'error');
    expect(runtimeDeps.setSyncButtonLoading).toHaveBeenLastCalledWith(false);
  });
});
