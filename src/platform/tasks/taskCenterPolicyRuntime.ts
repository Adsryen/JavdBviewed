import type { GlobalTaskVisibilityPolicy, GlobalTaskStatus } from '../../shared/taskCenterTypes';

export function getEffectiveBucketLimit(input: {
  baseLimit: number;
  visible: boolean;
  policy: GlobalTaskVisibilityPolicy;
}): number {
  const baseLimit = Math.max(0, input.baseLimit);
  if (input.visible) return baseLimit;
  if (input.policy === 'foreground_only') return 0;
  if (input.policy === 'background_allowed') return Math.max(0, Math.min(4, baseLimit));
  return 0;
}

export function computeTaskDisposition(input: {
  status: GlobalTaskStatus;
  heartbeatTs?: number;
  timeoutMs: number;
  now: number;
}): 'active' | 'stale' {
  if (!['leased', 'running'].includes(input.status)) return 'active';
  const heartbeatTs = typeof input.heartbeatTs === 'number' ? input.heartbeatTs : 0;
  const staleWindowMs = Math.max(120_000, input.timeoutMs * 4);
  if (heartbeatTs > 0 && input.now - heartbeatTs > staleWindowMs) {
    return 'stale';
  }
  return 'active';
}
