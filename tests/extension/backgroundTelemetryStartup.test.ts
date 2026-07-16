/**
 * @file backgroundTelemetryStartup.test.ts
 * @description background telemetry startup identity guard 测试
 * @module tests/extension
 */
import { describe, expect, it, vi } from 'vitest';

describe('background telemetry startup', () => {
  it('ensures the WebDAV client identity before telemetry starts', async () => {
    const { initializeTelemetryAfterClientIdentity } = await import('../../apps/extension/src/apps/background/telemetryStartup');
    const order: string[] = [];

    await initializeTelemetryAfterClientIdentity({
      ensureClientIdentity: vi.fn(async () => {
        order.push('identity');
      }),
      initializeTelemetry: vi.fn(async () => {
        order.push('telemetry');
      }),
    });

    expect(order).toEqual(['identity', 'telemetry']);
  });

  it('still starts telemetry when identity initialization fails', async () => {
    const { initializeTelemetryAfterClientIdentity } = await import('../../apps/extension/src/apps/background/telemetryStartup');
    const initializeTelemetry = vi.fn(async () => {});
    const logWarning = vi.fn();

    await initializeTelemetryAfterClientIdentity({
      ensureClientIdentity: vi.fn(async () => {
        throw new Error('storage unavailable');
      }),
      initializeTelemetry,
      logWarning,
    });

    expect(initializeTelemetry).toHaveBeenCalledTimes(1);
    expect(logWarning).toHaveBeenCalledWith(
      '[Background] Failed to ensure WebDAV client identity before telemetry',
      { error: 'storage unavailable' },
    );
  });
});
