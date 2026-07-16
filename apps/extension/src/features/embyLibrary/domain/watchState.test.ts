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
});
