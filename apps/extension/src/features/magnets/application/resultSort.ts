/**
 * @file resultSort.ts
 * @description 磁力结果排序策略
 * @module features/magnets
 */
import { calculateMagnetQualityScore } from './qualityScore';
import {
  isCrackedVersion,
  sortMagnetResults,
} from './resultMetadata';
import type { MagnetResult, MagnetSortMode } from '../domain/types';

const MAGNET_SORT_MODE_SET: Record<MagnetSortMode, true> = {
  default: true,
  quality: true,
  seeders: true,
  size: true,
  date: true,
  subtitle: true,
};

function isMagnetSortMode(value: string): value is MagnetSortMode {
  return Object.prototype.hasOwnProperty.call(MAGNET_SORT_MODE_SET, value);
}

function compareDefault(a: MagnetResult, b: MagnetResult): number {
  if (a.hasSubtitle && !b.hasSubtitle) return -1;
  if (!a.hasSubtitle && b.hasSubtitle) return 1;

  const aIsCracked = isCrackedVersion(a.name);
  const bIsCracked = isCrackedVersion(b.name);
  if (aIsCracked && !bIsCracked) return -1;
  if (!aIsCracked && bIsCracked) return 1;

  if (a.sizeBytes !== b.sizeBytes) {
    return b.sizeBytes - a.sizeBytes;
  }

  if (a.date && b.date) {
    return compareByDateDesc(a.date, b.date);
  }

  return compareByNumberDesc(a.seeders, b.seeders);
}

function compareByNumberDesc(a: number | undefined, b: number | undefined): number {
  return (b || 0) - (a || 0);
}

function compareByDateDesc(a: string, b: string): number {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function compareQuality(a: MagnetResult, b: MagnetResult): number {
  return calculateMagnetQualityScore(b).score - calculateMagnetQualityScore(a).score;
}

function compareWithTieBreakers(primary: number, a: MagnetResult, b: MagnetResult): number {
  if (primary !== 0) return primary;
  const quality = compareQuality(a, b);
  if (quality !== 0) return quality;
  return compareDefault(a, b);
}

export function normalizeMagnetSortMode(value: unknown): MagnetSortMode {
  if (typeof value !== 'string') return 'default';
  return isMagnetSortMode(value) ? value : 'default';
}

export function sortMagnetResultsByMode(
  results: MagnetResult[],
  mode: MagnetSortMode = 'default',
): MagnetResult[] {
  const sorted = [...results];
  switch (normalizeMagnetSortMode(mode)) {
    case 'quality':
      return sorted.sort((a, b) => {
        const quality = compareQuality(a, b);
        return quality !== 0 ? quality : compareDefault(a, b);
      });
    case 'seeders':
      return sorted.sort((a, b) => compareWithTieBreakers(compareByNumberDesc(a.seeders, b.seeders), a, b));
    case 'size':
      return sorted.sort((a, b) => compareWithTieBreakers(b.sizeBytes - a.sizeBytes, a, b));
    case 'date':
      return sorted.sort((a, b) => compareWithTieBreakers(compareByDateDesc(a.date, b.date), a, b));
    case 'subtitle':
      return sorted.sort((a, b) => {
        const subtitle = Number(b.hasSubtitle) - Number(a.hasSubtitle);
        return compareWithTieBreakers(subtitle, a, b);
      });
    case 'default':
    default:
      return sortMagnetResults(sorted);
  }
}
