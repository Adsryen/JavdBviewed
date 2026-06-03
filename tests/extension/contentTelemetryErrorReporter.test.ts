import { describe, expect, it } from 'vitest';
import { getRuntimeMessages } from '../setup/chrome';

describe('content telemetry error reporter', () => {
  it('only accepts content errors from extension bundle URLs', async () => {
    const { shouldReportContentTelemetryError } = await import('../../src/apps/content/errorReporter');
    const extensionError = new Error('extension failure');
    extensionError.stack = [
      'Error: extension failure',
      '    at run (chrome-extension://test-runtime/assets/content.js:10:20)',
    ].join('\n');
    const pageError = new Error('page failure');
    pageError.stack = [
      'Error: page failure',
      '    at run (https://javdb.com/packs/js/app.js:10:20)',
    ].join('\n');

    expect(shouldReportContentTelemetryError(extensionError)).toBe(true);
    expect(shouldReportContentTelemetryError(pageError, 'https://javdb.com/packs/js/app.js')).toBe(false);
  });

  it('sends sanitized runtime messages for content errors', async () => {
    const { sendContentTelemetryError } = await import('../../src/apps/content/errorReporter');
    const error = new TypeError('failed https://javdb.com/v/ABC token=secret');
    error.stack = [
      'TypeError: failed https://javdb.com/v/ABC token=secret',
      '    at render (chrome-extension://test-runtime/assets/content.js:12:34)',
    ].join('\n');

    await sendContentTelemetryError('CONTENT_UNHANDLED_ERROR', error);

    expect(getRuntimeMessages()).toHaveLength(1);
    const message = getRuntimeMessages()[0];
    expect(message).toMatchObject({
      type: 'telemetry:error-report',
      payload: {
        component: 'content',
        code: 'CONTENT_UNHANDLED_ERROR',
        message: 'TypeError',
        stackHash: expect.stringMatching(/^sha256-[a-f0-9]{64}$/),
        fatal: false,
      },
    });
    expect(JSON.stringify(message)).not.toContain('javdb.com');
    expect(JSON.stringify(message)).not.toContain('token=secret');
  });
});
