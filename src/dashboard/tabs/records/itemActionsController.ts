import type { VideoRecord } from '../../../types';
import type { RecordsActionButtonHandler } from './actionButtonsController';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface RecordsConfirmationModalOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface CreateRecordsItemActionsControllerOptions {
  getRecords: () => VideoRecord[];
  selectedRecords: Set<string>;
  saveRecord: (record: VideoRecord) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  sendRuntimeMessage: (message: any) => Promise<any>;
  showMessage: (message: string, type: MessageType) => void;
  showConfirmationModal: (options: RecordsConfirmationModalOptions) => void;
  openEditModal: (record: VideoRecord) => void;
  updateFilteredRecords: () => void;
  render: () => void;
  isFavoritesFilterActive: () => boolean;
  findRefreshButton?: (recordId: string) => HTMLButtonElement | null;
}

export interface RecordsItemActionsController {
  onToggleFavorite: RecordsActionButtonHandler;
  onEdit: RecordsActionButtonHandler;
  onRefresh: RecordsActionButtonHandler;
  onDelete: RecordsActionButtonHandler;
}

function updateFavoriteButton(button: HTMLButtonElement, favorite: boolean): void {
  button.className = `action-button favorite-button${favorite ? ' favorited' : ''}`;
  button.innerHTML = `<i class="${favorite ? 'fas' : 'far'} fa-heart"></i>`;
  button.title = favorite ? '取消收藏' : '添加到收藏';
}

function defaultFindRefreshButton(recordId: string): HTMLButtonElement | null {
  return document.querySelector(`[data-record-id="${recordId}"] .sync-button`) as HTMLButtonElement | null;
}

export function createRecordsItemActionsController(
  options: CreateRecordsItemActionsControllerOptions,
): RecordsItemActionsController {
  const findRefreshButton = options.findRefreshButton || defaultFindRefreshButton;

  const onToggleFavorite: RecordsActionButtonHandler = async (targetRecord, favoriteButton) => {
    try {
      const newFavoriteState = !targetRecord.isFavorite;
      targetRecord.isFavorite = newFavoriteState;
      if (newFavoriteState) {
        targetRecord.favoritedAt = Date.now();
      }

      await options.saveRecord(targetRecord);
      updateFavoriteButton(favoriteButton, newFavoriteState);
      options.showMessage(newFavoriteState ? '已添加到收藏' : '已取消收藏', 'success');

      if (options.isFavoritesFilterActive() && !newFavoriteState) {
        options.updateFilteredRecords();
        options.render();
      }
    } catch (error: any) {
      console.error('[Records] 更新收藏状态失败:', error);
      options.showMessage(`操作失败: ${error.message}`, 'error');
    }
  };

  const onEdit: RecordsActionButtonHandler = (targetRecord) => {
    options.openEditModal(targetRecord);
  };

  const onRefresh: RecordsActionButtonHandler = async (targetRecord, refreshButton) => {
    refreshButton.classList.add('is-loading');
    refreshButton.disabled = true;
    refreshButton.title = '正在同步数据...';

    try {
      const pingResponse = await options.sendRuntimeMessage({ type: 'ping' });
      if (!pingResponse || !pingResponse.success) {
        throw new Error('后台脚本无响应，请重新加载扩展');
      }

      const response = await options.sendRuntimeMessage({
        type: 'refresh-record',
        videoId: targetRecord.id,
      });

      if (response?.success) {
        const recordIndex = options.getRecords().findIndex(record => record.id === targetRecord.id);
        if (recordIndex !== -1) {
          options.getRecords()[recordIndex] = response.record;
        }
        options.updateFilteredRecords();
        options.render();
        options.showMessage(`'${targetRecord.id}' 已成功刷新。`, 'success');
      } else {
        throw new Error(response?.error || '刷新请求未收到响应或失败');
      }
    } catch (error: any) {
      console.error(`[Dashboard] Error during refresh for ${targetRecord.id}:`, error);
      options.showMessage(`刷新 '${targetRecord.id}' 失败: ${error.message}`, 'error');
    } finally {
      const activeButton = findRefreshButton(targetRecord.id) || refreshButton;
      activeButton.classList.remove('is-loading');
      activeButton.removeAttribute('disabled');
      activeButton.title = '刷新源数据';
    }
  };

  const onDelete: RecordsActionButtonHandler = (targetRecord) => {
    options.showConfirmationModal({
      title: '确认删除记录',
      message: `确定要删除记录 "${targetRecord.id}" 吗？\n\n标题: ${targetRecord.title}\n状态: ${targetRecord.status}\n\n此操作不可撤销！`,
      onConfirm: async () => {
        try {
          await options.deleteRecord(targetRecord.id);
          const records = options.getRecords();
          const recordIndex = records.findIndex(record => record.id === targetRecord.id);
          if (recordIndex !== -1) records.splice(recordIndex, 1);
          options.selectedRecords.delete(targetRecord.id);
          options.render();
          options.showMessage(`记录 "${targetRecord.id}" 已删除`, 'success');
        } catch (error: any) {
          console.error('[Records] 删除记录时出错:', error);
          options.showMessage(`删除记录失败: ${error.message}`, 'error');
        }
      },
      onCancel: () => {},
    });
  };

  return {
    onToggleFavorite,
    onEdit,
    onRefresh,
    onDelete,
  };
}
