import { STORAGE_KEYS } from '../../../utils/config';
import { getSettings, getValue, setValue } from '../../../utils/storage';
import {
  buildLibraryIndex,
  extractCodeFromMediaItem,
  mergeLibraryIndexes,
  normalizeServerUrl,
  normalizeVideoCode,
} from '../domain/libraryIndex';
import type {
  EmbyLibraryIndexEntry,
  EmbyLibraryServerResult,
  EmbyLibraryState,
  EmbyMediaItem,
  EmbyMediaServer,
} from '../types';

type SendResponse = (response: any) => void;

export interface EmbyLibraryHandlerDeps {
  getSettings: () => Promise<any>;
  getState: () => Promise<EmbyLibraryState>;
  saveState: (state: EmbyLibraryState) => Promise<void>;
  fetchImpl: typeof fetch;
  now: () => number;
}

const DEFAULT_STATE: EmbyLibraryState = { entries: {}, updatedAt: 0 };
const DEFAULT_LIBRARY_REQUEST_TIMEOUT_MS = 15000;

function defaultDeps(): EmbyLibraryHandlerDeps {
  return {
    getSettings,
    getState: () => getValue<EmbyLibraryState>(STORAGE_KEYS.EMBY_LIBRARY_STATE, DEFAULT_STATE),
    saveState: (state) => setValue(STORAGE_KEYS.EMBY_LIBRARY_STATE, state),
    fetchImpl: fetch,
    now: () => Date.now(),
  };
}

function getEnabledServers(settings: any): EmbyMediaServer[] {
  const servers = settings?.emby?.mediaServers;
  if (!Array.isArray(servers)) return [];

  return servers
    .filter((server) => server && server.enabled !== false)
    .map((server) => {
      const type: EmbyMediaServer['type'] = server.type === 'jellyfin' ? 'jellyfin' : 'emby';
      return {
        id: String(server.id || `${type}:${server.url || server.name || ''}`),
        type,
        name: String(server.name || (type === 'jellyfin' ? 'Jellyfin' : 'Emby')),
        url: normalizeServerUrl(String(server.url || '')),
        apiKey: String(server.apiKey || ''),
        enabled: true,
      };
    })
    .filter((server) => server.url && server.apiKey);
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '连接失败');
  return message
    .replace(/api_key=[^&\s]+/gi, 'api_key=***')
    .replace(/api[-_\s]?key[:=]\s*[^&\s]+/gi, 'API Key=***');
}

function getServerIndexKey(server: Pick<EmbyMediaServer, 'type' | 'url'>): string {
  return `${server.type}:${normalizeServerUrl(server.url)}`;
}

function getEntryServerIndexKey(entry: Pick<EmbyLibraryIndexEntry, 'serverType' | 'serverUrl'>): string {
  return `${entry.serverType}:${normalizeServerUrl(entry.serverUrl)}`;
}

async function fetchAllMediaItems(
  server: EmbyMediaServer,
  fetchImpl: typeof fetch,
  searchTerm?: string,
): Promise<EmbyMediaItem[]> {
  const params = new URLSearchParams({
    Recursive: 'true',
    IncludeItemTypes: 'Movie',
    Fields: 'Path',
    api_key: server.apiKey,
  });
  if (searchTerm) {
    params.set('SearchTerm', searchTerm);
  }
  const url = `${normalizeServerUrl(server.url)}/Items?${params.toString()}`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), DEFAULT_LIBRARY_REQUEST_TIMEOUT_MS)
    : null;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('连接超时');
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    throw new Error('API Key 错误');
  }

  if (!response.ok) {
    throw new Error(`连接失败 (${response.status})`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('数据解析失败');
  }

  return Array.isArray(data?.Items) ? data.Items : [];
}

function removeEntriesForSuccessfulServers(
  state: EmbyLibraryState,
  successfulServerIds: Set<string>,
  servers: EmbyMediaServer[],
): Record<string, EmbyLibraryIndexEntry[]> {
  if (successfulServerIds.size === 0) return { ...(state.entries || {}) };

  const successfulServers = new Set(
    servers
      .filter((server) => successfulServerIds.has(server.id))
      .map((server) => getServerIndexKey(server)),
  );
  const next: Record<string, EmbyLibraryIndexEntry[]> = {};

  for (const [code, entries] of Object.entries(state.entries || {})) {
    const kept = entries.filter((entry) => {
      return !successfulServers.has(getEntryServerIndexKey(entry));
    });
    if (kept.length > 0) next[code] = kept;
  }

  return next;
}

export async function handleEmbyLibrarySync(
  message: any,
  sendResponse: SendResponse,
  deps: EmbyLibraryHandlerDeps = defaultDeps(),
): Promise<void> {
  try {
    const [settings, previousState] = await Promise.all([
      deps.getSettings(),
      deps.getState(),
    ]);

    const servers = getEnabledServers(settings);
    if (servers.length === 0) {
      sendResponse({ success: true, synced: 0, failed: 0 });
      return;
    }

    const now = deps.now();
    const syncIntervalMinutes = Number(settings?.emby?.syncIntervalMinutes ?? 60);
    const elapsedMs = now - Number(previousState.updatedAt || 0);
    const shouldSkip = message?.manual !== true
      && syncIntervalMinutes > 0
      && previousState.updatedAt
      && elapsedMs < syncIntervalMinutes * 60 * 1000;

    if (shouldSkip) {
      sendResponse({ success: true, synced: 0, failed: 0, skipped: true });
      return;
    }

    const indexes = [];
    const serverResults: EmbyLibraryServerResult[] = [];
    const successfulServerIds = new Set<string>();

    for (const server of servers) {
      try {
        const items = await fetchAllMediaItems(server, deps.fetchImpl);
        const index = buildLibraryIndex(server, items, now);
        indexes.push(index);
        successfulServerIds.add(server.id);
        const indexedCount = Object.values(index.entries).reduce((sum, entries) => sum + entries.length, 0);
        serverResults.push({
          serverId: server.id,
          serverType: server.type,
          serverName: server.name,
          success: true,
          itemCount: items.length,
          indexedCount,
          checkedAt: now,
        });
      } catch (error) {
        serverResults.push({
          serverId: server.id,
          serverType: server.type,
          serverName: server.name,
          success: false,
          itemCount: 0,
          indexedCount: 0,
          error: sanitizeError(error),
          checkedAt: now,
        });
      }
    }

    const keptEntries = removeEntriesForSuccessfulServers(previousState, successfulServerIds, servers);
    const nextUpdatedAt = successfulServerIds.size > 0 ? now : Number(previousState.updatedAt || 0);
    const merged = mergeLibraryIndexes([{ entries: keptEntries, updatedAt: previousState.updatedAt || 0 }, ...indexes], nextUpdatedAt);
    const nextState: EmbyLibraryState = {
      ...merged,
      updatedAt: nextUpdatedAt,
      serverResults,
    };

    await deps.saveState(nextState);

    const synced = serverResults.filter((result) => result.success).length;
    const failed = serverResults.filter((result) => !result.success).length;
    sendResponse({ success: synced > 0, synced, failed });
  } catch (error) {
    sendResponse({ success: false, error: sanitizeError(error) });
  }
}

export async function handleEmbyLibraryCheckCodes(
  message: any,
  sendResponse: SendResponse,
  deps: EmbyLibraryHandlerDeps = defaultDeps(),
): Promise<void> {
  try {
    const rawCodes: unknown[] = Array.isArray(message?.codes) ? message.codes : [];
    const normalizedCodes: string[] = rawCodes
      .map((code: unknown) => normalizeVideoCode(String(code || '')))
      .filter((code): code is string => Boolean(code));
    const codes: string[] = Array.from(new Set<string>(normalizedCodes)).slice(0, 20);
    if (codes.length === 0) {
      sendResponse({ success: true, checked: 0, matches: {} });
      return;
    }

    const [settings, previousState] = await Promise.all([
      deps.getSettings(),
      deps.getState(),
    ]);
    const servers = getEnabledServers(settings);
    if (servers.length === 0) {
      sendResponse({ success: true, checked: 0, matches: {} });
      return;
    }

    const now = deps.now();
    const nextEntries: Record<string, EmbyLibraryIndexEntry[]> = { ...(previousState.entries || {}) };
    const matches: Record<string, EmbyLibraryIndexEntry[]> = {};

    for (const code of codes) {
      const foundForCode: EmbyLibraryIndexEntry[] = [];
      for (const server of servers) {
        try {
          const items = await fetchAllMediaItems(server, deps.fetchImpl, code);
          const matchedItems = items.filter((item) => extractCodeFromMediaItem(item) === code);
          const index = buildLibraryIndex(server, matchedItems, now);
          const serverMatches = index.entries[code] || [];
          foundForCode.push(...serverMatches);

          const serverKey = getServerIndexKey(server);
          const existing = (nextEntries[code] || []).filter((entry) => {
            return getEntryServerIndexKey(entry) !== serverKey;
          });
          nextEntries[code] = [...existing, ...serverMatches];
          if (nextEntries[code].length === 0) delete nextEntries[code];
        } catch {
          // 实时校验失败保持旧状态，避免列表页闪烁。
        }
      }
      matches[code] = foundForCode;
    }

    const nextState: EmbyLibraryState = {
      ...previousState,
      entries: nextEntries,
      updatedAt: previousState.updatedAt || 0,
    };
    await deps.saveState(nextState);
    sendResponse({ success: true, checked: codes.length, matches, state: nextState });
  } catch (error) {
    sendResponse({ success: false, error: sanitizeError(error) });
  }
}
