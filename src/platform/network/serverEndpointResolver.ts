/**
 * @file serverEndpointResolver.ts
 * @description 服务端入口解析、bootstrap 容灾与 last known good 缓存
 * @module platform/network
 */

export const DEFAULT_SERVER_API_BASE_URL = 'https://jbd-server.we-together.club';
export const PRIMARY_BOOTSTRAP_URL = `${DEFAULT_SERVER_API_BASE_URL}/v1/bootstrap`;
export const GITHUB_BOOTSTRAP_URL = 'https://raw.githubusercontent.com/Adsryen/JavdBviewed/main/public/bootstrap.json';
export const SERVER_ENDPOINT_STATE_KEY = 'server_endpoint_state';

type BootstrapEndpointStatus = 'active' | 'degraded' | 'disabled' | string;

export type BootstrapApiBaseUrl = {
  url: string;
  priority: number;
  status: BootstrapEndpointStatus;
};

export type ServerBootstrapDocument = {
  schemaVersion: 1;
  updatedAt: string;
  ttlSeconds: number;
  apiBaseUrls: BootstrapApiBaseUrl[];
  configPath: string;
  telemetryPath: string;
  checksum?: string;
};

export type ServerEndpointState = {
  apiBaseUrl: string;
  source: string;
  updatedAt: number;
  expiresAt: number;
  checksum?: string;
  failureCount?: number;
  nextRetryAt?: number;
};

export type RefreshServerEndpointOptions = {
  force?: boolean;
};

type BuildQuery = Record<string, string | number | boolean | undefined>;

const DEFAULT_TTL_SECONDS = 60 * 60;
const MIN_RETRY_BACKOFF_MS = 60 * 1000;
const MAX_RETRY_BACKOFF_MS = 60 * 60 * 1000;

export async function buildServerApiUrl(path: string, query?: BuildQuery): Promise<string> {
  const endpoint = await resolveServerEndpoint();
  const url = new URL(normalizePath(path), endpoint.apiBaseUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function buildTelemetryReportUrl(): Promise<string> {
  return buildServerApiUrl('/v1/telemetry/report');
}

export async function resolveServerEndpoint(): Promise<ServerEndpointState> {
  const current = await readEndpointState();
  if (isFreshEndpointState(current) || isRetryBackoffActive(current)) {
    return current;
  }

  return refreshServerEndpoint();
}

export async function refreshServerEndpoint(options: RefreshServerEndpointOptions = {}): Promise<ServerEndpointState> {
  const current = await readEndpointState();
  if (!options.force && (isFreshEndpointState(current) || isRetryBackoffActive(current))) {
    return current;
  }

  for (const source of [PRIMARY_BOOTSTRAP_URL, GITHUB_BOOTSTRAP_URL]) {
    const document = await fetchBootstrapDocument(source);
    if (!document) continue;

    const apiBaseUrl = selectApiBaseUrl(document);
    if (!apiBaseUrl) continue;

    const now = Date.now();
    const state: ServerEndpointState = {
      apiBaseUrl,
      source,
      updatedAt: now,
      expiresAt: now + Math.max(60, document.ttlSeconds || DEFAULT_TTL_SECONDS) * 1000,
      checksum: document.checksum,
    };
    await writeEndpointState(state);
    return state;
  }

  if (current?.apiBaseUrl) {
    const failedState = buildFailedEndpointState(current);
    await writeEndpointState(failedState);
    return failedState;
  }

  return {
    apiBaseUrl: DEFAULT_SERVER_API_BASE_URL,
    source: 'default',
    updatedAt: 0,
    expiresAt: 0,
  };
}

export async function verifyJsonChecksum(value: unknown, checksum: unknown): Promise<boolean> {
  if (typeof checksum !== 'string' || !/^[a-f0-9]{64}$/i.test(checksum)) {
    return false;
  }
  const actual = await sha256Hex(stableStringifyWithoutChecksum(value));
  return actual === checksum.toLowerCase();
}

export function stableStringifyWithoutChecksum(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringifyWithoutChecksum).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'checksum')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nextValue]) => `${JSON.stringify(key)}:${stableStringifyWithoutChecksum(nextValue)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function fetchBootstrapDocument(source: string): Promise<ServerBootstrapDocument | null> {
  try {
    const response = await fetch(source, {
      cache: 'no-cache',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;

    const text = await response.text();
    const parsed = JSON.parse(text) as unknown;
    if (!isBootstrapDocument(parsed)) return null;

    if (parsed.checksum && !await verifyJsonChecksum(parsed, parsed.checksum)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[ServerEndpointResolver] bootstrap 获取失败:', error);
    return null;
  }
}

function selectApiBaseUrl(document: ServerBootstrapDocument): string | null {
  const [selected] = document.apiBaseUrls
    .filter(item => item.status !== 'disabled' && isHttpUrl(item.url))
    .sort((left, right) => left.priority - right.priority);

  return selected?.url ? normalizeBaseUrl(selected.url) : null;
}

function isBootstrapDocument(value: unknown): value is ServerBootstrapDocument {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ServerBootstrapDocument>;
  return record.schemaVersion === 1
    && typeof record.updatedAt === 'string'
    && typeof record.ttlSeconds === 'number'
    && Array.isArray(record.apiBaseUrls)
    && record.apiBaseUrls.every(isBootstrapApiBaseUrl)
    && typeof record.configPath === 'string'
    && typeof record.telemetryPath === 'string';
}

function isBootstrapApiBaseUrl(value: unknown): value is BootstrapApiBaseUrl {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<BootstrapApiBaseUrl>;
  return typeof record.url === 'string'
    && typeof record.priority === 'number'
    && typeof record.status === 'string';
}

function isFreshEndpointState(value: ServerEndpointState | null): value is ServerEndpointState {
  return Boolean(value?.apiBaseUrl && value.expiresAt > Date.now());
}

function isRetryBackoffActive(value: ServerEndpointState | null): value is ServerEndpointState {
  return Boolean(value?.apiBaseUrl && typeof value.nextRetryAt === 'number' && value.nextRetryAt > Date.now());
}

function buildFailedEndpointState(current: ServerEndpointState): ServerEndpointState {
  const failureCount = Math.max(0, current.failureCount ?? 0) + 1;
  return {
    ...current,
    failureCount,
    nextRetryAt: Date.now() + calculateRetryBackoffMs(failureCount),
  };
}

function calculateRetryBackoffMs(failureCount: number): number {
  const exponent = Math.min(Math.max(failureCount - 1, 0), 6);
  return Math.min(MAX_RETRY_BACKOFF_MS, MIN_RETRY_BACKOFF_MS * 2 ** exponent);
}

async function readEndpointState(): Promise<ServerEndpointState | null> {
  const result = await chrome.storage.local.get(SERVER_ENDPOINT_STATE_KEY);
  const value = result[SERVER_ENDPOINT_STATE_KEY] as Partial<ServerEndpointState> | undefined;
  if (!value || typeof value.apiBaseUrl !== 'string') return null;
  if (!isHttpUrl(value.apiBaseUrl)) return null;

  return {
    apiBaseUrl: normalizeBaseUrl(value.apiBaseUrl),
    source: typeof value.source === 'string' ? value.source : 'storage',
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
    expiresAt: typeof value.expiresAt === 'number' ? value.expiresAt : 0,
    checksum: typeof value.checksum === 'string' ? value.checksum : undefined,
    failureCount: typeof value.failureCount === 'number' && Number.isFinite(value.failureCount)
      ? Math.max(0, Math.floor(value.failureCount))
      : undefined,
    nextRetryAt: typeof value.nextRetryAt === 'number' && Number.isFinite(value.nextRetryAt)
      ? value.nextRetryAt
      : undefined,
  };
}

async function writeEndpointState(state: ServerEndpointState): Promise<void> {
  await chrome.storage.local.set({ [SERVER_ENDPOINT_STATE_KEY]: state });
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
