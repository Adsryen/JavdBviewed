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
import {
  buildMagnetQualityTagStyle,
  createMagnetQualityTag,
} from '../../src/features/magnets/ui/qualityTag';
import type { MagnetResult } from '../../src/features/magnets/domain/types';

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

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
      sizeBytes: 4.2 * GB,
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
      sizeBytes: 60 * MB,
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

  it('ranks labeled qualities by clarity when size and seeders are equal', () => {
    const common = {
      sizeBytes: 4 * GB,
      seeders: 10,
    };
    const score4k = calculateMagnetQualityScore(magnet({
      ...common,
      name: 'ABC-123 4K',
      quality: '4K',
    }));
    const score1080 = calculateMagnetQualityScore(magnet({
      ...common,
      name: 'ABC-123 1080p',
      quality: '1080p',
    }));
    const score720 = calculateMagnetQualityScore(magnet({
      ...common,
      name: 'ABC-123 720p',
      quality: '720p',
    }));
    const score480 = calculateMagnetQualityScore(magnet({
      ...common,
      name: 'ABC-123 480p',
      quality: '480p',
    }));

    expect(score4k.score).toBeGreaterThan(score1080.score);
    expect(score1080.score).toBeGreaterThan(score720.score);
    expect(score720.score).toBeGreaterThan(score480.score);
    expect(score4k.reasons.join(' ')).toContain('4K');
    expect(score1080.reasons.join(' ')).toContain('1080p');
  });

  it('prefers larger size within the same quality label', () => {
    const larger = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 1080p',
      quality: '1080p',
      sizeBytes: 6 * GB,
      seeders: 5,
    }));
    const smaller = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 1080p',
      quality: '1080p',
      sizeBytes: 1 * GB,
      seeders: 5,
    }));

    expect(larger.score).toBeGreaterThan(smaller.score);
    expect(larger.reasons.join(' ')).toMatch(/体积|大小/);
  });

  it('lets unknown large size score mid-high and beat small labeled 720p', () => {
    const unknownLarge = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 raw',
      sizeBytes: 8 * GB,
      seeders: 5,
    }));
    const small720 = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 720p',
      quality: '720p',
      sizeBytes: 800 * MB,
      seeders: 5,
    }));

    expect(unknownLarge.score).toBeGreaterThanOrEqual(45);
    expect(unknownLarge.reasons.join(' ')).toMatch(/体积|大小/);
    expect(unknownLarge.score).toBeGreaterThan(small720.score);
  });

  it('does not let high seeders on small 720p beat low-seeder large 1080p', () => {
    const highSeeder720 = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 720p',
      quality: '720p',
      sizeBytes: 800 * MB,
      seeders: 100,
    }));
    const lowSeeder1080 = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 1080p',
      quality: '1080p',
      sizeBytes: 5 * GB,
      seeders: 5,
    }));

    expect(highSeeder720.score).toBeLessThan(lowSeeder1080.score);
  });

  it('caps huge sizes so score stays within 0-100 with limited growth past 20GB', () => {
    const size22 = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 4K',
      quality: '4K',
      sizeBytes: 22 * GB,
      seeders: 5,
    }));
    const size30 = calculateMagnetQualityScore(magnet({
      name: 'ABC-123 4K',
      quality: '4K',
      sizeBytes: 30 * GB,
      seeders: 5,
    }));

    expect(size22.score).toBeLessThanOrEqual(100);
    expect(size30.score).toBeLessThanOrEqual(100);
    // 超过 20GB 后体积分封顶，分差应有限（仅舍入差异）
    expect(Math.abs(size30.score - size22.score)).toBeLessThanOrEqual(2);
    expect(size22.reasons.join(' ')).toMatch(/体积|大小/);
    expect(size30.reasons.join(' ')).toMatch(/体积|大小/);
  });
});

describe('magnet quality tag color', () => {
  function extractHue(background: string): number {
    const match = background.match(/^hsl\((\d+),/);
    return match ? Number(match[1]) : Number.NaN;
  }

  it('maps representative scores to a stable cold-to-hot gradient', () => {
    const scores = [0, 30, 60, 100];
    const styles = scores.map(score => buildMagnetQualityTagStyle(score));
    const hues = styles.map(style => extractHue(style.background));

    expect(new Set(styles.map(style => style.background)).size).toBe(scores.length);
    expect(new Set(styles.map(style => style.border)).size).toBe(scores.length);
    expect(hues).toEqual([...hues].sort((a, b) => b - a));
    expect(hues[0]).toBeGreaterThan(180);
    expect(hues[hues.length - 1]).toBeLessThan(40);
    expect(buildMagnetQualityTagStyle(60)).toEqual(buildMagnetQualityTagStyle(60));
  });

  it('clamps out-of-range scores before building color tokens', () => {
    expect(buildMagnetQualityTagStyle(-20)).toEqual(buildMagnetQualityTagStyle(0));
    expect(buildMagnetQualityTagStyle(150)).toEqual(buildMagnetQualityTagStyle(100));
  });

  it('applies gradient tokens to the rendered quality tag without Bulma color classes', () => {
    const tag = createMagnetQualityTag(magnet({
      name: 'SSIS-795 中文字幕 1080p',
      size: '4.20 GB',
      sizeBytes: 4.2 * GB,
      seeders: 128,
      quality: '1080p',
      hasSubtitle: true,
    }));

    expect(tag.className).toBe('tag is-small jdb-magnet-quality-tag');
    expect(tag.style.getPropertyValue('--jdb-magnet-quality-bg')).toMatch(/^hsl\(/);
    expect(tag.style.getPropertyValue('--jdb-magnet-quality-border')).toMatch(/^hsl\(/);
    expect(tag.style.getPropertyValue('--jdb-magnet-quality-text')).toMatch(/^hsl\(/);
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
      sizeBytes: 4 * GB,
      date: '2026-01-01',
      seeders: 5,
      quality: '1080p',
      hasSubtitle: true,
    });
    const highSeeder = magnet({
      name: 'ABC-123 720p',
      sizeBytes: 2 * GB,
      date: '2026-01-02',
      seeders: 300,
      quality: '720p',
      hasSubtitle: false,
    });
    const largest = magnet({
      name: 'ABC-123 4K',
      sizeBytes: 12 * GB,
      date: '2025-12-01',
      seeders: 1,
      quality: '4K',
      hasSubtitle: false,
    });
    const newest = magnet({
      name: 'ABC-123 normal',
      sizeBytes: 1 * GB,
      date: '2026-02-01',
      seeders: 10,
      hasSubtitle: false,
    });
    const items = [newest, largest, highSeeder, lowSeeder];

    // 质量排序：清晰度优先，4K 应高于高做种 720p 与字幕 1080p
    const qualitySorted = sortMagnetResultsByMode(items, 'quality');
    expect(qualitySorted[0].name).toBe('ABC-123 4K');
    expect(qualitySorted.map((item) => item.name).indexOf('ABC-123 4K'))
      .toBeLessThan(qualitySorted.map((item) => item.name).indexOf('ABC-123 720p'));
    expect(qualitySorted.map((item) => item.name).indexOf('ABC-123 中文字幕 1080p'))
      .toBeLessThan(qualitySorted.map((item) => item.name).indexOf('ABC-123 720p'));

    expect(sortMagnetResultsByMode(items, 'seeders')[0].name).toBe('ABC-123 720p');
    expect(sortMagnetResultsByMode(items, 'size')[0].name).toBe('ABC-123 4K');
    expect(sortMagnetResultsByMode(items, 'date')[0].name).toBe('ABC-123 normal');
    expect(sortMagnetResultsByMode(items, 'subtitle')[0].name).toBe('ABC-123 中文字幕 1080p');
  });

  it('uses quality score before default ordering as the subtitle preset tie-breaker', () => {
    const highQuality = magnet({
      name: 'ABC-123 1080p',
      sizeBytes: 4 * GB,
      seeders: 80,
      quality: '1080p',
      hasSubtitle: false,
    });
    const crackedLowQuality = magnet({
      name: 'ABC-123 crack',
      sizeBytes: 500 * MB,
      seeders: 1,
      hasSubtitle: false,
    });

    expect(sortMagnetResultsByMode([crackedLowQuality, highQuality], 'subtitle')[0].name).toBe('ABC-123 1080p');
  });
});
