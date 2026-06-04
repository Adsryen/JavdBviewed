import { viewedReplaceAll as defaultViewedReplaceAll } from '../../platform/storage/indexedDb';
import { STORAGE_KEYS } from '../../utils/config';
import { setValue as defaultSetValue } from '../../utils/storage';

type SendResponse = (response: any) => void;

interface ClearAllRecordsDeps {
  setValue?: typeof defaultSetValue;
  viewedReplaceAll?: typeof defaultViewedReplaceAll;
}

export async function handleClearAllRecords(
  sendResponse: SendResponse,
  deps: ClearAllRecordsDeps = {},
): Promise<void> {
  const setValue = deps.setValue ?? defaultSetValue;
  const viewedReplaceAll = deps.viewedReplaceAll ?? defaultViewedReplaceAll;

  try {
    await setValue(STORAGE_KEYS.VIEWED_RECORDS, {});
    await viewedReplaceAll([]);
    sendResponse({ success: true });
  } catch (error: any) {
    sendResponse({ success: false, error: error?.message || 'clear records failed' });
  }
}
