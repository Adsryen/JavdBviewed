/**
 * @file qualityScore.ts
 * @description 磁力资源质量评分纯函数（清晰度优先）
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

/** 分段线性插值 */
function lerp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

/**
 * 体积评分：近单调不减，0～30 封顶，超大不惩罚。
 * ≤0 → 0；<300MB → -8；300MB～1GB → 0～10；1～4GB → 10～18；
 * 4～10GB → 18～26；10～20GB → 26～30；>20GB → 30。
 */
function scoreSize(sizeBytes: number): { points: number; reason: string } {
  if (sizeBytes <= 0) {
    return { points: 0, reason: '大小未知' };
  }
  if (sizeBytes < 300 * MB) {
    return { points: -8, reason: '文件过小' };
  }
  if (sizeBytes < GB) {
    return {
      points: lerp(sizeBytes, 300 * MB, GB, 0, 10),
      reason: '体积可用',
    };
  }
  if (sizeBytes < 4 * GB) {
    return {
      points: lerp(sizeBytes, GB, 4 * GB, 10, 18),
      reason: '大小合理',
    };
  }
  if (sizeBytes < 10 * GB) {
    return {
      points: lerp(sizeBytes, 4 * GB, 10 * GB, 18, 26),
      reason: '体积充足',
    };
  }
  if (sizeBytes <= 20 * GB) {
    return {
      points: lerp(sizeBytes, 10 * GB, 20 * GB, 26, 30),
      reason: '大体积资源',
    };
  }
  return { points: 30, reason: '体积很大' };
}

export function calculateMagnetQualityScore(result: MagnetResult): MagnetQualityScore {
  const reasons: string[] = [];
  // 基线略降，避免高分扎堆
  let score = 15;

  // 做种：轻量辅助，最高 +8，不能单靠做种翻转一档画质
  const seeders = typeof result.seeders === 'number' ? result.seeders : undefined;
  if (typeof seeders === 'number') {
    if (seeders >= 100) {
      score += 8;
      reasons.push('做种多');
    } else if (seeders >= 20) {
      score += 5;
      reasons.push('做种较多');
    } else if (seeders > 0) {
      score += 3;
      reasons.push('有做种');
    } else {
      reasons.push('做种少');
    }
  } else {
    score += 2;
    reasons.push('做种未知');
  }

  // 体积：近单调 + 软上限
  const sizeBytes = Number.isFinite(result.sizeBytes) ? result.sizeBytes : 0;
  const sizeScore = scoreSize(sizeBytes);
  score += sizeScore.points;
  reasons.push(sizeScore.reason);

  // 画质：级差拉开，保证 4K > 1080p > 720p > 480p
  const quality = resolveQualityLabel(result);
  if (quality === '4K') {
    score += 35;
    reasons.push('4K');
  } else if (quality === '1080p') {
    score += 26;
    reasons.push('1080p');
  } else if (quality === '720p') {
    score += 14;
    reasons.push('720p');
  } else if (quality === '480p') {
    score += 6;
    reasons.push('480p');
  }

  // 字幕：略降，避免压画质
  if (result.hasSubtitle || detectMagnetSubtitle(result.name)) {
    score += 12;
    reasons.push('字幕');
  }

  // 破解：次要信号
  if (isCrackedVersion(result.name)) {
    score += 5;
    reasons.push('破解');
  }

  // 名称完整度
  if (hasCompleteName(result.name)) {
    score += 8;
    reasons.push('名称完整');
  } else {
    score -= 8;
    reasons.push('信息不足');
  }

  // 多源命中
  if (getResultSources(result).length > 1) {
    score += 4;
    reasons.push('多源命中');
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    level: resolveLevel(finalScore),
    reasons,
  };
}
