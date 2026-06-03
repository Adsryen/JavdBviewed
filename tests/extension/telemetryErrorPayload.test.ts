import { describe, expect, it } from 'vitest';

describe('telemetry error payload', () => {
  it('sanitizes error details and hashes normalized stacks', async () => {
    const { buildTelemetryErrorPayload } = await import('../../src/features/telemetry');
    const first = new TypeError('failed https://javdb.com/v/ABC token=secret magnet:?xt=urn:btih:abcdef');
    first.stack = [
      'TypeError: failed https://javdb.com/v/ABC token=secret',
      '    at fetchActor (chrome-extension://test-runtime/background.js:11:22)',
      '    at https://javdb.com/v/ABC:33:44',
    ].join('\n');
    const second = new TypeError('failed https://javdb.com/v/DEF token=another');
    second.stack = [
      'TypeError: failed https://javdb.com/v/DEF token=another',
      '    at fetchActor (chrome-extension://test-runtime/background.js:99:88)',
      '    at https://javdb.com/v/DEF:77:66',
    ].join('\n');

    const firstPayload = await buildTelemetryErrorPayload({
      component: 'background',
      code: 'ACTOR_REMARKS_FETCH_FAILED',
      error: first,
      fatal: true,
    });
    const secondPayload = await buildTelemetryErrorPayload({
      component: 'background',
      code: 'ACTOR_REMARKS_FETCH_FAILED',
      error: second,
      fatal: true,
    });

    expect(firstPayload).toEqual({
      component: 'background',
      code: 'ACTOR_REMARKS_FETCH_FAILED',
      message: 'TypeError',
      stackHash: expect.stringMatching(/^sha256-[a-f0-9]{64}$/),
      fatal: true,
    });
    expect(secondPayload.stackHash).toBe(firstPayload.stackHash);
    expect(JSON.stringify(firstPayload)).not.toContain('javdb.com');
    expect(JSON.stringify(firstPayload)).not.toContain('token=secret');
    expect(JSON.stringify(firstPayload)).not.toContain('magnet:');
  });

  it('normalizes unsafe component and code values to server-safe lengths', async () => {
    const { buildTelemetryErrorPayload } = await import('../../src/features/telemetry');

    const payload = await buildTelemetryErrorPayload({
      component: 'content https://javdb.com/v/ABC / weird component name '.repeat(3),
      code: 'bad code with spaces and https://javdb.com/v/ABC'.repeat(3),
      error: 'plain rejection reason with token=secret',
      fatal: false,
    });

    expect(payload.component).toMatch(/^[A-Za-z0-9_.:-]{1,80}$/);
    expect(payload.code).toMatch(/^[A-Za-z0-9_.:-]{1,80}$/);
    expect(payload.message).toBe('NonErrorRejection');
    expect(JSON.stringify(payload)).not.toContain('javdb.com');
    expect(JSON.stringify(payload)).not.toContain('token=secret');
  });
});
