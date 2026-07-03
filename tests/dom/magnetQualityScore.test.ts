/**
 * @file magnetQualityScore.test.ts
 * @description 磁力质量评分与排序策略测试
 * @module tests/dom
 */
import { describe, expect, it } from 'vitest';
import {
  calculateMagnetQualityScore,
} from '../../src/features/magnets/application/qualityScore';
import {
  sortMagnetResultsByMode,
  normalizeMagnetSortMode,
} from '../../src/features/magnets/application/resultSort';
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

describe('magnet quality score', () => {
  it('assigns excellent score to seeded subtitle HD resources with complete names', () => {
    const score = calculateMagnetQualityScore(magnet({
      name: 'SSIS-795 中文字幕 1080p',
      size: '4.20 GB',
      sizeBytes: 4.2 * 1024 * 1024 * 1024,
      seeders: 128,
      source: 'JavDB / Sukebei',
      sources: ['JavDB', 'Sukebei'],
      quality: '1080p',
      hasSubtitle: true,
    }));

    expect(score.score).toBeGreaterThanOrEqual(80);
    expect(score.level).toBe('excellent');
    expect(score.reasons.join(' ')).toContain('字幕');
    expect(score.reasons.join(' ')).toContain('1080p');
    expect(score.reasons.join(' ')).toContain('做种');
  });

  it('penalizes tiny generic resources without useful metadata', () => {
    const score = calculateMagnetQualityScore(magnet({
      name: 'download',
      size: '60 MB',
      sizeBytes: 60 * 1024 * 1024,
      seeders: 0,
    }));

    expect(score.score).toBeLessThanOrEqual(35);
    expect(score.level).toBe('low');
    expect(score.reasons.join(' ')).toMatch(/过小|信息不足|做种/);
  });

  it('keeps missing seeders and size as explainable metadata instead of forcing zero quality', () => {
    const score = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 1080p',
      quality: '1080p',
    }));

    expect(score.score).toBeGreaterThan(0);
    expect(score.reasons.join(' ')).toContain('做种未知');
    expect(score.reasons.join(' ')).toContain('大小未知');
  });
});

describe('magnet result sort modes', () => {
  it('normalizes unknown sort modes to the default preset', () => {
    expect(normalizeMagnetSortMode('quality')).toBe('quality');
    expect(normalizeMagnetSortMode('unknown-mode')).toBe('default');
    expect(normalizeMagnetSortMode(undefined)).toBe('default');
  });

  it('keeps the existing default order unchanged', () => {
    const sorted = sortMagnetResultsByMode([
      magnet({ name: 'small', sizeBytes: 1, seeders: 100 }),
      magnet({ name: 'large', sizeBytes: 10, seeders: 0 }),
      magnet({ name: 'crack', sizeBytes: 1, hasSubtitle: false }),
      magnet({ name: '字幕', sizeBytes: 1, hasSubtitle: true }),
    ], 'default');

    expect(sorted.map((item) => item.name)).toEqual(['字幕', 'crack', 'large', 'small']);
  });

  it('sorts by quality, seeders, size, date, and subtitle preset modes', () => {
    const lowSeeder = magnet({
      name: 'ABC-123 中文字幕 1080p',
      sizeBytes: 4 * 1024 * 1024 * 1024,
      date: '2026-01-01',
      seeders: 5,
      quality: '1080p',
      hasSubtitle: true,
    });
    const highSeeder = magnet({
      name: 'ABC-123 720p',
      sizeBytes: 2 * 1024 * 1024 * 1024,
      date: '2026-01-02',
      seeders: 300,
      quality: '720p',
      hasSubtitle: false,
    });
    const largest = magnet({
      name: 'ABC-123 4K',
      sizeBytes: 12 * 1024 * 1024 * 1024,
      date: '2025-12-01',
      seeders: 1,
      quality: '4K',
      hasSubtitle: false,
    });
    const newest = magnet({
      name: 'ABC-123 normal',
      sizeBytes: 1 * 1024 * 1024 * 1024,
      date: '2026-02-01',
      seeders: 10,
      hasSubtitle: false,
    });
    const items = [newest, largest, highSeeder, lowSeeder];

    expect(sortMagnetResultsByMode(items, 'quality')[0].name).toBe('ABC-123 中文字幕 1080p');
    expect(sortMagnetResultsByMode(items, 'seeders')[0].name).toBe('ABC-123 720p');
    expect(sortMagnetResultsByMode(items, 'size')[0].name).toBe('ABC-123 4K');
    expect(sortMagnetResultsByMode(items, 'date')[0].name).toBe('ABC-123 normal');
    expect(sortMagnetResultsByMode(items, 'subtitle')[0].name).toBe('ABC-123 中文字幕 1080p');
  });

  it('uses quality score before default ordering as the subtitle preset tie-breaker', () => {
    const highQuality = magnet({
      name: 'ABC-123 1080p',
      sizeBytes: 4 * 1024 * 1024 * 1024,
      seeders: 80,
      quality: '1080p',
      hasSubtitle: false,
    });
    const crackedLowQuality = magnet({
      name: 'ABC-123 crack',
      sizeBytes: 500 * 1024 * 1024,
      seeders: 1,
      hasSubtitle: false,
    });

    expect(sortMagnetResultsByMode([crackedLowQuality, highQuality], 'subtitle')[0].name).toBe('ABC-123 1080p');
  });
});
