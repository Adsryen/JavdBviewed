import { describe, expect, it } from 'vitest';
import {
  createPreviewCacheEntry,
  getPreviewSourceType,
  isKnownBadVbgflPreviewUrl,
  parsePreviewCacheEntry,
  serializePreviewCacheEntry,
  isVbgflMusumeCode,
  isVbgflPacoCode,
  isVbgflPondoCode,
  normalizePreviewUrl,
} from '../../src/content/previewSourceRules';

describe('preview source rules', () => {
  it('does not classify standard maker codes as 1Pondo sample codes', () => {
    expect(isVbgflPondoCode('MADM-218')).toBe(false);
    expect(isVbgflPondoCode('HUNTC-123')).toBe(false);
  });

  it('classifies numeric sample-site codes by their numeric pattern', () => {
    expect(isVbgflPondoCode('123456_789')).toBe(true);
    expect(isVbgflPondoCode('123456-789')).toBe(true);
    expect(isVbgflMusumeCode('123456-78')).toBe(true);
    expect(isVbgflPacoCode('123456-789')).toBe(false);
  });

  it('detects stale VBGFL cache URLs generated for incompatible codes', () => {
    expect(isKnownBadVbgflPreviewUrl(
      'MADM-218',
      'https://smovie.1pondo.tv/sample/movies/madm_218/1080p.mp4',
    )).toBe(true);

    expect(isKnownBadVbgflPreviewUrl(
      '123456_789',
      'https://smovie.1pondo.tv/sample/movies/123456_789/1080p.mp4',
    )).toBe(false);
  });

  it('detects HLS preview sources and decodes HTML escaped URLs', () => {
    const url = 'https://javdb.com/movies/ttm3u8/preview/395301/0/720p.m3u8?sign=a&amp;t=1';

    expect(normalizePreviewUrl(url)).toBe('https://javdb.com/movies/ttm3u8/preview/395301/0/720p.m3u8?sign=a&t=1');
    expect(getPreviewSourceType(url)).toBe('application/vnd.apple.mpegurl');
    expect(getPreviewSourceType('https://example.test/sample.mp4')).toBe('video/mp4');
  });

  it('parses fresh structured preview cache entries and rejects expired ones', () => {
    const now = 1_000_000;
    const entry = createPreviewCacheEntry('https://example.test/sample.mp4', 'javspyl', now);

    expect(parsePreviewCacheEntry(serializePreviewCacheEntry(entry), now + 1000)).toMatchObject({
      url: 'https://example.test/sample.mp4',
      type: 'video/mp4',
      source: 'javspyl',
      failures: 0,
    });

    expect(parsePreviewCacheEntry(serializePreviewCacheEntry(entry), now + 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it('keeps legacy mp4 cache entries but drops legacy hls cache entries', () => {
    expect(parsePreviewCacheEntry('https://example.test/sample.mp4', 1_000_000)).toMatchObject({
      url: 'https://example.test/sample.mp4',
      type: 'video/mp4',
      source: 'legacy',
    });

    expect(parsePreviewCacheEntry('https://javdb.com/preview/720p.m3u8?sign=a&amp;t=1', 1_000_000)).toBeNull();
  });
});
