export interface JavbusPageAjaxFetchResult {
  success: boolean;
  ajaxHtml?: string;
  ajaxUrl?: string;
  error?: string;
  detailLength?: number;
  params?: {
    gid: string;
    uc: string;
    hasImg: boolean;
  };
}

export async function javbusPageAjaxFetchScript(): Promise<JavbusPageAjaxFetchResult> {
  const getParam = (name: string): string => {
    const fromWindow = String((window as any)[name] ?? '');
    if (fromWindow) return fromWindow;

    const scripts = Array.from(document.scripts)
      .map(script => script.textContent || '')
      .join('\n');
    const match = scripts.match(new RegExp(`var\\s+${name}\\s*=\\s*(?:['"]([^'"]+)['"]|(\\d+))\\s*;?`));
    return match?.[1] || match?.[2] || '';
  };

  const gid = getParam('gid');
  const uc = getParam('uc') || '0';
  const img = getParam('img');
  const detailLength = document.documentElement?.outerHTML?.length || 0;

  if (!gid || !img) {
    return {
      success: false,
      error: 'JAVBUS ajax params not found in page context',
      detailLength,
      params: { gid, uc, hasImg: Boolean(img) },
    };
  }

  const query = new URLSearchParams({ gid, lang: 'zh', img, uc });
  const ajaxUrl = `${location.origin}/ajax/uncledatoolsbyajax.php?${query.toString()}`;

  try {
    const response = await fetch(ajaxUrl, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: '*/*',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const ajaxHtml = await response.text();
    return {
      success: response.ok,
      ajaxHtml,
      ajaxUrl,
      detailLength,
      error: response.ok ? undefined : `HTTP ${response.status}`,
      params: { gid, uc, hasImg: Boolean(img) },
    };
  } catch (error: any) {
    return {
      success: false,
      ajaxUrl,
      detailLength,
      error: error?.message || String(error),
      params: { gid, uc, hasImg: Boolean(img) },
    };
  }
}

export async function fetchJavbusAjaxViaTab(pageUrl: string, timeoutMs = 15000): Promise<JavbusPageAjaxFetchResult> {
  let tabId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const cleanup = async () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (typeof tabId === 'number') {
      try { await chrome.tabs.remove(tabId); } catch {}
    }
  };

  try {
    const tab = await chrome.tabs.create({ url: pageUrl, active: false });
    tabId = tab.id;
    if (typeof tabId !== 'number') {
      throw new Error('JAVBUS tab id is missing');
    }

    await waitForTabComplete(tabId, timeoutMs);

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: javbusPageAjaxFetchScript,
    });
    const result = results?.[0]?.result as JavbusPageAjaxFetchResult | undefined;
    if (!result) {
      throw new Error('JAVBUS tab script returned no result');
    }
    return result;
  } finally {
    await cleanup();
  }
}

function waitForTabComplete(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(listener);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`JAVBUS tab load timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const listener = (updatedTabId: number, changeInfo: { status?: string }) => {
      if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
      cleanup();
      resolve();
    };

    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab.status === 'complete') {
        cleanup();
        resolve();
      }
    });
  });
}
