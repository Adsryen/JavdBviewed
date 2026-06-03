import { reportTelemetryError } from '../../features/telemetry';

export function registerBackgroundErrorHandlers(): void {
  self.addEventListener('unhandledrejection', (event) => {
    if (isIgnorableBackgroundTelemetryError(event.reason)) {
      event.preventDefault();
      return;
    }
    void reportTelemetryError({
      component: 'background',
      code: 'BACKGROUND_UNHANDLED_REJECTION',
      error: event.reason,
      fatal: false,
    }).catch(() => {});
    event.preventDefault();
  });

  self.addEventListener('error', (event) => {
    const error = event.error || event.message;
    if (isIgnorableBackgroundTelemetryError(error)) {
      event.preventDefault();
      return;
    }
    void reportTelemetryError({
      component: 'background',
      code: 'BACKGROUND_UNHANDLED_ERROR',
      error,
      fatal: false,
    }).catch(() => {});
    event.preventDefault();
  });
}

export function isIgnorableBackgroundTelemetryError(error: unknown): boolean {
  const text = getErrorText(error).toLowerCase();
  if (!text) return false;

  return [
    'a listener indicated an asynchronous response',
    'message channel closed before a response was received',
    'receiving end does not exist',
    'message port closed before a response was received',
  ].some((pattern) => text.includes(pattern));
}

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return [
      error.name,
      error.message,
      error.stack,
    ].filter(Boolean).join('\n');
  }
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; stack?: unknown; reason?: unknown };
    return [
      typeof maybeError.message === 'string' ? maybeError.message : '',
      typeof maybeError.stack === 'string' ? maybeError.stack : '',
      typeof maybeError.reason === 'string' ? maybeError.reason : '',
    ].filter(Boolean).join('\n');
  }
  return String(error || '');
}
