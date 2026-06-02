import { hideRecordsProgressModal, showRecordsProgressModal, updateRecordsProgressModal } from './progressModalController';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface CreateRecordsBatchActionsControllerOptions {
  getSelectedIds: () => string[];
  refreshRecord: (recordId: string) => Promise<void>;
  deleteRecords: (recordIds: string[]) => Promise<void>;
  clearSelection: () => void;
  afterMutation: () => void;
  showMessage: (message: string, type: MessageType) => void;
  delayMs?: number;
}

export interface RecordsBatchActionsController {
  handleBatchRefresh: () => Promise<void>;
  handleBatchDelete: () => Promise<void>;
}

function showCustomConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
  const modal = document.createElement('div');
  modal.className = 'custom-confirm-modal';
  modal.innerHTML = `
    <div class="custom-confirm-overlay"></div>
    <div class="custom-confirm-content">
      <div class="custom-confirm-header">
        <h3>${title}</h3>
      </div>
      <div class="custom-confirm-body">
        <p>${message}</p>
      </div>
      <div class="custom-confirm-footer">
        <button class="custom-confirm-cancel">取消</button>
        <button class="custom-confirm-ok">确定</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const overlay = modal.querySelector('.custom-confirm-overlay') as HTMLElement;
  const cancelBtn = modal.querySelector('.custom-confirm-cancel') as HTMLButtonElement;
  const okBtn = modal.querySelector('.custom-confirm-ok') as HTMLButtonElement;

  const closeModal = () => {
    modal.remove();
  };

  overlay.addEventListener('click', () => {
    closeModal();
    onCancel?.();
  });

  cancelBtn.addEventListener('click', () => {
    closeModal();
    onCancel?.();
  });

  okBtn.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      onCancel?.();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  document.addEventListener('keydown', handleKeydown);
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export function createRecordsBatchActionsController(
  options: CreateRecordsBatchActionsControllerOptions,
): RecordsBatchActionsController {
  const performBatchRefresh = async (selectedIds: string[]) => {
    const progressModal = showRecordsProgressModal('正在刷新源数据...', selectedIds.length);

    try {
      let completed = 0;
      const errors: string[] = [];

      for (const recordId of selectedIds) {
        try {
          await options.refreshRecord(recordId);
          completed++;
          updateRecordsProgressModal(progressModal, completed, selectedIds.length, `已完成 ${completed}/${selectedIds.length}`);
          await delay(options.delayMs ?? 1000);
        } catch (error: any) {
          errors.push(`${recordId}: ${error.message}`);
          console.error(`[Records] 刷新记录 ${recordId} 失败:`, error);
        }
      }

      hideRecordsProgressModal(progressModal);
      options.clearSelection();
      options.afterMutation();

      if (errors.length > 0) {
        options.showMessage(`刷新完成，但有 ${errors.length} 个失败`, 'warn');
        console.log('[Records] 刷新失败的项目:', errors);
      } else {
        options.showMessage(`成功刷新了 ${completed} 个视频的源数据！`, 'success');
      }
    } catch (error: any) {
      hideRecordsProgressModal(progressModal);
      console.error('[Records] 批量刷新失败:', error);
      options.showMessage(`批量刷新失败: ${error.message}`, 'error');
      options.afterMutation();
    }
  };

  const performBatchDelete = async (selectedIds: string[]) => {
    try {
      await options.deleteRecords(selectedIds);
      options.clearSelection();
      options.afterMutation();
      options.showMessage(`成功删除了 ${selectedIds.length} 个视频记录！`, 'success');
    } catch (error: any) {
      console.error('[Records] 批量删除失败:', error);
      options.showMessage(`批量删除失败: ${error.message}`, 'error');
      options.afterMutation();
    }
  };

  return {
    handleBatchRefresh: async () => {
      const selectedIds = options.getSelectedIds();
      if (selectedIds.length === 0) return;

      showCustomConfirm(
        '批量刷新确认',
        `确定要刷新 ${selectedIds.length} 个视频的源数据吗？\n\n这将重新获取视频的详细信息，可能需要一些时间。`,
        () => {
          void performBatchRefresh(selectedIds);
        },
      );
    },
    handleBatchDelete: async () => {
      const selectedIds = options.getSelectedIds();
      if (selectedIds.length === 0) return;

      showCustomConfirm(
        '批量删除确认',
        `确定要删除 ${selectedIds.length} 个视频记录吗？\n\n此操作不可撤销！删除后将无法恢复这些记录。`,
        () => {
          void performBatchDelete(selectedIds);
        },
      );
    },
  };
}
