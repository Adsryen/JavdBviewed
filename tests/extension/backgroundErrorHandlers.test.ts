import { describe, expect, it } from 'vitest';

describe('background error handlers', () => {
  it('ignores Chrome runtime message channel closure noise', async () => {
    const { isIgnorableBackgroundTelemetryError } = await import('../../src/apps/background/errorHandlers');

    expect(isIgnorableBackgroundTelemetryError(new Error(
      'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received',
    ))).toBe(true);
    expect(isIgnorableBackgroundTelemetryError(new Error(
      'Could not establish connection. Receiving end does not exist.',
    ))).toBe(true);
    expect(isIgnorableBackgroundTelemetryError(new Error(
      'The message port closed before a response was received.',
    ))).toBe(true);
  });

  it('keeps ordinary background errors reportable', async () => {
    const { isIgnorableBackgroundTelemetryError } = await import('../../src/apps/background/errorHandlers');

    expect(isIgnorableBackgroundTelemetryError(new TypeError('actor remarks fetch failed'))).toBe(false);
  });
});
