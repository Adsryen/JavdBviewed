/**
 * @file mediaWatchEvidence.ts
 * @description 本地真实观看证据（与 JavDB 原站 status 分离）
 * @module features/media
 */
import { STORAGE_KEYS } from '../../utils/config';
import { getValue, setValue } from '../../utils/storage';

export type MediaWatchEvidenceSource = 'drive115' | 'emby' | 'manual';

export type MediaWatchEvidence = {
  source: MediaWatchEvidenceSource;
  /** 0–100 */
  percent: number;
  watched: boolean;
  lastPlayedAt: number;
  pickCode?: string;
  fileId?: string;
  fileName?: string;
  positionSec?: number;
  durationSec?: number;
};

export type MediaWatchEvidenceMap = Record<string, MediaWatchEvidence>;

const EMPTY: MediaWatchEvidenceMap = {};

/** 真实已看阈值（与 Emby watchState 默认一致） */
export const LOCAL_WATCHED_PERCENT_THRESHOLD = 90;

/**
 * 读取全部本地观看证据
 */
export async function loadWatchEvidenceMap(): Promise<MediaWatchEvidenceMap> {
  return getValue<MediaWatchEvidenceMap>(STORAGE_KEYS.MEDIA_WATCH_EVIDENCE, EMPTY);
}

/**
 * 读取单番号证据
 */
export async function getWatchEvidence(code: string): Promise<MediaWatchEvidence | null> {
  const key = normalizeCodeKey(code);
  if (!key) return null;
  const map = await loadWatchEvidenceMap();
  return map[key] || null;
}

/**
 * 上报/合并播放进度（取较高进度，不降级）
 */
export async function reportWatchProgress(input: {
  code: string;
  source: MediaWatchEvidenceSource;
  percent?: number;
  positionSec?: number;
  durationSec?: number;
  pickCode?: string;
  fileId?: string;
  fileName?: string;
  forceWatched?: boolean;
}): Promise<MediaWatchEvidence> {
  const key = normalizeCodeKey(input.code);
  if (!key) {
    throw new Error('无效番号');
  }

  let percent = Number(input.percent);
  if (!Number.isFinite(percent) || percent < 0) {
    if (
      Number.isFinite(input.positionSec)
      && Number.isFinite(input.durationSec)
      && (input.durationSec as number) > 0
    ) {
      percent = Math.min(100, ((input.positionSec as number) / (input.durationSec as number)) * 100);
    } else {
      percent = 0;
    }
  }
  percent = Math.max(0, Math.min(100, percent));

  const map = await loadWatchEvidenceMap();
  const prev = map[key];
  const now = Date.now();
  const nextPercent = Math.max(prev?.percent || 0, percent);
  const watched =
    input.forceWatched === true
    || nextPercent >= LOCAL_WATCHED_PERCENT_THRESHOLD
    || prev?.watched === true;

  const next: MediaWatchEvidence = {
    source: input.source,
    percent: nextPercent,
    watched,
    lastPlayedAt: now,
    pickCode: input.pickCode || prev?.pickCode,
    fileId: input.fileId || prev?.fileId,
    fileName: input.fileName || prev?.fileName,
    positionSec: input.positionSec ?? prev?.positionSec,
    durationSec: input.durationSec ?? prev?.durationSec,
  };

  map[key] = next;
  await setValue(STORAGE_KEYS.MEDIA_WATCH_EVIDENCE, map);
  return next;
}

function normalizeCodeKey(code: string): string {
  return String(code || '').trim().toUpperCase();
}
