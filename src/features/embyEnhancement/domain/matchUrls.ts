export interface EmbyMatchUrlConfig {
  matchUrls?: unknown;
  mediaServers?: unknown;
}

interface EmbyMediaServerLike {
  url?: unknown;
  enabled?: unknown;
}

export function normalizeEmbyServerMatchUrl(rawUrl: unknown): string | null {
  const value = String(rawUrl || '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const path = url.pathname.replace(/\/+$/, '');
    const base = path && path !== '/' ? `${url.origin}${path}` : url.origin;
    return `${base}/*`;
  } catch {
    return null;
  }
}

export function getEffectiveEmbyMatchUrls(config: EmbyMatchUrlConfig | null | undefined): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (url: string | null): void => {
    const value = String(url || '').trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    urls.push(value);
  };

  if (Array.isArray(config?.mediaServers)) {
    config.mediaServers.forEach((server: EmbyMediaServerLike) => {
      if (!server || server.enabled === false) return;
      add(normalizeEmbyServerMatchUrl(server.url));
    });
  }

  if (Array.isArray(config?.matchUrls)) {
    config.matchUrls.forEach((url) => add(String(url || '').trim()));
  }

  return urls;
}

export function matchesEmbyUrlPattern(url: unknown, pattern: unknown): boolean {
  const currentUrl = String(url || '').trim();
  const rawPattern = String(pattern || '').trim();
  if (!currentUrl || !rawPattern) return false;

  try {
    const regexStr = rawPattern
      .replace(/\*/g, '\x00')
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\x00/g, '.*');
    return new RegExp(`^${regexStr}`).test(currentUrl);
  } catch {
    return false;
  }
}
