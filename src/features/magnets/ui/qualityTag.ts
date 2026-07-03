/**
 * @file qualityTag.ts
 * @description 磁力质量评分标签 DOM helper
 * @module features/magnets
 */
import type { MagnetResult } from '../domain/types';
import { calculateMagnetQualityScore, type MagnetQualityLevel } from '../application/qualityScore';
import {
  detectMagnetQuality,
  detectMagnetSubtitle,
  parseSizeToBytes,
} from '../application/resultMetadata';

export function createMagnetQualityTag(result: MagnetResult): HTMLElement {
  const qualityScore = calculateMagnetQualityScore(result);
  const tag = document.createElement('span');
  const levelClass: Record<MagnetQualityLevel, string> = {
    excellent: 'is-success',
    good: 'is-info',
    normal: 'is-primary',
    low: 'is-light',
  };
  tag.className = `tag ${levelClass[qualityScore.level]} is-small jdb-magnet-quality-tag`;
  tag.textContent = qualityScore.level === 'excellent'
    ? `推荐 ${qualityScore.score}`
    : `质量 ${qualityScore.score}`;
  tag.title = qualityScore.reasons.join('、') || '暂无评分理由';
  tag.style.marginLeft = '4px';
  return tag;
}

export function buildNativeMagnetResult(row: HTMLElement): MagnetResult {
  const name = row.querySelector<HTMLElement>('.magnet-name .name')?.textContent?.trim() || '';
  const metaText = row.querySelector<HTMLElement>('.magnet-name .meta')?.textContent?.trim() || '';
  const tagText = row.querySelector<HTMLElement>('.magnet-name .tags')?.textContent || '';
  const magnet = row.querySelector<HTMLAnchorElement>('a[href^="magnet:"]')?.href || '';
  const date = row.querySelector<HTMLElement>('.date .time')?.textContent?.trim() || '';
  return {
    name,
    magnet,
    size: metaText,
    sizeBytes: parseSizeToBytes(metaText),
    date,
    source: 'JavDB',
    quality: detectMagnetQuality(`${name} ${tagText}`),
    hasSubtitle: detectMagnetSubtitle(`${name} ${tagText}`),
  };
}
