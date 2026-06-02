import { describe, expect, it, vi } from 'vitest';
import { createRecordsBatchActionsController } from '../../src/dashboard/tabs/records/batchActionsController';

async function waitFor(assertion: () => void, attempts = 20): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  throw lastError;
}

describe('records batch actions controller', () => {
  it('confirms and performs batch delete', () => {
    const deleteRecords = vi.fn().mockResolvedValue(undefined);
    const showMessage = vi.fn();
    const controller = createRecordsBatchActionsController({
      getSelectedIds: () => ['AAA-001', 'AAA-002'],
      refreshRecord: vi.fn(),
      deleteRecords,
      clearSelection: vi.fn(),
      afterMutation: vi.fn(),
      showMessage,
    });

    void controller.handleBatchDelete();

    const modal = document.querySelector('.custom-confirm-modal') as HTMLElement;
    expect(modal.textContent).toContain('批量删除确认');
    (modal.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();

    expect(deleteRecords).toHaveBeenCalledWith(['AAA-001', 'AAA-002']);
  });

  it('shows progress while refreshing selected records', async () => {
    const refreshRecord = vi.fn().mockResolvedValue(undefined);
    const clearSelection = vi.fn();
    const afterMutation = vi.fn();
    const showMessage = vi.fn();
    const controller = createRecordsBatchActionsController({
      getSelectedIds: () => ['AAA-001', 'AAA-002'],
      refreshRecord,
      deleteRecords: vi.fn(),
      clearSelection,
      afterMutation,
      delayMs: 0,
      showMessage,
    });

    void controller.handleBatchRefresh();
    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();

    await waitFor(() => expect(clearSelection).toHaveBeenCalledTimes(1));
    expect(refreshRecord).toHaveBeenCalledTimes(2);
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(afterMutation).toHaveBeenCalledTimes(1);
    expect(showMessage).toHaveBeenCalledWith('成功刷新了 2 个视频的源数据！', 'success');
    expect(document.querySelector('.batch-progress')).toBeNull();
  });
});
