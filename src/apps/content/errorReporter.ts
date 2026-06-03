import {
  buildTelemetryErrorPayload,
  TELEMETRY_ERROR_REPORT_MESSAGE,
} from '../../features/telemetry';

let installed = false;

export function installContentTelemetryErrorReporter(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('error', (event) => {
    if (!shouldReportContentTelemetryError(event.error, event.filename)) return;
    void sendContentTelemetryError('CONTENT_UNHANDLED_ERROR', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!shouldReportContentTelemetryError(event.reason)) return;
    void sendContentTelemetryError('CONTENT_UNHANDLED_REJECTION', event.reason);
  });
}

export function shouldReportContentTelemetryError(error: unknown, filename?: unknown): boolean {
  const extensionRoot = getExtensionRoot();
  if (!extensionRoot) return false;

  const haystack = [
    typeof filename === 'string' ? filename : '',
    getStackText(error),
  ].join('\n');

  return haystack.includes(extensionRoot);
}

export async function sendContentTelemetryError(code: string, error: unknown): Promise<void> {
  try {
    const payload = await buildTelemetryErrorPayload({
      component: 'content',
      code,
      error,
      fatal: false,
    });
    await chrome.runtime.sendMessage({
      type: TELEMETRY_ERROR_REPORT_MESSAGE,
      payload,
    });
  } catch {}
}

function getExtensionRoot(): string {
  try {
    return chrome.runtime.getURL('');
  } catch {
    return '';
  }
}

function getStackText(error: unknown): string {
  if (error instanceof Error) return String(error.stack || '');
  if (error && typeof error === 'object') {
    const stack = (error as { stack?: unknown }).stack;
    if (typeof stack === 'string') return stack;
  }
  return '';
}
