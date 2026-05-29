import { describe, expect, it } from 'vitest';
import { computeTaskDisposition, getEffectiveBucketLimit } from '../../src/platform/tasks/taskCenterPolicyRuntime';

describe('global task center policy runtime', () => {
  it('computes bucket limits for visibility policies', () => {
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: true, policy: 'foreground_first' })).toBe(2);
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: false, policy: 'background_allowed' })).toBe(2);
    expect(getEffectiveBucketLimit({ baseLimit: 2, visible: false, policy: 'foreground_only' })).toBe(0);
  });

  it('classifies stale and active tasks by heartbeat', () => {
    const now = Date.now();

    expect(computeTaskDisposition({ status: 'leased', heartbeatTs: now - 121_000, timeoutMs: 10_000, now })).toBe('stale');
    expect(computeTaskDisposition({ status: 'running', heartbeatTs: now - 5_000, timeoutMs: 10_000, now })).toBe('active');
    expect(computeTaskDisposition({ status: 'queued', heartbeatTs: 0, timeoutMs: 10_000, now })).toBe('active');
  });
});
