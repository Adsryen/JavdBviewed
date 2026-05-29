export interface ChunkedWorkOptions<T> {
  batchSize?: number;
  onItem: (item: T, index: number) => Promise<void> | void;
  yieldAfterBatch?: () => Promise<void> | void;
  shouldStop?: () => boolean;
  parentLabel?: string;
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
