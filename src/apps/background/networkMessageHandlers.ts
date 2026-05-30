import { fetchJavbusAjaxViaTab } from '../../platform/browser/javbusTabFetch';
import { requestScheduler as defaultRequestScheduler } from '../../platform/network/requestScheduler';

type SendResponse = (response: any) => void;

export interface RequestSchedulerLike {
  enqueue: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function handleExternalDataFetch(
  message: any,
  sendResponse: SendResponse,
  requestScheduler: RequestSchedulerLike = defaultRequestScheduler,
): Promise<void> {
  try {
    const url = message?.url;
    const options = (message?.options || {}) as any;
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }
    const responseType = options.responseType || 'text';

    const controller = new AbortController();
    const timeoutMs = typeof options.timeout === 'number' ? options.timeout : 10000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const reqInit: RequestInit = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal,
      ...(typeof options.referrer === 'string' ? { referrer: options.referrer } : {}),
    };

    const response = await requestScheduler.enqueue(url, reqInit);
    let data: any;
    if (responseType === 'json') data = await response.json().catch(() => null);
    else if (responseType === 'blob') data = await response.blob();
    else data = await response.text();
    const headersObj: Record<string, string> = {};
    try { response.headers.forEach((v, k) => { headersObj[k] = v; }); } catch {}
    clearTimeout(timer);
    sendResponse({ success: true, data, status: response.status, headers: headersObj });
  } catch (error: any) {
    console.error('[Background] Failed to fetch external data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

export async function handleFetchJavbusAjaxViaTab(message: any, sendResponse: SendResponse): Promise<void> {
  try {
    const pageUrl = String(message?.pageUrl || '');
    const timeoutMs = typeof message?.timeoutMs === 'number' ? message.timeoutMs : 15000;
    if (!/^https:\/\/(?:www\.)?javbus\.com\/[^/?#]+/i.test(pageUrl)) {
      sendResponse({ success: false, error: 'Invalid JAVBUS page URL' });
      return;
    }

    const result = await fetchJavbusAjaxViaTab(pageUrl, timeoutMs);
    sendResponse({ success: result.success, data: result, error: result.error });
  } catch (error: any) {
    console.error('[Background] JAVBUS tab ajax fetch failed:', error);
    sendResponse({ success: false, error: error?.message || String(error) });
  }
}

export async function handleFetchExternalCover(
  message: any,
  sendResponse: SendResponse,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  try {
    const { code } = message || {};
    if (!code) {
      sendResponse({ success: false, error: 'No code provided' });
      return;
    }

    const searchUrl = `https://blogjav.net/search?q=${encodeURIComponent(code)}`;
    const res = await fetchImpl(searchUrl);

    if (!res.ok) {
      sendResponse({ success: false, error: `Failed to fetch BlogJav: ${res.status}` });
      return;
    }

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const resultItems = doc.querySelectorAll('.post-item, .search-result-item, .video-item');

    for (const item of resultItems) {
      const titleElement = item.querySelector('.title, .post-title, h2, h3');
      const title = titleElement?.textContent?.trim().toUpperCase() || '';

      if (title.includes(code.toUpperCase().replace(/[-\s]/g, ''))) {
        const img = item.querySelector('img');
        const imgSrc = img?.getAttribute('src') || img?.getAttribute('data-src');

        if (imgSrc) {
          let imageUrl = imgSrc;
          if (imgSrc.startsWith('//')) {
            imageUrl = 'https:' + imgSrc;
          } else if (imgSrc.startsWith('/')) {
            imageUrl = 'https://blogjav.net' + imgSrc;
          }

          sendResponse({ success: true, imageUrl });
          return;
        }
      }
    }

    sendResponse({ success: false, error: 'Cover image not found' });
  } catch (error: any) {
    console.error('[Background] Failed to fetch external cover:', error);
    sendResponse({ success: false, error: error.message });
  }
}
