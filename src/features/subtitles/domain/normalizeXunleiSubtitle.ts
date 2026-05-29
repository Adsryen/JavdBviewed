import type { XunleiSubtitleItem, XunleiSubtitleResponse } from './types';

export function normalizeXunleiSubtitleItems(response: XunleiSubtitleResponse): XunleiSubtitleItem[] {
  const raw = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.subtitles)
      ? response.subtitles
      : [];

  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      name: String(item.name || item.sname || item.title || '').trim(),
      ext: String(item.ext || item.type || '').trim(),
      url: String(item.url || item.surl || item.download_url || '').trim(),
      language: normalizeXunleiSubtitleLanguage(item.language || item.lang || item.languages),
      rate: normalizeXunleiSubtitleRate(item.rate ?? item.score ?? item.fingerprintf_score),
      duration: item.duration as number | string | undefined,
      sourceLabel: normalizeXunleiSubtitleSource(item.extra_name || item.source_name || item.source),
      hash: normalizeXunleiSubtitleHash(item.gcid || item.cid || item.hash),
    }))
    .filter(item => item.name || item.url);
}

export function normalizeXunleiSubtitleLanguage(value: unknown): string {
  const raw = Array.isArray(value)
    ? value.find(item => String(item || '').trim())
    : value;
  return String(raw || '').trim().toUpperCase();
}

export function normalizeXunleiSubtitleRate(value: unknown): number | string | undefined {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '0') return undefined;
  return raw;
}

export function normalizeXunleiSubtitleSource(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '0') return '';
  return raw.replace(/[（）()]/g, '').trim();
}

export function normalizeXunleiSubtitleHash(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/[^a-f0-9]/gi, '').toUpperCase();
  return raw ? raw.slice(0, 8) : '';
}

export function formatXunleiSubtitleDuration(value: unknown): string {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return '';

  const totalSeconds = Math.floor(raw > 100000 ? raw / 1000 : raw);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(item => String(item).padStart(2, '0'))
    .join(':');
}
