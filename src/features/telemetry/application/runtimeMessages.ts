import type { TelemetryErrorPayload, TelemetryReportResult } from '../domain/types';
import { reportTelemetryForDashboardOpen, TELEMETRY_DASHBOARD_OPEN_MESSAGE } from './dashboardOpen';
import { sanitizeTelemetryErrorPayload } from './errorPayload';
import { reportTelemetryErrorPayload } from './reporter';

type TelemetryReporter = () => Promise<TelemetryReportResult>;
type TelemetryErrorReporter = (payload: TelemetryErrorPayload) => Promise<TelemetryReportResult>;
type SendResponse = (response?: unknown) => void;

export const TELEMETRY_ERROR_REPORT_MESSAGE = 'telemetry:error-report';

export interface TelemetryRuntimeMessageHandlers {
  dashboardOpenReporter?: TelemetryReporter;
  errorReporter?: TelemetryErrorReporter;
}

export function handleTelemetryRuntimeMessage(
  message: unknown,
  sendResponse: SendResponse,
  handlers: TelemetryReporter | TelemetryRuntimeMessageHandlers = {},
): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }
  const resolvedHandlers = normalizeHandlers(handlers);
  const type = (message as { type?: unknown }).type;

  if (type === TELEMETRY_DASHBOARD_OPEN_MESSAGE) {
    resolvedHandlers.dashboardOpenReporter()
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: true }));
    return true;
  }

  if (type !== TELEMETRY_ERROR_REPORT_MESSAGE) {
    return false;
  }

  const payload = sanitizeTelemetryErrorPayload((message as { payload?: unknown }).payload);
  if (!payload) {
    sendResponse({ ok: true });
    return true;
  }

  resolvedHandlers.errorReporter(payload)
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: true }));
  return true;
}

function normalizeHandlers(handlers: TelemetryReporter | TelemetryRuntimeMessageHandlers): Required<TelemetryRuntimeMessageHandlers> {
  if (typeof handlers === 'function') {
    return {
      dashboardOpenReporter: handlers,
      errorReporter: reportTelemetryErrorPayload,
    };
  }

  return {
    dashboardOpenReporter: handlers.dashboardOpenReporter || (() => reportTelemetryForDashboardOpen()),
    errorReporter: handlers.errorReporter || reportTelemetryErrorPayload,
  };
}
