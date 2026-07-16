import { describe, expect, it, vi } from 'vitest';
import { installOrchestratorDashboardMetricsMessages } from './dashboardMetricsMessages';

describe('orchestrator dashboard metrics messages', () => {
  it('responds with current metrics', () => {
    const addListener = vi.fn();
    const orchestrator = {
      getMetrics: vi.fn(() => ({ totalTasks: 4 })),
      resetMetrics: vi.fn(),
    };

    installOrchestratorDashboardMetricsMessages(orchestrator, {
      chromeRuntime: {
        onMessage: { addListener },
      },
    });

    const listener = addListener.mock.calls[0][0];
    const sendResponse = vi.fn();
    const result = listener({ type: 'orchestrator:getMetrics' }, {}, sendResponse);

    expect(result).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      metrics: { totalTasks: 4 },
    });
  });

  it('resets metrics when requested', () => {
    const addListener = vi.fn();
    const orchestrator = {
      getMetrics: vi.fn(),
      resetMetrics: vi.fn(),
    };

    installOrchestratorDashboardMetricsMessages(orchestrator, {
      chromeRuntime: {
        onMessage: { addListener },
      },
    });

    const listener = addListener.mock.calls[0][0];
    const sendResponse = vi.fn();
    const result = listener({ type: 'orchestrator:resetMetrics' }, {}, sendResponse);

    expect(result).toBe(false);
    expect(orchestrator.resetMetrics).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });
});
