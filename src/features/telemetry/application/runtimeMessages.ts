import type { TelemetryReportResult } from '../domain/types';
import { reportTelemetryForDashboardOpen, TELEMETRY_DASHBOARD_OPEN_MESSAGE } from './dashboardOpen';

type TelemetryReporter = () => Promise<TelemetryReportResult>;
type SendResponse = (response?: unknown) => void;

export function handleTelemetryRuntimeMessage(
  message: unknown,
  sendResponse: SendResponse,
  reporter: TelemetryReporter = () => reportTelemetryForDashboardOpen(),
): boolean {
  if (!message || typeof message !== 'object' || (message as { type?: unknown }).type !== TELEMETRY_DASHBOARD_OPEN_MESSAGE) {
    return false;
  }

  reporter()
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: true }));
  return true;
}
