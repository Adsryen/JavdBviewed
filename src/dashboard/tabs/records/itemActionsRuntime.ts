import type { VideoRecord, VideoStatus } from '../../../types';
import {
  createRecordsItemActionsController,
  type RecordsConfirmationModalOptions,
  type RecordsItemActionsController,
} from './itemActionsController';
import { createRecordsEditSaveHandler } from './editSaveService';
import {
  openRecordsEditModal,
  type OpenRecordsEditModalOptions,
} from './editModalController';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface CreateRecordsItemActionsRuntimeOptions {
  getRecords: () => VideoRecord[];
  selectedRecords: Set<string>;
  saveRecord: (record: VideoRecord) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  sendRuntimeMessage: (message: any) => Promise<any>;
  showMessage: (message: string, type: MessageType) => void;
  showConfirmationModal: (options: RecordsConfirmationModalOptions) => void;
  openEditModal?: (options: OpenRecordsEditModalOptions) => void;
  videoStatus: {
    UNTRACKED: VideoStatus;
    VIEWED: VideoStatus;
    BROWSED: VideoStatus;
    WANT: VideoStatus;
  };
  updateFilteredRecords: () => void;
  render: () => void;
  isFavoritesFilterActive: () => boolean;
}

export function createRecordsItemActionsRuntime(
  options: CreateRecordsItemActionsRuntimeOptions,
): RecordsItemActionsController {
  const editSaveHandler = createRecordsEditSaveHandler({
    getRecords: options.getRecords,
    saveRecord: options.saveRecord,
    deleteRecord: options.deleteRecord,
    showMessage: options.showMessage,
    render: options.render,
  });
  const openEditModal = options.openEditModal || openRecordsEditModal;

  return createRecordsItemActionsController({
    getRecords: options.getRecords,
    selectedRecords: options.selectedRecords,
    saveRecord: options.saveRecord,
    deleteRecord: options.deleteRecord,
    sendRuntimeMessage: options.sendRuntimeMessage,
    showMessage: options.showMessage,
    showConfirmationModal: options.showConfirmationModal,
    openEditModal: (targetRecord) => {
      openEditModal({
        record: targetRecord,
        videoStatus: options.videoStatus,
        showMessage: options.showMessage,
        onSave: editSaveHandler.save,
      });
    },
    updateFilteredRecords: options.updateFilteredRecords,
    render: options.render,
    isFavoritesFilterActive: options.isFavoritesFilterActive,
  });
}
