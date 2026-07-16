/**
 * @file watchState.ts
 * @description Emby/JF 真实观看态：从 UserData 摘要推导展示状态
 * @module features/embyLibrary
 */
import type { EmbyUserDataPayload, EmbyWatchUserData } from '../types';

/** 媒体库/番号侧展示用观看态（与原站「已看」语义分离） */
export type MediaWatchState = 'none' | 'in_library' | 'in_progress' | 'watched';

/** 默认：进度 ≥ 此阈值且非明确未看完时，视为真实已看 */
export const DEFAULT_WATCHED_PERCENT_THRESHOLD = 90;

/** 有进度但未达真实已看的最低百分比（避免 0% 噪声） */
export const DEFAULT_IN_PROGRESS_MIN_PERCENT = 1;

export type WatchStateOptions = {
  /** 真实已看进度阈值 0–100 */
  watchedPercentThreshold?: number;
  /** 视为「在看」的最小进度 */
  inProgressMinPercent?: number;
};

/**
 * 解析 Emby/JF API UserData → 本地摘要
 */
export function parseEmbyUserData(
  raw: EmbyUserDataPayload | null | undefined,
  runtimeTicksFromItem = 0,
): EmbyWatchUserData | undefined {
  if (!raw || typeof raw !== 'object') {
    // 无 UserData 时仍可带 runtime，但无观看信息则不写字段
    return undefined;
  }

  const positionTicks = Math.max(0, Number(raw.PlaybackPositionTicks) || 0);
  const runtimeTicks = Math.max(0, runtimeTicksFromItem || 0);
  const played = raw.Played === true;

  let percent = Number(raw.PlayedPercentage);
  if (!Number.isFinite(percent) || percent < 0) {
    if (runtimeTicks > 0 && positionTicks > 0) {
      percent = Math.min(100, (positionTicks / runtimeTicks) * 100);
    } else {
      percent = played ? 100 : 0;
    }
  }
  percent = Math.max(0, Math.min(100, percent));

  let lastPlayedAt = 0;
  if (raw.LastPlayedDate) {
    const t = Date.parse(String(raw.LastPlayedDate));
    if (Number.isFinite(t)) lastPlayedAt = t;
  }

  // 全空且未播放：可不存，节省体积；但 played/position 任一有意义则存
  if (!played && positionTicks <= 0 && percent <= 0 && lastPlayedAt <= 0) {
    return undefined;
  }

  return {
    played,
    positionTicks,
    runtimeTicks,
    percent,
    lastPlayedAt,
  };
}

/**
 * 由索引条目是否存在 + UserData 推导展示态
 * - none：未入库（调用方无 entry 时使用）
 * - in_library：已入库、无有效进度
 * - in_progress：有进度未达真实已看
 * - watched：Played 或进度 ≥ 阈值
 */
export function computeWatchState(
  userData: EmbyWatchUserData | null | undefined,
  options: WatchStateOptions = {},
): MediaWatchState {
  const watchedThreshold = options.watchedPercentThreshold ?? DEFAULT_WATCHED_PERCENT_THRESHOLD;
  const inProgressMin = options.inProgressMinPercent ?? DEFAULT_IN_PROGRESS_MIN_PERCENT;

  if (!userData) return 'in_library';

  if (userData.played === true || userData.percent >= watchedThreshold) {
    return 'watched';
  }

  if (userData.positionTicks > 0 || userData.percent >= inProgressMin) {
    return 'in_progress';
  }

  return 'in_library';
}

/**
 * 展示文案
 */
export function watchStateLabel(state: MediaWatchState): string {
  if (state === 'watched') return '真实已看';
  if (state === 'in_progress') return '在看';
  if (state === 'in_library') return '已入库';
  return '';
}

/**
 * 进度展示（如 37%）
 */
export function formatWatchPercent(userData: EmbyWatchUserData | null | undefined): string {
  if (!userData) return '';
  const p = Math.round(userData.percent);
  if (!Number.isFinite(p) || p <= 0) return '';
  return `${Math.min(100, p)}%`;
}
