export interface RecordsRefreshRuntimeResponse {
  success?: boolean;
  error?: string;
}

export type RecordsRefreshRuntimeSender = (
  message: { type: 'refresh-record'; videoId: string },
  callback: (response?: RecordsRefreshRuntimeResponse) => void,
) => void;

export function refreshRecordsSingleRecord(
  recordId: string,
  sendRuntimeMessage: RecordsRefreshRuntimeSender,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      sendRuntimeMessage({
        type: 'refresh-record',
        videoId: recordId,
      }, (response) => {
        if (response?.success) {
          resolve();
          return;
        }
        reject(new Error(response?.error || '刷新失败'));
      });
    } catch (error: any) {
      reject(new Error(error?.message || '刷新失败'));
    }
  });
}
