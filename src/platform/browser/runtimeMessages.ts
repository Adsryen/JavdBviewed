/**
 * @file runtimeMessages.ts
 * @description Chrome 运行时消息封装 —— 统一 content script ↔ background 的消息发送方式
 * @module platform/browser
 */

import { ensureChromeNamespace, getExtensionApi } from './extensionApi';

/** 运行时消息基础结构 */
export type RuntimeMessage = {
  type: string;                                       // 消息类型（如 'DB:VIEWED_GET'）
  [key: string]: any;
};

/** 向 background 发送消息并等待响应（Promise 化封装） */
export function sendRuntimeMessage<TResponse = any>(message: RuntimeMessage): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    ensureChromeNamespace();
    const api = getExtensionApi();
    if (!api?.runtime?.sendMessage) {
      reject(new Error('Extension runtime is not available'));
      return;
    }

    try {
      api.runtime.sendMessage(message, (response: TResponse) => {
        // 优先读调用时的 api.runtime；归一化后 chrome/browser 可能为同一引用
        const lastError = api.runtime.lastError ?? getExtensionApi()?.runtime?.lastError;
        if (lastError?.message) {
          reject(new Error(lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
