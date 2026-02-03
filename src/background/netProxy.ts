// src/background/netProxy.ts
// 统一的后台网络代理路由：在 Service Worker 中执行 fetch，规避内容脚本的 CORS 限制

// 消息类型：
// - NET:fetchText  { url, method?, headers?, body?, timeoutMs? } -> { success, status, text?, error? }
// - NET:fetchJSON  { url, method?, headers?, body?, timeoutMs? } -> { success, status, data?, error? }

interface NetFetchPayload {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

function sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return headers;
  const blocked = new Set([
    'user-agent', 'referer', 'origin', 'host', 'cookie',
    // 允许自定义签名头等，其余危险头部默认拦截
  ]);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (!blocked.has(k.toLowerCase())) {
      out[k] = v;
    }
  }
  return out;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), init.timeoutMs || 30000);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export function registerNetProxyRouter(): void {
  try {
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      const type = message.type as string;

      if (type === 'NET:fetchText' || type === 'NET:fetchJSON') {
        const payload: NetFetchPayload = message.payload || {};
        const { url, method = 'GET', headers, body, timeoutMs } = payload;

        (async () => {
          try {
            const res = await fetchWithTimeout(url, {
              method,
              headers: sanitizeHeaders(headers),
              body,
              // mode/cors 在 SW 中默认可跨域，保持默认
              // credentials: 'omit' // 默认即可
              // @ts-ignore
              timeoutMs,
            });

            const status = res.status;

            if (type === 'NET:fetchText') {
              const text = await res.text().catch(() => '');
              sendResponse({ success: res.ok, status, text, error: res.ok ? undefined : `HTTP ${status}` });
            } else {
              // JSON
              let data: any = null;
              let error: string | undefined;
              try {
                data = await res.json();
              } catch (e: any) {
                error = 'JSON 解析失败';
              }
              sendResponse({ success: res.ok && !error, status, data, error: res.ok ? error : `HTTP ${status}` });
            }
          } catch (e: any) {
            sendResponse({ success: false, status: 0, error: e?.message || String(e) });
          }
        })();
        return true; // 异步响应
      }

      return false;
    });
  } catch {}
}
