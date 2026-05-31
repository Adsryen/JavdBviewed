import type { getPageContext } from '../../../platform/browser';

type OrchestratorWithMetrics = {
  getMetrics(): object;
};

type ChromeRuntimeLike = {
  sendMessage?: (message: unknown) => void;
};

type PageLifecycleWindowLike = {
  location?: { href?: string };
  addEventListener?: (event: string, listener: () => void) => void;
  __initOrchestrator__?: unknown;
};

type LoggerLike = {
  log?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
};

export type InstallOrchestratorPageLifecycleBindingsOptions = {
  windowRef?: PageLifecycleWindowLike;
  chromeRuntime?: ChromeRuntimeLike;
  getPageContextFn: typeof getPageContext;
  now?: () => number;
  logger?: LoggerLike;
};

export function installOrchestratorPageLifecycleBindings(
  orchestrator: OrchestratorWithMetrics,
  options: InstallOrchestratorPageLifecycleBindingsOptions,
): void {
  try {
    const windowRef = options.windowRef;
    if (!windowRef || typeof windowRef.addEventListener !== 'function') return;

    windowRef.__initOrchestrator__ = orchestrator;

    const chromeRuntime = options.chromeRuntime;
    const now = options.now || Date.now;
    const logger = options.logger || console;

    const notifyPageLifecycleCancel = (reason: string) => {
      try {
        const pageContext = options.getPageContextFn();
        logger.log?.('[Orchestrator] Page lifecycle cancel', {
          reason,
          pageUrl: pageContext.pageUrl,
          pageInstanceId: pageContext.pageInstanceId,
        });
        chromeRuntime?.sendMessage?.({
          type: 'task-center:page-lifecycle',
          payload: {
            pageInstanceId: pageContext.pageInstanceId,
            reason,
          },
        });
      } catch {}
    };

    windowRef.addEventListener('pagehide', () => {
      notifyPageLifecycleCancel('page-refresh-replaced');
    });

    windowRef.addEventListener('beforeunload', () => {
      try {
        const pageUrl = windowRef.location?.href || '';
        const metrics = {
          ...orchestrator.getMetrics(),
          pageUrl,
          timestamp: now(),
        };

        chromeRuntime?.sendMessage?.({
          type: 'orchestrator:saveMetrics',
          metrics,
        });
      } catch (e) {
        logger.warn?.('[Orchestrator] Failed to save metrics on unload:', e);
      }
    });
  } catch {}
}
