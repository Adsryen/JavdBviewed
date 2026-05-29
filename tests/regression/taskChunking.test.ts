import { describe, expect, it } from 'vitest';
import { runChunkedWork } from '../../src/platform/tasks/chunking';

describe('task chunking regression behavior', () => {
  it('processes items in configured batches', async () => {
    const seen: number[] = [];
    const yields: number[] = [];

    const result = await runChunkedWork([1, 2, 3, 4, 5], {
      batchSize: 2,
      onItem: async (item) => {
        seen.push(item);
      },
      yieldAfterBatch: async () => {
        yields.push(Date.now());
      },
    });

    expect(seen).toEqual([1, 2, 3, 4, 5]);
    expect(result.processed).toBe(5);
    expect(result.batches).toBe(3);
    expect(yields).toHaveLength(2);
  });

  it('stops when shouldStop returns true between batches', async () => {
    const seen: number[] = [];

    const result = await runChunkedWork([1, 2, 3, 4, 5], {
      batchSize: 2,
      onItem: async (item) => {
        seen.push(item);
      },
      shouldStop: () => seen.length >= 3,
    });

    expect(seen).toEqual([1, 2, 3]);
    expect(result.processed).toBe(3);
    expect(result.stopped).toBe(true);
    expect(result.batches).toBe(2);
  });

  it('reports batch completion with parent label and progress', async () => {
    const logs: string[] = [];

    await runChunkedWork(['a', 'b', 'c'], {
      parentLabel: 'demo',
      batchSize: 2,
      onItem: async () => {},
      onBatchComplete: async (info) => {
        logs.push(`${info.parentLabel}:${info.batchIndex}:${info.itemCount}:${info.processed}:${info.stopped}`);
      },
    });

    expect(logs).toEqual(['demo:0:2:2:false', 'demo:1:1:3:false']);
  });
});
