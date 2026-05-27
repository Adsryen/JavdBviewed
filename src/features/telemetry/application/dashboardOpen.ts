import type { TelemetryReportResult } from '../domain/types';
import { reportTelemetryEvent, type ReportTelemetryEventOptions } from './reporter';

export const TELEMETRY_DASHBOARD_OPEN_MESSAGE = 'telemetry:dashboard-open';

export function reportTelemetryForDashboardOpen(
  options: ReportTelemetryEventOptions = {},
): Promise<TelemetryReportResult> {
  return reportTelemetryEvent('heartbeat', {
    ...options,
    force: true,
  });
}
