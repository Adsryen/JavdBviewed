export function installOrchestratorStateBridge(): void {
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            console.log('[Content] Registering orchestrator:getState listener', {
                url: window.location.href,
                readyState: document.readyState,
            });
            chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
                try {
                    if (message && message.type === 'orchestrator:getState') {
                        console.log('[Content] Received orchestrator:getState probe', {
                            url: window.location.href,
                            hasInitOrchestrator: !!(window as any).__initOrchestrator__,
                        });
                        const orchestrator: any = (window as any).__initOrchestrator__;
                        if (orchestrator && typeof orchestrator.getState === 'function') {
                            sendResponse({ ok: true, state: orchestrator.getState() });
                        } else {
                            sendResponse({ ok: false, error: 'orchestrator not initialized yet' });
                        }
                        return false;
                    }
                } catch (err) {
                    sendResponse({ ok: false, error: String(err) });
                    return false;
                }
                return false;
            });
        }
    } catch {}
}
