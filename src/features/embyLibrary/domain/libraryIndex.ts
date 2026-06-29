/**
 * @file libraryIndex.ts
 * @description libraryIndex
 * @module features/embyLibrary
 */
import type {
  EmbyLibraryIndex,
  EmbyLibraryIndexEntry,
  EmbyMediaItem,
  EmbyMediaServer,
} from '../types';

const CODE_PATTERNS = [
  /FC2[-_\s]?PPV[-_\s]?(\d{3,})/i,
  /([A-Z]{2,12})[-_](\d{2,10})/i,
  /\b([A-Z]{2,10})(\d{3,6})\b/i,
  /\b(\d{4,8})[_-](\d{1,3})\b/i,
];

const GENERIC_FIRST_WORDS = new Set(['THE', 'THIS', 'WHAT', 'WITH', 'MOVIE', 'VIDEO', 'SAMPLE']);

export function normalizeServerUrl(url: string): string {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function normalizeVideoCode(value: string): string | null {
  const text = String(value || '').trim();
  if (!text) return null;

  for (const pattern of CODE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    if (/FC2/i.test(match[0])) {
      return `FC2-PPV-${match[1]}`.toUpperCase();
    }
    if (match.length >= 3) {
      return `${match[1]}-${match[2]}`.toUpperCase();
    }
    return match[1].toUpperCase();
  }

  const firstWord = text.match(/^([a-z0-9][a-z0-9_-]{2,24})/i)?.[1];
  if (
    firstWord
    && /\d/.test(firstWord)
    && !GENERIC_FIRST_WORDS.has(firstWord.toUpperCase())
  ) {
    return firstWord.replace(/_/g, '-').toUpperCase();
  }

  return null;
}

export function extractCodeFromMediaItem(item: EmbyMediaItem): string | null {
  return normalizeVideoCode(item.Name || '') || normalizeVideoCode(item.Path || '');
}

export function buildLibraryIndex(
  server: EmbyMediaServer,
  items: EmbyMediaItem[],
  now = Date.now(),
): EmbyLibraryIndex {
  const entries: Record<string, EmbyLibraryIndexEntry[]> = {};
  const serverUrl = normalizeServerUrl(server.url);

  for (const item of items) {
    const itemId = String(item.Id || '').trim();
    if (!itemId) continue;

    const code = extractCodeFromMediaItem(item);
    if (!code) continue;

    const entry: EmbyLibraryIndexEntry = {
      serverType: server.type || 'emby',
      serverName: server.name || (server.type === 'jellyfin' ? 'Jellyfin' : 'Emby'),
      serverUrl,
      itemId,
      serverId: item.ServerId ? String(item.ServerId) : undefined,
      itemName: String(item.Name || code),
      path: item.Path,
      updatedAt: now,
    };

    entries[code] = entries[code] || [];
    entries[code].push(entry);
  }

  return { entries, updatedAt: now };
}

export function mergeLibraryIndexes(indexes: EmbyLibraryIndex[], now = Date.now()): EmbyLibraryIndex {
  const entries: Record<string, EmbyLibraryIndexEntry[]> = {};

  for (const index of indexes) {
    for (const [code, matches] of Object.entries(index.entries || {})) {
      entries[code] = entries[code] || [];
      entries[code].push(...matches);
    }
  }

  for (const code of Object.keys(entries)) {
    entries[code].sort((a, b) => {
      const typeOrder = a.serverType.localeCompare(b.serverType);
      if (typeOrder !== 0) return typeOrder;
      return a.serverName.localeCompare(b.serverName);
    });
  }

  return { entries, updatedAt: now };
}

export function findLibraryMatches(index: EmbyLibraryIndex | null | undefined, videoCode: string): EmbyLibraryIndexEntry[] {
  const code = normalizeVideoCode(videoCode);
  if (!code || !index?.entries) return [];
  return [...(index.entries[code] || [])];
}

export function buildMediaItemUrl(
  entry: Pick<EmbyLibraryIndexEntry, 'serverUrl' | 'itemId' | 'serverType'> & Partial<Pick<EmbyLibraryIndexEntry, 'serverId'>>,
): string {
  const route = entry.serverType === 'jellyfin' ? 'details' : 'item';
  const serverIdParam = entry.serverId ? `&serverId=${encodeURIComponent(entry.serverId)}` : '';
  return `${normalizeServerUrl(entry.serverUrl)}/web/index.html#!/${route}?id=${encodeURIComponent(entry.itemId)}${serverIdParam}`;
}
