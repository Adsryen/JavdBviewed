import { describe, expect, it, vi } from 'vitest';
import { runActorBatchWorkflow } from './batchActionWorkflow';

describe('actors batch action workflow', () => {
  it('runs all items, counts failures, finalizes and shows warning result', async () => {
    const showMessage = vi.fn();
    const logItemError = vi.fn();
    const afterComplete = vi.fn().mockResolvedValue(undefined);

    const result = await runActorBatchWorkflow({
      actionName: '批量刷新',
      items: ['a', 'b', 'c'],
      runItem: vi.fn(async (id: string) => {
        if (id === 'b') throw new Error('failed');
      }),
      afterComplete,
      showMessage,
      logItemError,
    });

    expect(result).toEqual({ successCount: 2, failCount: 1 });
    expect(logItemError).toHaveBeenCalledTimes(1);
    expect(afterComplete).toHaveBeenCalledTimes(1);
    expect(showMessage).toHaveBeenCalledWith('批量刷新完成！成功: 2，失败: 1', 'warning');
  });

  it('shows success result when all items succeed', async () => {
    const showMessage = vi.fn();

    await runActorBatchWorkflow({
      actionName: '批量删除',
      items: ['a'],
      runItem: vi.fn().mockResolvedValue(undefined),
      afterComplete: vi.fn().mockResolvedValue(undefined),
      showMessage,
      logItemError: vi.fn(),
    });

    expect(showMessage).toHaveBeenCalledWith('批量删除完成！成功: 1，失败: 0', 'success');
  });
});
