/**
 * @file chunking.ts
 * @description 任务分块执行器 —— 将大批量工作拆分为小批次，每批之间可让出主线程
 * @module platform/tasks
 *
 * 用于演员同步、批量导入等场景，避免长时间阻塞导致 Service Worker 被杀。
 */

/** 分块执行选项 */
export interface ChunkedWorkOptions<T> {
  batchSize?: number;                                 // 每批处理数量，默认 20
  onItem: (item: T, index: number) => Promise<void> | void;  // 单项处理函数
  yieldAfterBatch?: () => Promise<void> | void;       // 每批完成后的回调（如进度上报）
  shouldStop?: () => boolean;                          // 提前终止条件
  parentLabel?: string;                               // 父任务标签（用于日志）
  onBatchComplete?: (info: {
    parentLabel?: string;
    batchIndex: number;
    itemCount: number;
    processed: number;
    stopped: boolean;
  }) => Promise<void> | void;
}

export interface ChunkedWorkResult {
  processed: number;
  batches: number;
  stopped: boolean;
}

export async function runChunkedWork<T>(items: T[], options: ChunkedWorkOptions<T>): Promise<ChunkedWorkResult> {
  const batchSize = Math.max(1, Math.floor(options.batchSize || 1));
  let processed = 0;
  let batches = 0;
  let stopped = false;

  for (let index = 0; index < items.length; index += batchSize) {
    if (options.shouldStop?.()) {
      stopped = true;
      break;
    }

    const batch = items.slice(index, index + batchSize);
    const batchIndex = batches;
    for (let offset = 0; offset < batch.length; offset += 1) {
      await options.onItem(batch[offset], index + offset);
      processed += 1;
      if (options.shouldStop?.()) {
        stopped = true;
        break;
      }
    }

    batches += 1;
    await options.onBatchComplete?.({
      parentLabel: options.parentLabel,
      batchIndex,
      itemCount: batch.length,
      processed,
      stopped,
    });
    if (stopped) {
      break;
    }
    if (index + batchSize < items.length) {
      await options.yieldAfterBatch?.();
    }
  }

  return { processed, batches, stopped };
}

export async function yieldToMainThread(delayMs: number = 0): Promise<void> {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible' && delayMs <= 0) {
    return;
  }
  await new Promise((resolve) => window.setTimeout(resolve, delayMs));
}
