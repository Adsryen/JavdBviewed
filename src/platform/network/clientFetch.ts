/**
 * @file clientFetch.ts
 * @description 前端网络代理 —— content script 通过 chrome.runtime.sendMessage 请求 background 代发 HTTP
 * @module platform/network
 *
 * 内容脚本受 CORS 限制无法直接跨域请求，通过此模块将请求转发给 background 执行。
 */

/** 后台代理返回的文本响应 */
export interface BgFetchTextResult {
  success: boolean;
  status: number;                                     // HTTP 状态码
  text?: string;
  error?: string;
}

/** 后台代理返回的 JSON 响应 */
export interface BgFetchJSONResult<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

/** 代理请求参数 */
interface NetFetchParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

/** 通过 background 代理发起 HTTP 请求，返回文本 */
export async function bgFetchText(params: NetFetchParams): Promise<BgFetchTextResult> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'NET:fetchText', payload: params }, (resp: BgFetchTextResult) => {
        resolve(resp || { success: false, status: 0, error: 'No response' });
      });
    } catch (e: any) {
      resolve({ success: false, status: 0, error: e?.message || String(e) });
    }
  });
}

export async function bgFetchJSON<T = any>(params: NetFetchParams): Promise<BgFetchJSONResult<T>> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'NET:fetchJSON', payload: params }, (resp: BgFetchJSONResult<T>) => {
        resolve(resp || { success: false, status: 0, error: 'No response' });
      });
    } catch (e: any) {
      resolve({ success: false, status: 0, error: e?.message || String(e) });
    }
  });
}
