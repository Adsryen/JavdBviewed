/**
 * @file qualityTag.ts
 * @description 磁力质量评分标签 DOM helper
 * @module features/magnets
 */
import type { MagnetResult } from '../domain/types';
import { calculateMagnetQualityScore } from '../application/qualityScore';
import {
  detectMagnetQuality,
  detectMagnetSubtitle,
  parseSizeToBytes,
} from '../application/resultMetadata';

export interface MagnetQualityTagStyle {
  background: string;
  border: string;
  text: string;
}

function clampQualityScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function interpolate(start: number, end: number, ratio: number): number {
  return Math.round(start + (end - start) * ratio);
}

export function buildMagnetQualityTagStyle(score: number): MagnetQualityTagStyle {
  const normalized = clampQualityScore(score);
  const ratio = normalized / 100;
  const hue = interpolate(210, 18, ratio);
  const saturation = interpolate(24, 86, ratio);

  return {
    background: `hsl(${hue}, ${saturation}%, ${interpolate(90, 84, ratio)}%)`,
    border: `hsl(${hue}, ${interpolate(30, 88, ratio)}%, ${interpolate(72, 54, ratio)}%)`,
    text: `hsl(${hue}, ${interpolate(34, 84, ratio)}%, ${interpolate(24, 20, ratio)}%)`,
  };
}

export function createMagnetQualityTag(result: MagnetResult): HTMLElement {
  const qualityScore = calculateMagnetQualityScore(result);
  const style = buildMagnetQualityTagStyle(qualityScore.score);
  const tag = document.createElement('span');
  tag.className = 'tag is-small jdb-magnet-quality-tag';
  tag.textContent = qualityScore.level === 'excellent'
    ? `推荐 ${qualityScore.score}`
    : `质量 ${qualityScore.score}`;
  tag.title = qualityScore.reasons.join('、') || '暂无评分理由';
  tag.style.setProperty('--jdb-magnet-quality-bg', style.background);
  tag.style.setProperty('--jdb-magnet-quality-border', style.border);
  tag.style.setProperty('--jdb-magnet-quality-text', style.text);
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
