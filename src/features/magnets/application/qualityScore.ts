/**
 * @file qualityScore.ts
 * @description 磁力资源质量评分纯函数
 * @module features/magnets
 */
import { getResultSources } from './resultMerge';
import {
  detectMagnetQuality,
  detectMagnetSubtitle,
  isCrackedVersion,
} from './resultMetadata';
import type { MagnetResult } from '../domain/types';

export type MagnetQualityLevel = 'excellent' | 'good' | 'normal' | 'low';

export interface MagnetQualityScore {
  score: number;
  level: MagnetQualityLevel;
  reasons: string[];
}

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function resolveQualityLabel(result: MagnetResult): string | undefined {
  return result.quality || detectMagnetQuality(result.name);
}

function hasCompleteName(name: string): boolean {
  const normalized = name.trim();
  if (normalized.length < 8) return false;
  if (/^(download|unknown|base|magnet|torrent)$/i.test(normalized)) return false;
  return /[A-Z]{2,8}[-_\s]?\d{2,6}|FC2(?:PPV)?[-_\s]?\d{3,8}/i.test(normalized);
}

function resolveLevel(score: number): MagnetQualityLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'normal';
  return 'low';
}

export function calculateMagnetQualityScore(result: MagnetResult): MagnetQualityScore {
  const reasons: string[] = [];
  let score = 20;

  const seeders = typeof result.seeders === 'number' ? result.seeders : undefined;
  if (typeof seeders === 'number') {
    if (seeders >= 100) {
      score += 25;
      reasons.push('做种多');
    } else if (seeders >= 20) {
      score += 18;
      reasons.push('做种较多');
    } else if (seeders > 0) {
      score += 10;
      reasons.push('有做种');
    } else {
      reasons.push('做种少');
    }
  } else {
    score += 5;
    reasons.push('做种未知');
  }

  const sizeBytes = Number.isFinite(result.sizeBytes) ? result.sizeBytes : 0;
  if (sizeBytes >= GB && sizeBytes <= 8 * GB) {
    score += 20;
    reasons.push('大小合理');
  } else if (sizeBytes > 8 * GB && sizeBytes <= 16 * GB) {
    score += 15;
    reasons.push('大体积资源');
  } else if (sizeBytes >= 500 * MB && sizeBytes < GB) {
    score += 12;
    reasons.push('体积可用');
  } else if (sizeBytes > 0 && sizeBytes < 300 * MB) {
    score -= 10;
    reasons.push('文件过小');
  } else if (sizeBytes > 20 * GB) {
    score -= 5;
    reasons.push('文件过大');
  } else if (sizeBytes <= 0) {
    reasons.push('大小未知');
  }

  const quality = resolveQualityLabel(result);
  if (quality === '4K') {
    score += 18;
    reasons.push('4K');
  } else if (quality === '1080p') {
    score += 15;
    reasons.push('1080p');
  } else if (quality === '720p') {
    score += 10;
    reasons.push('720p');
  } else if (quality === '480p') {
    score += 5;
    reasons.push('480p');
  }

  if (result.hasSubtitle || detectMagnetSubtitle(result.name)) {
    score += 15;
    reasons.push('字幕');
  }

  if (isCrackedVersion(result.name)) {
    score += 8;
    reasons.push('破解');
  }

  if (hasCompleteName(result.name)) {
    score += 10;
    reasons.push('名称完整');
  } else {
    score -= 10;
    reasons.push('信息不足');
  }

  if (getResultSources(result).length > 1) {
    score += 5;
    reasons.push('多源命中');
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    level: resolveLevel(finalScore),
    reasons,
  };
}
