import { sendRuntimeMessage } from './runtimeMessages';

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
