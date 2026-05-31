type OrchestratorWithDashboardMetrics = {
  getMetrics(): unknown;
  resetMetrics(): void;
};

type ChromeRuntimeMessageLike = {
  onMessage?: {
    addListener?: (
      listener: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => false | undefined,
    ) => void;
  };
};

export type InstallOrchestratorDashboardMetricsMessagesOptions = {
  chromeRuntime?: ChromeRuntimeMessageLike;
};

type RuntimeMessage = {
  type?: string;
};

export function installOrchestratorDashboardMetricsMessages(
  orchestrator: OrchestratorWithDashboardMetrics,
  options: InstallOrchestratorDashboardMetricsMessagesOptions = {},
): void {
  try {
    const addListener = options.chromeRuntime?.onMessage?.addListener;
    if (typeof addListener !== 'function') return;

    addListener((message, _sender, sendResponse) => {
      try {
        const runtimeMessage = message as RuntimeMessage | undefined;
        if (runtimeMessage && runtimeMessage.type === 'orchestrator:getMetrics') {
          const metrics = orchestrator.getMetrics();
          sendResponse({ ok: true, metrics });
          return false;
        }
        if (runtimeMessage && runtimeMessage.type === 'orchestrator:resetMetrics') {
          orchestrator.resetMetrics();
          sendResponse({ ok: true });
          return false;
        }
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
        return false;
      }
      return undefined;
    });
  } catch {}
}
