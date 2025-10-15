// src/utils/net.ts
// 前端（内容脚本/页面）使用的后台网络代理封装

export interface BgFetchTextResult {
  success: boolean;
  status: number;
  text?: string;
  error?: string;
}

export interface BgFetchJSONResult<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

interface NetFetchParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

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
