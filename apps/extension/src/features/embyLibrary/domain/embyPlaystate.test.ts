/**
 * @file embyPlaystate.test.ts
 * @description 进度写回：ticks 换算 + UserData / PlayingItems
 * @module features/embyLibrary
 */
import { describe, expect, it, vi } from 'vitest';
import { reportEmbyPlaybackProgress, secondsToTicks, ticksToSeconds } from './embyPlaystate';

describe('embyPlaystate', () => {
  it('converts seconds and ticks', () => {
    expect(secondsToTicks(1)).toBe(10_000_000);
    expect(secondsToTicks(12.5)).toBe(125_000_000);
    expect(ticksToSeconds(10_000_000)).toBe(1);
  });

  it('writes UserData first when user session exists', async () => {
    const fetchImpl = vi.fn(async (_url: string) => {
      // UserData / PlayingItems Start / Progress 都返回 204
      return new Response(null, { status: 204 });
    });
    const ret = await reportEmbyPlaybackProgress({
      server: {
        url: 'http://emby.local:8096',
        apiKey: 'k',
        accessToken: 'tok',
        userId: 'u1',
        type: 'emby',
      },
      itemId: '99',
      positionSeconds: 42,
      durationSeconds: 120,
      mediaSourceId: 'ms',
      playSessionId: 'ps',
      fetchImpl: fetchImpl as any,
    });
    expect(ret.success).toBe(true);
    expect(['userdata', 'both', 'playing_progress']).toContain(ret.method);
    expect(fetchImpl).toHaveBeenCalled();
    const urls = fetchImpl.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('/Users/u1/Items/99/UserData'))).toBe(true);
  });

  it('stops PlayingItems session when isStopped', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      return new Response(null, { status: 204 });
    });
    const ret = await reportEmbyPlaybackProgress({
      server: {
        url: 'http://emby.local:8096',
        apiKey: 'k',
        accessToken: 'tok',
        userId: 'u1',
        type: 'emby',
      },
      itemId: '99',
      positionSeconds: 42,
      durationSeconds: 120,
      mediaSourceId: 'ms',
      playSessionId: 'ps',
      isStopped: true,
      fetchImpl: fetchImpl as any,
    });
    expect(ret.success).toBe(true);
    const calls = fetchImpl.mock.calls.map((c) => ({
      url: String(c[0]),
      method: String((c[1] as RequestInit | undefined)?.method || 'GET').toUpperCase(),
    }));
    expect(calls.some((c) => c.url.includes('/Users/u1/Items/99/UserData'))).toBe(true);
    // 关播：DELETE PlayingItems（或 /Delete），并尽量 Sessions/Playing/Stopped
    expect(
      calls.some((c) =>
        c.url.includes('/Users/u1/PlayingItems/99')
        && (c.method === 'DELETE' || c.url.includes('/Delete')),
      ),
    ).toBe(true);
    expect(calls.some((c) => c.url.includes('/Sessions/Playing/Stopped'))).toBe(true);
    // 关播不应再 Start 会话
    expect(
      calls.some((c) =>
        c.method === 'POST'
        && /\/PlayingItems\/99(\?|$)/.test(c.url)
        && !c.url.includes('/Progress')
        && !c.url.includes('/Delete'),
      ),
    ).toBe(false);
  });

  it('fails clearly without auth', async () => {
    const ret = await reportEmbyPlaybackProgress({
      server: {
        url: 'http://emby.local:8096',
        apiKey: '',
        type: 'emby',
      },
      itemId: '1',
      positionSeconds: 10,
      fetchImpl: (async () => new Response(null, { status: 200 })) as any,
    });
    expect(ret.success).toBe(false);
    expect(ret.method).toBe('none');
  });

  it('skips zero progress', async () => {
    const ret = await reportEmbyPlaybackProgress({
      server: {
        url: 'http://emby.local:8096',
        apiKey: 'k',
        accessToken: 'tok',
        userId: 'u1',
        type: 'emby',
      },
      itemId: '1',
      positionSeconds: 0,
      fetchImpl: vi.fn(async () => new Response(null, { status: 204 })) as any,
    });
    expect(ret.success).toBe(false);
    expect(ret.message).toMatch(/0/);
  });
});
