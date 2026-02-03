// src/background/drive115Proxy.ts
// 抽离 115 v2 后台代理（解决内容脚本 CORS）

export function installDrive115V2Proxy(): void {
  try {
    // 避免重复注册
    // @ts-ignore
    const __drive115_v2_proxy_flag = (globalThis as any).__drive115_v2_proxy_flag;
    if (!__drive115_v2_proxy_flag && typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      // @ts-ignore
      (globalThis as any).__drive115_v2_proxy_flag = true;
      chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
        if (!message || typeof message !== 'object') return false;
        if (message.type === 'drive115.add_task_urls_v2') {
          const payload = message.payload || {};
          const accessToken = String(payload.accessToken || '').trim();
          const urls = String(payload.urls || '');
          const wp_path_id = payload.wp_path_id;
          const base = String(payload.baseUrl || 'https://proapi.115.com').replace(/\/$/, '');
          if (!accessToken || !urls) {
            sendResponse({ success: false, message: '缺少 accessToken 或 urls' });
            return true;
          }

          const fd = new FormData();
          fd.set('urls', urls);
          if (wp_path_id !== undefined) fd.set('wp_path_id', String(wp_path_id));

          fetch(`${base}/open/offline/add_task_urls`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
            body: fd,
          })
            .then(async (res) => {
              const raw = await res.json().catch(() => ({} as any));
              const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
              const data = (raw && (raw.data || raw.result)) || undefined;
              sendResponse({ success: ok, message: raw?.message || raw?.error, raw, data });
            })
            .catch((err) => {
              sendResponse({ success: false, message: err?.message || '后台请求失败' });
            });
          return true; // 异步响应
        } else if (message.type === 'drive115.refresh_token_v2') {
          try {
            const rt = String(message?.payload?.refreshToken || '').trim();
            const refreshBase = 'https://passportapi.115.com';
            if (!rt) {
              sendResponse({ success: false, message: '缺少 refresh_token' });
              return true;
            }
            const fd = new URLSearchParams();
            fd.set('refresh_token', rt);
            fetch(`${refreshBase}/open/refreshToken`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
              body: fd.toString(),
            })
              .then(async (res) => {
                const raw = await res.json().catch(() => ({} as any));
                const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
                sendResponse({ success: ok, raw });
              })
              .catch((err) => {
                sendResponse({ success: false, message: err?.message || '后台刷新请求失败' });
              });
            return true; // 异步响应
          } catch (e: any) {
            sendResponse({ success: false, message: e?.message || '后台刷新异常' });
            return true;
          }
        } else if (message.type === 'drive115.get_quota_info_v2') {
          try {
            const accessToken = String(message?.payload?.accessToken || '').trim();
            const base = String(message?.payload?.baseUrl || 'https://proapi.115.com').replace(/\/$/, '');
            if (!accessToken) {
              sendResponse({ success: false, message: '缺少 access_token' });
              return true;
            }
            fetch(`${base}/open/offline/get_quota_info`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
              },
            }).then(async (res) => {
              const raw = await res.json().catch(() => ({} as any));
              const ok = typeof raw.state === 'boolean' ? raw.state : res.ok;
              sendResponse({ success: ok, raw });
            }).catch((err) => {
              sendResponse({ success: false, message: err?.message || '后台配额请求失败' });
            });
            return true; // 异步响应
          } catch (e: any) {
            sendResponse({ success: false, message: e?.message || '后台配额异常' });
            return true;
          }
        }
        // 未匹配任何 115 v2 消息类型
        return false;
      });
    }
  } catch (e) {
    // 静默
  }
}
