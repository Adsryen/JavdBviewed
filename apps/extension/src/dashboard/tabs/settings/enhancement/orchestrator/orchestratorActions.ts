export type OrchestratorActionHost = any;

export function startOrchestratorAutoRefresh(host: OrchestratorActionHost): void {
  stopOrchestratorAutoRefresh(host);
  host.orchestratorAutoRefreshTimer = window.setInterval(() => {
    if (!host.orchestratorModal || host.orchestratorModal.classList.contains('hidden')) {
      return;
    }
    void host.refreshOrchestratorState();
  }, 5000);
}

export function stopOrchestratorAutoRefresh(host: OrchestratorActionHost): void {
  if (host.orchestratorAutoRefreshTimer) {
    window.clearInterval(host.orchestratorAutoRefreshTimer);
    host.orchestratorAutoRefreshTimer = undefined;
  }
}

export function unsubscribeOrchestratorEvents(host: OrchestratorActionHost): void {
  if (host.orchestratorRuntimeListener && chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.removeListener(host.orchestratorRuntimeListener as any);
    host.orchestratorRuntimeListener = undefined;
  }
}

export async function getPreferredJavdbTab(): Promise<chrome.tabs.Tab | null> {
  try {
    if (!chrome?.tabs?.query) return null;
    const isJavdb = (url?: string | null) => !!url && /\bjavdb\b/i.test(url) && !url.startsWith('chrome-extension://');
    const isRichPage = (url?: string | null) => !!url && /\/actors\/|\/v\/|\/search/.test(url);
    const tabsInWin = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ lastFocusedWindow: true }, resolve);
    });
    let target = (tabsInWin || []).find(t => t.active && isJavdb(t.url) && isRichPage(t.url));
    if (!target) target = (tabsInWin || []).find(t => isJavdb(t.url) && isRichPage(t.url));
    if (!target) target = (tabsInWin || []).find(t => t.active && isJavdb(t.url));
    if (!target) target = (tabsInWin || []).find(t => isJavdb(t.url));
    if (!target) {
      const allTabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({}, resolve);
      });
      target = (allTabs || []).find(t => isJavdb(t.url) && isRichPage(t.url));
      if (!target) target = (allTabs || []).find(t => isJavdb(t.url));
    }
    return target || null;
  } catch (e) {
    console.warn('[Enhancement] getPreferredJavdbTab failed:', e);
    return null;
  }
}
