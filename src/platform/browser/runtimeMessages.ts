/**
 * @file runtimeMessages.ts
 * @description Chrome 运行时消息封装 —— 统一 content script ↔ background 的消息发送方式
 * @module platform/browser
 */

import { chromeCallbackToPromise, ensureChromeNamespace, getExtensionApi } from './extensionApi';

/** 运行时消息基础结构 */
export type RuntimeMessage = {
  type: string;                                       // 消息类型（如 'DB:VIEWED_GET'）
  [key: string]: any;
};

/**
 * 向 background 发送消息并等待响应。
 * 兼容 Chromium callback 与 Firefox Promise 风格 runtime.sendMessage。
 */
export function sendRuntimeMessage<TResponse = any>(message: RuntimeMessage): Promise<TResponse> {
  ensureChromeNamespace();
  const api = getExtensionApi();
  if (!api?.runtime?.sendMessage) {
    return Promise.reject(new Error('Extension runtime is not available'));
  }

  return chromeCallbackToPromise<TResponse>((callback) => {
    // 不传 callback 时部分引擎直接返回 Promise；chromeCallbackToPromise 会 await
    return api.runtime.sendMessage(message, callback);
  });
}
