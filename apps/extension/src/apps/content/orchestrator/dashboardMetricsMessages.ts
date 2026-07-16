/**
 * @file dashboardMetricsMessages.ts
 * @description 编排器指标消息绑定 —— 让 dashboard 页面通过 runtime 消息查询编排器运行指标
 * @module apps/content
 */
type OrchestratorWithDashboardMetrics = {
  getMetrics(): unknown;   // 获取当前指标快照
  resetMetrics(): void;    // 重置指标归零
};

type ChromeRuntimeMessageLike = {
  onMessage?: {
    addListener?: (
      listener: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => false | undefined,
    ) => void;
  };
};

export type InstallOrchestratorDashboardMetricsMessagesOptions = {
  chromeRuntime?: ChromeRuntimeMessageLike;  // 可注入用于测试
};

type RuntimeMessage = {
  type?: string;  // 消息类型标识
};

/**
 * 注册 dashboard 指标查询消息监听 —— 响应 orchestrator:getMetrics / orchestrator:resetMetrics
 */

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
