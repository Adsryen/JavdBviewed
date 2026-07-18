/**
 * @file watchState.test.ts
 * @description 真实观看态推导单测
 * @module features/embyLibrary
 */
import { describe, expect, it } from 'vitest';
import {
  computeWatchState,
  formatWatchPercent,
  parseEmbyUserData,
  resolveWatchProgressPercent,
  watchStateLabel,
} from './watchState';

describe('watchState', () => {
  it('parses UserData with percentage', () => {
    const ud = parseEmbyUserData(
      {
        Played: false,
        PlaybackPositionTicks: 1e9,
        PlayedPercentage: 42.6,
        LastPlayedDate: '2024-01-02T03:04:05Z',
      },
      2e9,
    );
    expect(ud).toMatchObject({
      played: false,
      positionTicks: 1e9,
      runtimeTicks: 2e9,
      percent: 42.6,
    });
    expect(ud!.lastPlayedAt).toBeGreaterThan(0);
  });

  it('derives percent from ticks when percentage missing', () => {
    const ud = parseEmbyUserData(
      { Played: false, PlaybackPositionTicks: 25 },
      100,
    );
    expect(ud?.percent).toBe(25);
  });

  it('returns undefined for empty UserData', () => {
    expect(parseEmbyUserData({ Played: false, PlaybackPositionTicks: 0 })).toBeUndefined();
    expect(parseEmbyUserData(null)).toBeUndefined();
  });

  it('computes watched / in_progress / in_library', () => {
    expect(computeWatchState(undefined)).toBe('in_library');
    expect(computeWatchState({ played: true, positionTicks: 0, runtimeTicks: 0, percent: 0, lastPlayedAt: 0 })).toBe(
      'watched',
    );
    expect(
      computeWatchState({ played: false, positionTicks: 1, runtimeTicks: 100, percent: 91, lastPlayedAt: 0 }),
    ).toBe('watched');
    expect(
      computeWatchState({ played: false, positionTicks: 10, runtimeTicks: 100, percent: 37, lastPlayedAt: 0 }),
    ).toBe('in_progress');
    expect(
      computeWatchState({ played: false, positionTicks: 0, runtimeTicks: 100, percent: 0, lastPlayedAt: 0 }),
    ).toBe('in_library');
  });

  it('labels and formats percent', () => {
    expect(watchStateLabel('watched')).toBe('真实已看');
    expect(watchStateLabel('in_progress')).toBe('在看');
    expect(formatWatchPercent({ played: false, positionTicks: 0, runtimeTicks: 0, percent: 37.2, lastPlayedAt: 0 })).toBe(
      '37%',
    );
  });

  it('resolves progress from ticks when percent is zero', () => {
    expect(
      resolveWatchProgressPercent({
        played: false,
        positionTicks: 300_000_000,
        runtimeTicks: 1_000_000_000,
        percent: 0,
        lastPlayedAt: 1,
      }),
    ).toBe(30);
    // 有 position 无 runtime：给可见占位，避免续看条空白
    expect(
      resolveWatchProgressPercent({
        played: false,
        positionTicks: 10,
        runtimeTicks: 0,
        percent: 0,
        lastPlayedAt: 1,
      }),
    ).toBe(5);
  });
});
