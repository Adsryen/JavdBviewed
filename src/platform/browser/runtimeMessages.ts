/**
 * @file runtimeMessages.ts
 * @description Chrome 运行时消息封装 —— 统一 content script ↔ background 的消息发送方式
 * @module platform/browser
 */

/** 运行时消息基础结构 */
export type RuntimeMessage = {
  type: string;                                       // 消息类型（如 'DB:VIEWED_GET'）
  [key: string]: any;
};

/** 向 background 发送消息并等待响应（Promise 化封装） */
export function sendRuntimeMessage<TResponse = any>(message: RuntimeMessage): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      reject(new Error('Chrome runtime is not available'));
      return;
    }

    chrome.runtime.sendMessage(message, (response: TResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}
