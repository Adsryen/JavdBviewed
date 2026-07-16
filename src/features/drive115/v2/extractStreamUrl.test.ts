/**
 * @file extractStreamUrl.test.ts
 * @description 115 播放响应解析单测
 * @module features/drive115
 */
import { describe, expect, it } from 'vitest';
import { extractStreamUrlFromPlayResponse } from './index';

describe('extractStreamUrlFromPlayResponse', () => {
  it('reads nested video_url map', () => {
    expect(
      extractStreamUrlFromPlayResponse({
        state: true,
        data: { video_url: { '1': 'https://cdn.example/a.m3u8' } },
      }),
    ).toBe('https://cdn.example/a.m3u8');
  });

  it('reads direct url field', () => {
    expect(
      extractStreamUrlFromPlayResponse({
        data: { url: 'https://cdn.example/v.mp4' },
      }),
    ).toBe('https://cdn.example/v.mp4');
  });

  it('returns undefined when empty', () => {
    expect(extractStreamUrlFromPlayResponse({ state: true, data: {} })).toBeUndefined();
  });
});
