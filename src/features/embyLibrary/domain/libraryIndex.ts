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
import { normalizeVideoCodeCandidate } from '../../../shared/utils/videoCodeExtractor';

const GENERIC_FIRST_WORDS = new Set(['THE', 'THIS', 'WHAT', 'WITH', 'MOVIE', 'VIDEO', 'SAMPLE']);

export function normalizeServerUrl(url: string): string {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function normalizeVideoCode(value: string): string | null {
  const text = String(value || '').trim();
  if (!text) return null;

  const extracted = normalizeVideoCodeCandidate(text);
  if (extracted) return extracted;

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

function addSearchTerm(terms: string[], canonicalCode: string, term: string): void {
  const normalizedTerm = normalizeVideoCode(term);
  if (normalizedTerm !== canonicalCode || terms.includes(term)) return;
  terms.push(term);
}

export function generateVideoCodeSearchTerms(videoCode: string): string[] {
  const canonicalCode = normalizeVideoCode(videoCode);
  if (!canonicalCode) return [];

  const terms: string[] = [];
  const fc2Match = canonicalCode.match(/^FC2-PPV-(\d+)$/);
  if (fc2Match) {
    const number = fc2Match[1];
    const upperTerms = [
      `FC2-PPV-${number}`,
      `FC2PPV${number}`,
      `FC2_PPV_${number}`,
    ];
    for (const term of upperTerms) {
      addSearchTerm(terms, canonicalCode, term);
    }
    for (const term of upperTerms) {
      addSearchTerm(terms, canonicalCode, term.toLowerCase());
    }
    return terms;
  }

  const codeMatch = canonicalCode.match(/^([A-Z0-9]+)-([A-Z0-9]+)$/);
  if (!codeMatch) {
    addSearchTerm(terms, canonicalCode, canonicalCode);
    addSearchTerm(terms, canonicalCode, canonicalCode.toLowerCase());
    return terms;
  }

  const [, prefix, suffix] = codeMatch;
  const upperTerms = [
    `${prefix}-${suffix}`,
    `${prefix}${suffix}`,
    `${prefix}_${suffix}`,
  ];
  for (const term of upperTerms) {
    addSearchTerm(terms, canonicalCode, term);
  }
  for (const term of upperTerms) {
    addSearchTerm(terms, canonicalCode, term.toLowerCase());
  }

  return terms;
}

export function buildMediaItemCoverImageUrl(
  server: Pick<EmbyMediaServer, 'url'>,
  item: Pick<EmbyMediaItem, 'Id' | 'ImageTags' | 'PrimaryImageTag'>,
): string | undefined {
  const itemId = String(item.Id || '').trim();
  const primaryImageTag = String(item.ImageTags?.Primary || item.PrimaryImageTag || '').trim();
  if (!itemId || !primaryImageTag) return undefined;

  const serverUrl = normalizeServerUrl(server.url);
  if (!serverUrl) return undefined;

  const params = new URLSearchParams({ tag: primaryImageTag });
  return `${serverUrl}/Items/${encodeURIComponent(itemId)}/Images/Primary?${params.toString()}`;
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

    const coverImageUrl = buildMediaItemCoverImageUrl(server, item);
    const entry: EmbyLibraryIndexEntry = {
      serverType: server.type || 'emby',
      serverName: server.name || (server.type === 'jellyfin' ? 'Jellyfin' : 'Emby'),
      serverUrl,
      itemId,
      serverId: item.ServerId ? String(item.ServerId) : undefined,
      itemName: String(item.Name || code),
      path: item.Path,
      ...(coverImageUrl ? { coverImageUrl } : {}),
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
