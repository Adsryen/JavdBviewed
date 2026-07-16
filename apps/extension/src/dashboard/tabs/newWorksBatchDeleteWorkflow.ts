type MessageType = 'success' | 'error' | 'info' | 'warn' | 'warning';
type ConfirmType = 'danger' | 'warning' | 'info';

export interface BatchDeleteConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: ConfirmType;
}

export interface BatchDeleteSelectedWorkflowDeps {
  confirm(options: BatchDeleteConfirmOptions): Promise<boolean>;
  setDeletingButtonLoading(loading: boolean, selectedCount: number): void;
  deleteWorks(workIds: string[]): Promise<void>;
  render(): Promise<void>;
  showMessage(message: string, type: MessageType): void;
  updateBatchOperations(): void;
  logError(message: string, error: unknown): void;
}

export interface RunBatchDeleteSelectedWorkflowInput {
  selectedWorks: Set<string>;
  deps: BatchDeleteSelectedWorkflowDeps;
}

export async function runBatchDeleteSelectedWorkflow(input: RunBatchDeleteSelectedWorkflowInput): Promise<void> {
  const { selectedWorks, deps } = input;
  const ids = Array.from(selectedWorks);
  if (ids.length === 0) {
    deps.showMessage('未选择任何作品', 'info');
    return;
  }

  const confirmed = await deps.confirm({
    title: '批量删除',
    message: `确定要删除 ${ids.length} 个已选作品吗？\n\n此操作不可恢复！`,
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger',
  });
  if (!confirmed) return;

  deps.setDeletingButtonLoading(true, selectedWorks.size);
  try {
    await deps.deleteWorks(ids);
    selectedWorks.clear();
    deps.showMessage(`已删除 ${ids.length} 个作品`, 'success');
    await deps.render();
  } catch (error) {
    deps.logError('批量删除失败:', error);
    deps.showMessage('批量删除失败', 'error');
  } finally {
    deps.setDeletingButtonLoading(false, selectedWorks.size);
    deps.updateBatchOperations();
  }
}
