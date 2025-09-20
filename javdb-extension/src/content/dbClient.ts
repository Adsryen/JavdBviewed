// src/content/dbClient.ts
// 内容脚本到后台的 DB 消息封装（IndexedDB 后台持久层）

import type { VideoRecord } from '../types';

function sendMessage<T = any>(type: string, payload?: any, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: number | undefined;
    try {
      timer = window.setTimeout(() => {
        reject(new Error(`DB message timeout: ${type}`));
      }, timeoutMs);
    } catch {}

    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        if (timer) window.clearTimeout(timer);
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          reject(new Error(lastErr.message || 'runtime error'));
          return;
        }
        if (!resp || resp.success !== true) {
          reject(new Error(resp?.error || 'unknown db error'));
          return;
        }
        resolve(resp as T);
      });
    } catch (e: any) {
      if (timer) window.clearTimeout(timer);
      reject(e);
    }
  });
}

export function dbViewedPut(record: VideoRecord): Promise<void> {
  return sendMessage('DB:VIEWED_PUT', { record }).then(() => {});
}

export function dbViewedBulkPut(records: VideoRecord[]): Promise<void> {
  return sendMessage('DB:VIEWED_BULK_PUT', { records }).then(() => {});
}

export async function dbViewedGetAll(): Promise<VideoRecord[]> {
  const resp = await sendMessage<{ success: true; records: VideoRecord[] }>('DB:VIEWED_GET_ALL');
  // sendMessage 已保证 success 才 resolve
  // @ts-ignore
  return resp.records || [];
}
