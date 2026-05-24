export type PreviewSourceType = 'video/mp4' | 'application/vnd.apple.mpegurl';
export type PreviewSourceName = 'cache' | 'legacy' | 'test' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl';

export interface PreviewCacheEntry {
  url: string;
  type: PreviewSourceType;
  source: PreviewSourceName;
  verifiedAt: number;
  failures: number;
}

const HLS_PREVIEW_CACHE_TTL_MS = 30 * 60 * 1000;
const MP4_PREVIEW_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizePreviewUrl(url: string): string {
  return url.replace(/&amp;/g, '&');
}

export function isHlsPreviewUrl(url: string): boolean {
  const normalizedUrl = normalizePreviewUrl(url).toLowerCase();
  return /\.m3u8(?:[?#].*)?$/.test(normalizedUrl);
}

export function getPreviewSourceType(url: string): PreviewSourceType {
  return isHlsPreviewUrl(url) ? 'application/vnd.apple.mpegurl' : 'video/mp4';
}

export function createPreviewCacheEntry(url: string, source: PreviewSourceName, now = Date.now()): PreviewCacheEntry {
  const normalizedUrl = normalizePreviewUrl(url);
  return {
    url: normalizedUrl,
    type: getPreviewSourceType(normalizedUrl),
    source,
    verifiedAt: now,
    failures: 0,
  };
}

export function parsePreviewCacheEntry(rawValue: string | null, now = Date.now()): PreviewCacheEntry | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PreviewCacheEntry>;
    if (parsed && typeof parsed.url === 'string') {
      const entry = createPreviewCacheEntry(
        parsed.url,
        isPreviewSourceName(parsed.source) ? parsed.source : 'cache',
        typeof parsed.verifiedAt === 'number' ? parsed.verifiedAt : 0,
      );
      entry.failures = typeof parsed.failures === 'number' ? parsed.failures : 0;
      return isPreviewCacheEntryFresh(entry, now) ? entry : null;
    }
  } catch {}

  const legacyUrl = normalizePreviewUrl(rawValue);
  if (isHlsPreviewUrl(legacyUrl)) {
    return null;
  }

  return createPreviewCacheEntry(legacyUrl, 'legacy', now);
}

export function serializePreviewCacheEntry(entry: PreviewCacheEntry): string {
  return JSON.stringify(entry);
}

function isPreviewCacheEntryFresh(entry: PreviewCacheEntry, now: number): boolean {
  const ttl = entry.type === 'application/vnd.apple.mpegurl'
    ? HLS_PREVIEW_CACHE_TTL_MS
    : MP4_PREVIEW_CACHE_TTL_MS;
  return entry.verifiedAt > 0 && now - entry.verifiedAt <= ttl;
}

function isPreviewSourceName(value: unknown): value is PreviewSourceName {
  return value === 'cache' ||
    value === 'legacy' ||
    value === 'test' ||
    value === 'javdb' ||
    value === 'javspyl' ||
    value === 'avpreview' ||
    value === 'vbgfl';
}

export function isVbgflPondoCode(code: string): boolean {
  return /^\d{6}_\d{3}$/i.test(code.replace('-', '_'));
}

export function isVbgflMusumeCode(code: string): boolean {
  return /^\d{6}_\d{2}$/i.test(code.replace('-', '_'));
}

export function isVbgflPacoCode(code: string): boolean {
  return false;
}

export function isKnownBadVbgflPreviewUrl(code: string, url: string): boolean {
  const normalizedCode = code.replace('-', '_').toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes('smovie.1pondo.tv') && !isVbgflPondoCode(code)) {
    return true;
  }

  if (normalizedUrl.includes('smovie.10musume.com') && !isVbgflMusumeCode(code)) {
    return true;
  }

  if (normalizedUrl.includes('pacopacomama.com') && !isVbgflPacoCode(code)) {
    return true;
  }

  return normalizedUrl.includes(normalizedCode) === false &&
    (
      normalizedUrl.includes('smovie.1pondo.tv') ||
      normalizedUrl.includes('smovie.10musume.com') ||
      normalizedUrl.includes('pacopacomama.com')
    );
}
