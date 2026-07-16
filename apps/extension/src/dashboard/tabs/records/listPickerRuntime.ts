import type { ListRecord, VideoRecord } from '../../../types';
import {
  createRecordsListPickerController,
  type RecordsListPickerController,
} from './listPickerController';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface RecordsBulkPatchListResult {
  successCount: number;
  failCount: number;
}

export interface CreateRecordsListPickerRuntimeOptions {
  selectedRecords: Set<string>;
  getVisibleRecords: () => VideoRecord[];
  loadLists: () => Promise<ListRecord[]>;
  patchList: (videoId: string, listId: string, action: 'add' | 'remove') => Promise<unknown>;
  bulkPatchList: (videoIds: string[], listId: string, action: 'add' | 'remove') => Promise<RecordsBulkPatchListResult>;
  showMessage: (message: string, type: MessageType) => void;
  render: () => void;
  escapeHtml: (value: string) => string;
  documentRef?: Document;
}

export interface RecordsListPickerRuntime {
  close: () => void;
  ensureController: () => RecordsListPickerController | null;
  openSingle: (record: VideoRecord) => Promise<void>;
  openBatch: () => Promise<void>;
  executeListChange: (videoIds: string[], listId: string, action: 'add' | 'remove') => Promise<void>;
}

function syncVisibleRecordListIds(records: VideoRecord[], videoIds: string[], listId: string, action: 'add' | 'remove'): void {
  for (const id of videoIds) {
    const record = records.find(item => item.id === id);
    if (!record) continue;

    const ids = new Set<string>(Array.isArray(record.listIds) ? record.listIds : []);
    if (action === 'add') ids.add(listId); else ids.delete(listId);
    record.listIds = Array.from(ids);
  }
}

export function createRecordsListPickerRuntime(options: CreateRecordsListPickerRuntimeOptions): RecordsListPickerRuntime {
  const documentRef = options.documentRef || document;
  let controller: RecordsListPickerController | null = null;

  const close = () => {
    const panel = documentRef.getElementById('listPickerPanel');
    if (panel) panel.style.display = 'none';
  };

  const executeListChange = async (videoIds: string[], listId: string, action: 'add' | 'remove') => {
    const actionText = action === 'add' ? '添加' : '移除';
    try {
      if (videoIds.length === 1) {
        await options.patchList(videoIds[0], listId, action);
      } else {
        const result = await options.bulkPatchList(videoIds, listId, action);
        const message = result.failCount > 0
          ? `${actionText}完成：成功 ${result.successCount} 条，失败 ${result.failCount} 条`
          : `已${actionText} ${result.successCount} 条视频到清单`;
        options.showMessage(message, result.failCount > 0 ? 'warning' : 'success');
      }

      syncVisibleRecordListIds(options.getVisibleRecords(), videoIds, listId, action);
      options.render();
    } catch {
      options.showMessage(videoIds.length === 1 ? '操作失败' : `批量${actionText}清单失败`, 'error');
    }
  };

  const ensureController = (): RecordsListPickerController | null => {
    if (controller) return controller;
    const panel = documentRef.getElementById('listPickerPanel') as HTMLElement | null;
    const listEl = documentRef.getElementById('listPickerList') as HTMLElement | null;
    if (!panel || !listEl) return null;

    controller = createRecordsListPickerController({
      panel,
      listEl,
      titleEl: documentRef.getElementById('listPickerTitle') as HTMLElement | null,
      batchFooter: documentRef.getElementById('listPickerBatchFooter') as HTMLElement | null,
      selectedRecords: options.selectedRecords,
      getVisibleRecords: options.getVisibleRecords,
      loadLists: options.loadLists,
      escapeHtml: options.escapeHtml,
      onExecuteListChange: executeListChange,
    });
    return controller;
  };

  return {
    close,
    ensureController,
    openSingle: async (record) => {
      await ensureController()?.openSingleRecordPicker(record);
    },
    openBatch: async () => {
      if (options.selectedRecords.size === 0) return;
      await ensureController()?.openBatchListPicker();
    },
    executeListChange,
  };
}
