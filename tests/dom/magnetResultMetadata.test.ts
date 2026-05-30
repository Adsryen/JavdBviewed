import { describe, expect, it } from 'vitest';
import {
  detectMagnetQuality,
  detectMagnetSubtitle,
  extractHashFromMagnet,
  getVideoIdMatchCandidates,
  isCrackedVersion,
  isValidMagnetResultName,
  normalizeMagnetDate,
  parseRelativeMagnetDate,
  parseSizeToBytes,
  sortMagnetResults,
} from '../../src/features/magnets/application/resultMetadata';
import type { MagnetResult } from '../../src/features/magnets/domain/types';

function magnet(overrides: Partial<MagnetResult>): MagnetResult {
  return {
    name: 'base',
    magnet: 'magnet:?xt=urn:btih:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    size: '',
    sizeBytes: 0,
    date: '',
    source: 'BTdig',
    hasSubtitle: false,
    ...overrides,
  };
}

describe('magnet result metadata', () => {
  it('parses common size units to bytes', () => {
    expect(parseSizeToBytes('1.5 GB')).toBe(1.5 * 1024 * 1024 * 1024);
    expect(parseSizeToBytes('700 MB')).toBe(700 * 1024 * 1024);
    expect(parseSizeToBytes('bad')).toBe(0);
  });

  it('detects subtitle and quality markers from names', () => {
    expect(detectMagnetSubtitle('[中文字幕] MKMP-577 1080p')).toBe(true);
    expect(detectMagnetSubtitle('MKMP-577 cd1')).toBe(false);
    expect(detectMagnetQuality('MKMP-577 2160p')).toBe('4K');
    expect(detectMagnetQuality('MKMP-577 720p')).toBe('720p');
  });

  it('matches FC2 naming variants against a normalized video id', () => {
    expect(getVideoIdMatchCandidates('FC2-4903984')).toEqual([
      'FC2-4903984',
      'FC2PPV4903984',
      'FC2-PPV-4903984',
      'FC2 PPV 4903984',
    ]);
    expect(isValidMagnetResultName('FC2PPV4903984 1080p', 'FC2-4903984')).toBe(true);
    expect(isValidMagnetResultName('FC2-PPV-4903984 leaked', 'FC2-4903984')).toBe(true);
    expect(isValidMagnetResultName('MKMP-577 1080p', 'FC2-4903984')).toBe(false);
  });

  it('normalizes source dates and relative age strings', () => {
    const base = new Date('2026-05-30T12:00:00Z');
    expect(parseRelativeMagnetDate('found 3 weeks ago', base)).toBe('2026-05-09');
    expect(parseRelativeMagnetDate('bad input', base)).toBe('2024-01-01');
    expect(normalizeMagnetDate('found 2 days ago', 'BTdig', base)).toBe('2026-05-28');
    expect(normalizeMagnetDate('2026-05-24', 'Sukebei', base)).toBe('2026-05-24');
  });

  it('sorts subtitle, cracked, size, date, and seeders in the existing priority order', () => {
    const sorted = sortMagnetResults([
      magnet({ name: 'small', sizeBytes: 1, seeders: 100 }),
      magnet({ name: 'large', sizeBytes: 10, seeders: 0 }),
      magnet({ name: 'crack', sizeBytes: 1, hasSubtitle: false }),
      magnet({ name: '字幕', sizeBytes: 1, hasSubtitle: true }),
    ]);

    expect(sorted.map((item) => item.name)).toEqual(['字幕', 'crack', 'large', 'small']);
    expect(isCrackedVersion('leaked uncensored release')).toBe(true);
    expect(extractHashFromMagnet('magnet:?xt=urn:btih:ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe('abcdefabcdefabcdefabcdefabcdefabcdefabcd');
  });
});
