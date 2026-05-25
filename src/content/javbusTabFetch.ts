export function fetchJavbusAjaxViaTab(pageUrl: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      reject(new Error('Chrome runtime is not available'));
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'FETCH_JAVBUS_AJAX_VIA_TAB',
        pageUrl,
        timeoutMs,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.success) {
          reject(new Error(response?.error || 'JAVBUS tab fetch failed'));
          return;
        }

        const ajaxHtml = response?.data?.ajaxHtml;
        if (typeof ajaxHtml !== 'string') {
          reject(new Error('JAVBUS tab fetch returned invalid html'));
          return;
        }

        resolve(ajaxHtml);
      },
    );
  });
}
