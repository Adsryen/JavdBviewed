import type { VideoRecord } from '../../../types';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface RecordsEditSaveResult {
  message?: string;
  type?: MessageType;
}

export interface CreateRecordsEditSaveHandlerOptions {
  getRecords: () => VideoRecord[];
  saveRecord: (record: VideoRecord) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  showMessage: (message: string, type: MessageType) => void;
  render: () => void;
}

export interface RecordsEditSaveHandler {
  save: (
    updatedRecord: VideoRecord,
    originalRecord: VideoRecord,
  ) => Promise<RecordsEditSaveResult | void>;
}

export function createRecordsEditSaveHandler(
  options: CreateRecordsEditSaveHandlerOptions,
): RecordsEditSaveHandler {
  const save = async (
    updatedRecord: VideoRecord,
    originalRecord: VideoRecord,
  ): Promise<RecordsEditSaveResult | void> => {
    const records = options.getRecords();
    const originalId = originalRecord.id;
    const newId = updatedRecord.id.trim();

    if (originalId !== newId) {
      const existingRecord = records.find(record => record.id === newId);
      if (existingRecord) {
        options.showMessage(`ID "${newId}" 已存在，请使用其他ID`, 'error');
        return;
      }
      try { await options.deleteRecord(originalId); } catch {}
    }

    await options.saveRecord(updatedRecord);

    const index = records.findIndex(record => record.id === originalId);
    if (index !== -1) {
      records.splice(index, 1, updatedRecord);
    } else {
      records.push(updatedRecord);
    }

    if (originalId !== newId) {
      for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].id === originalId) records.splice(i, 1);
      }
      options.render();
      return { message: `记录ID从 "${originalId}" 更改为 "${newId}"`, type: 'success' };
    }

    options.render();
    return { message: `记录 "${updatedRecord.id}" 已更新`, type: 'success' };
  };

  return { save };
}
