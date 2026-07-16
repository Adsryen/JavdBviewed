import { describe, expect, it, vi } from 'vitest';
import { runBatchDeleteSelectedWorkflow } from './newWorksBatchDeleteWorkflow';

function deps(overrides: Partial<Parameters<typeof runBatchDeleteSelectedWorkflow>[0]['deps']> = {}) {
  return {
    confirm: vi.fn(async () => true),
    setDeletingButtonLoading: vi.fn(),
    deleteWorks: vi.fn(async () => undefined),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    updateBatchOperations: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works batch delete workflow', () => {
  it('shows info and skips confirmation when selection is empty', async () => {
    const runtimeDeps = deps();

    await runBatchDeleteSelectedWorkflow({
      selectedWorks: new Set(),
      deps: runtimeDeps,
    });

    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('未选择任何作品', 'info');
    expect(runtimeDeps.confirm).not.toHaveBeenCalled();
    expect(runtimeDeps.deleteWorks).not.toHaveBeenCalled();
  });

  it('stops when confirmation is cancelled', async () => {
    const runtimeDeps = deps({
      confirm: vi.fn(async () => false),
    });
    const selectedWorks = new Set(['work-1', 'work-2']);

    await runBatchDeleteSelectedWorkflow({ selectedWorks, deps: runtimeDeps });

    expect(runtimeDeps.confirm).toHaveBeenCalledWith({
      title: '批量删除',
      message: '确定要删除 2 个已选作品吗？\n\n此操作不可恢复！',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
    });
    expect(runtimeDeps.setDeletingButtonLoading).not.toHaveBeenCalled();
    expect(runtimeDeps.deleteWorks).not.toHaveBeenCalled();
    expect([...selectedWorks]).toEqual(['work-1', 'work-2']);
  });

  it('deletes selected works, clears selection and renders', async () => {
    const runtimeDeps = deps();
    const selectedWorks = new Set(['work-1', 'work-2']);

    await runBatchDeleteSelectedWorkflow({ selectedWorks, deps: runtimeDeps });

    expect(runtimeDeps.setDeletingButtonLoading).toHaveBeenNthCalledWith(1, true, 2);
    expect(runtimeDeps.deleteWorks).toHaveBeenCalledWith(['work-1', 'work-2']);
    expect(selectedWorks.size).toBe(0);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('已删除 2 个作品', 'success');
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.setDeletingButtonLoading).toHaveBeenLastCalledWith(false, 0);
    expect(runtimeDeps.updateBatchOperations).toHaveBeenCalledTimes(1);
  });

  it('keeps selection and reports error when deletion fails', async () => {
    const runtimeDeps = deps({
      deleteWorks: vi.fn(async () => { throw new Error('delete failed'); }),
    });
    const selectedWorks = new Set(['work-1', 'work-2']);

    await runBatchDeleteSelectedWorkflow({ selectedWorks, deps: runtimeDeps });

    expect([...selectedWorks]).toEqual(['work-1', 'work-2']);
    expect(runtimeDeps.logError).toHaveBeenCalledWith('批量删除失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('批量删除失败', 'error');
    expect(runtimeDeps.setDeletingButtonLoading).toHaveBeenLastCalledWith(false, 2);
    expect(runtimeDeps.updateBatchOperations).toHaveBeenCalledTimes(1);
  });
});
