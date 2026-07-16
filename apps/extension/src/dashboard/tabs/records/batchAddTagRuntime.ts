import type { VideoRecord } from '../../../types';
import {
  executeRecordsBatchAddTags,
  type ExecuteRecordsBatchAddTagsInput,
} from './batchTagService';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface CreateRecordsBatchAddTagRuntimeOptions {
  getVisibleRecords: () => VideoRecord[];
  getRecordById: (id: string) => Promise<VideoRecord | undefined>;
  putRecord: (record: VideoRecord) => Promise<unknown>;
  showMessage: (message: string, type: MessageType) => void;
  render: () => void;
  executeAddTags?: (input: ExecuteRecordsBatchAddTagsInput) => Promise<{ successCount: number; failCount: number }>;
}

export interface RecordsBatchAddTagRuntime {
  executeBatchAddTag: (videoIds: string[], newTags: string[]) => Promise<void>;
}

export function createRecordsBatchAddTagRuntime(
  options: CreateRecordsBatchAddTagRuntimeOptions,
): RecordsBatchAddTagRuntime {
  const executeAddTags = options.executeAddTags || executeRecordsBatchAddTags;

  const executeBatchAddTag = async (videoIds: string[], newTags: string[]): Promise<void> => {
    const { successCount, failCount } = await executeAddTags({
      videoIds,
      newTags,
      getVisibleRecords: options.getVisibleRecords,
      getRecordById: options.getRecordById,
      putRecord: options.putRecord,
    });

    const message = failCount > 0
      ? `标签添加完成：成功 ${successCount} 条，失败 ${failCount} 条`
      : `已为 ${successCount} 条视频追加标签`;
    options.showMessage(message, failCount > 0 ? 'warning' : 'success');
    options.render();
  };

  return { executeBatchAddTag };
}
