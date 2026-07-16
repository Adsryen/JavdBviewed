/**
 * @file javbusRuntimeClient.ts
 * @description JavBus 运行时客户端 —— 通过 background 代理请求 JavBus 页面（规避 CORS）
 * @module platform/browser
 */
import { sendRuntimeMessage } from './runtimeMessages';

/** 通过 background 标签页代理请求 JavBus AJAX 接口 */
export function fetchJavbusAjaxViaRuntime(pageUrl: string, timeoutMs: number): Promise<string> {
  return sendRuntimeMessage({
    type: 'FETCH_JAVBUS_AJAX_VIA_TAB',
    pageUrl,
    timeoutMs,
  }).then((response) => {
    if (!response?.success) {
      throw new Error(response?.error || 'JAVBUS tab fetch failed');
    }

    const ajaxHtml = response?.data?.ajaxHtml;
    if (typeof ajaxHtml !== 'string') {
      throw new Error('JAVBUS tab fetch returned invalid html');
    }

    return ajaxHtml;
  });
}
