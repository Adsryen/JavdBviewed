/**
 * @file imageLoadGate.ts
 * @description 全局限流：控制扩展内远程图片（封面等）的起载速率，避免一次刷爆 Emby/115。
 * @module ui/lib
 *
 * 默认：约 30 张/秒（令牌桶）。视口外不进队列（由调用方 IntersectionObserver 控制）。
 */

export type ImageLoadTicket = {
  cancel: () => void;
};

type Job = {
  id: number;
  run: () => void;
  cancelled: boolean;
};

let perSecond = 30;
let tokens = perSecond;
let lastRefillMs = Date.now();
let queue: Job[] = [];
let nextId = 1;
let pumpTimer: ReturnType<typeof setTimeout> | null = null;

function refillTokens(): void {
  const now = Date.now();
  const elapsed = Math.max(0, now - lastRefillMs);
  lastRefillMs = now;
  tokens = Math.min(perSecond, tokens + (elapsed / 1000) * perSecond);
}

function schedulePump(): void {
  if (pumpTimer != null) return;
  pumpTimer = setTimeout(() => {
    pumpTimer = null;
    pump();
  }, 40);
}

function pump(): void {
  refillTokens();
  while (tokens >= 1 && queue.length > 0) {
    const job = queue.shift();
    if (!job || job.cancelled) continue;
    tokens -= 1;
    try {
      job.run();
    } catch {
      /* ignore loader errors */
    }
  }
  if (queue.length > 0) schedulePump();
}

/**
 * 配置每秒允许开始加载的图片数（默认 30）。
 */
export function configureImageLoadGate(opts: { perSecond?: number }): void {
  if (typeof opts.perSecond === 'number' && opts.perSecond > 0) {
    perSecond = Math.min(200, Math.max(1, Math.floor(opts.perSecond)));
    tokens = Math.min(tokens, perSecond);
  }
}

export function getImageLoadGateConfig(): { perSecond: number; queued: number } {
  return { perSecond, queued: queue.filter((j) => !j.cancelled).length };
}

/**
 * 申请开始加载一张图：在全局限流下回调 run（通常用于 setSrc）。
 * cancel 后不会再执行 run。
 */
export function requestImageLoad(run: () => void): ImageLoadTicket {
  const job: Job = { id: nextId++, run, cancelled: false };
  queue.push(job);
  pump();
  return {
    cancel: () => {
      job.cancelled = true;
    },
  };
}

/** 测试用：清空队列并重置令牌 */
export function resetImageLoadGateForTests(): void {
  queue = [];
  tokens = perSecond;
  lastRefillMs = Date.now();
  if (pumpTimer != null) {
    clearTimeout(pumpTimer);
    pumpTimer = null;
  }
}
