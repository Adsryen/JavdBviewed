/**
 * @file rateLimit.ts
 * @description 115 索引限频与熔断
 * @module features/drive115/mediaLibrary
 */
import { DRIVE115_INDEX_LIMITS } from './types';

export type RateLimitControllerOptions = {
  rootIntervalMs?: number;
  folderIntervalMs?: number;
  circuitBreakerThreshold?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

/**
 * 串行限频控制器：保证最小间隔 + 连续限流熔断
 */
export function createRateLimitController(options: RateLimitControllerOptions = {}) {
  const rootIntervalMs = options.rootIntervalMs ?? DRIVE115_INDEX_LIMITS.rootIntervalMs;
  const folderIntervalMs = options.folderIntervalMs ?? DRIVE115_INDEX_LIMITS.folderIntervalMs;
  const threshold =
    options.circuitBreakerThreshold ?? DRIVE115_INDEX_LIMITS.circuitBreakerThreshold;
  const sleep =
    options.sleep ||
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = options.now || (() => Date.now());

  let lastCallAt = 0;
  let consecutiveRateLimitErrors = 0;
  let tripped = false;
  let tripReason = '';

  async function wait(minIntervalMs: number): Promise<void> {
    const elapsed = now() - lastCallAt;
    const waitMs = Math.max(0, minIntervalMs - elapsed);
    if (waitMs > 0) await sleep(waitMs);
    lastCallAt = now();
  }

  return {
    async beforeRootCall(): Promise<void> {
      if (tripped) throw new Error(tripReason || '索引已熔断');
      await wait(rootIntervalMs);
    },
    async beforeFolderCall(): Promise<void> {
      if (tripped) throw new Error(tripReason || '索引已熔断');
      await wait(folderIntervalMs);
    },
    /** 记录一次成功调用，重置连续限流计数 */
    markSuccess(): void {
      consecutiveRateLimitErrors = 0;
    },
    /**
     * 记录失败；若判定为限流则累计，达到阈值熔断
     * @returns 是否已熔断
     */
    markFailure(errorMessage: string, isRateLimited: boolean): boolean {
      if (!isRateLimited) {
        consecutiveRateLimitErrors = 0;
        return tripped;
      }
      consecutiveRateLimitErrors += 1;
      if (consecutiveRateLimitErrors >= threshold) {
        tripped = true;
        tripReason = `连续限流 ${consecutiveRateLimitErrors} 次，已暂停索引：${errorMessage}`;
      }
      return tripped;
    },
    isTripped(): boolean {
      return tripped;
    },
    getTripReason(): string {
      return tripReason;
    },
    getConsecutiveRateLimitErrors(): number {
      return consecutiveRateLimitErrors;
    },
  };
}

/**
 * 从错误信息粗判是否限流/过频
 */
export function isLikelyRateLimitError(message: string | null | undefined, code?: number): boolean {
  if (code === 40140117 || code === 429) return true;
  const text = String(message || '').toLowerCase();
  if (!text) return false;
  return (
    text.includes('rate') ||
    text.includes('限流') ||
    text.includes('频繁') ||
    text.includes('too many') ||
    text.includes('429') ||
    text.includes('quota') ||
    text.includes('throttle')
  );
}
