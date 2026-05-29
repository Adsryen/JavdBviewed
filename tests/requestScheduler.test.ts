import { describe, expect, it, vi } from 'vitest';
import { RequestScheduler } from '../src/platform/network/requestScheduler';

describe('RequestScheduler', () => {
  it('deduplicates identical in-flight requests', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('ok', { status: 200 }),
    ) as unknown as typeof fetch;
    const scheduler = new RequestScheduler({ fetchImpl });

    const first = scheduler.enqueue('https://example.com/a');
    const second = scheduler.enqueue('https://example.com/a');

    await expect(first).resolves.toBe(await second);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('respects per-host concurrency limits', async () => {
    let releaseFirst!: () => void;
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      }
      return new Response('ok', { status: 200 });
    }) as unknown as typeof fetch;
    const scheduler = new RequestScheduler({
      fetchImpl,
      config: {
        globalMaxConcurrent: 2,
        perHostMaxConcurrent: 1,
        perHostRateLimitPerMin: 60,
      },
    });

    const first = scheduler.enqueue('https://example.com/a');
    const second = scheduler.enqueue('https://example.com/b');
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    releaseFirst();
    await first;
    await second;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
