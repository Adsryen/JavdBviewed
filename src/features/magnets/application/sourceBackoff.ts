import type { MagnetSourceKey } from '../domain/types';

export const MAGNET_SOURCE_BACKOFF_MS = 15 * 60 * 1000;

export interface MagnetSourceBackoffEntry {
  failedAt: number;
  retryAt: number;
  error?: string;
}

export type MagnetSourceBackoffState = Partial<Record<MagnetSourceKey, MagnetSourceBackoffEntry>>;

export interface MagnetSourceBackoffFilterOptions {
  manual?: boolean;
  now?: number;
}

export interface MagnetSourceBackoffCandidate {
  key: MagnetSourceKey;
}

export function recordMagnetSourceFailure(
  state: MagnetSourceBackoffState,
  sourceKey: MagnetSourceKey,
  error: unknown,
  now = Date.now(),
  backoffMs = MAGNET_SOURCE_BACKOFF_MS,
): MagnetSourceBackoffEntry {
  const entry: MagnetSourceBackoffEntry = {
    failedAt: now,
    retryAt: now + backoffMs,
    error: normalizeBackoffError(error),
  };
  state[sourceKey] = entry;
  return entry;
}

export function recordMagnetSourceSuccess(
  state: MagnetSourceBackoffState,
  sourceKey: MagnetSourceKey,
): void {
  delete state[sourceKey];
}

export function clearMagnetSourceBackoff(
  state: MagnetSourceBackoffState,
  sourceKey: MagnetSourceKey,
): void {
  delete state[sourceKey];
}

export function getMagnetSourceBackoff(
  state: MagnetSourceBackoffState,
  sourceKey: MagnetSourceKey,
): MagnetSourceBackoffEntry | undefined {
  return state[sourceKey];
}

export function shouldSkipMagnetSource(
  state: MagnetSourceBackoffState,
  sourceKey: MagnetSourceKey,
  now = Date.now(),
): boolean {
  const entry = state[sourceKey];
  return !!entry && entry.retryAt > now;
}

export function filterMagnetSourcesByBackoff<T extends MagnetSourceBackoffCandidate>(
  sources: T[],
  state: MagnetSourceBackoffState,
  options: MagnetSourceBackoffFilterOptions = {},
): { runnable: T[]; skipped: Array<{ source: T; entry: MagnetSourceBackoffEntry }> } {
  if (options.manual) {
    return { runnable: sources, skipped: [] };
  }

  const now = options.now ?? Date.now();
  const runnable: T[] = [];
  const skipped: Array<{ source: T; entry: MagnetSourceBackoffEntry }> = [];

  sources.forEach((source) => {
    if (shouldSkipMagnetSource(state, source.key, now)) {
      const entry = getMagnetSourceBackoff(state, source.key);
      if (entry) skipped.push({ source, entry });
      return;
    }
    runnable.push(source);
  });

  return { runnable, skipped };
}

export function describeMagnetSourceBackoff(
  entry: MagnetSourceBackoffEntry,
  now = Date.now(),
): string {
  const remainingMs = Math.max(0, entry.retryAt - now);
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `来源暂时退避，约 ${remainingMinutes} 分钟后重试`;
}

function normalizeBackoffError(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  return String(error);
}
