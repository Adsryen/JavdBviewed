/**
 * @file clearRecordsHandler.ts
 * @description 清空所有观看记录的消息处理器 —— 同时清理 chrome.storage 和 IndexedDB
 * @module apps/background
 */
import { viewedReplaceAll as defaultViewedReplaceAll } from '../../platform/storage/indexedDb';
import { STORAGE_KEYS } from '../../utils/config';
import { setValue as defaultSetValue } from '../../utils/storage';

type SendResponse = (response: any) => void;  // chrome.runtime 消息回调类型

interface ClearAllRecordsDeps {
  setValue?: typeof defaultSetValue;                   // chrome.storage 写入
  viewedReplaceAll?: typeof defaultViewedReplaceAll;   // IndexedDB 全量替换
}

/**
 * 处理清空所有观看记录的消息 —— 清理 chrome.storage + 清空 IndexedDB 表
 */

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
