import { TELEMETRY_DASHBOARD_OPEN_MESSAGE } from '../../features/telemetry';

export function reportDashboardOpenTelemetry(): void {
  try {
    chrome.runtime.sendMessage({ type: TELEMETRY_DASHBOARD_OPEN_MESSAGE }, () => {
      void chrome.runtime.lastError;
    });
  } catch {}
}
