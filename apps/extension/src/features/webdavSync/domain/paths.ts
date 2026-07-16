/**
 * @file paths.ts
 * @description paths
 * @module features/webdavSync
 */
export const WEBDAV_CLIENTS_DIR = 'clients';
export const WEBDAV_UPLOAD_INDEX_FILE = 'upload-index.json';
export const WEBDAV_UPLOAD_INDEX_VERSION = 1;
export const DEFAULT_UPLOAD_INDEX_LIMIT = 50;

export interface AlistWebDavUrlHint {
  kind: 'alist-dav-path';
  suggestedUrl: string;
  message: string;
}

export function normalizeWebDavBaseUrl(url: string): string {
  let finalUrl = String(url || '').trim();
  if (finalUrl && !finalUrl.endsWith('/')) finalUrl += '/';
  return finalUrl;
}

export function joinWebDavUrl(baseUrl: string, relativePath: string): string {
  const normalizedBase = normalizeWebDavBaseUrl(baseUrl);
  return normalizedBase + relativePath.replace(/^\/+/, '');
}

export function buildUploadId(clientId: string, uploadedAt: string): string {
  const compactTime = uploadedAt.replace(/[-:.]/g, '').replace('T', '_').replace('Z', 'Z');
  const safeClientId = String(clientId || '').trim() || 'anonymous';
  return `${compactTime}_${safeClientId.slice(0, 8)}`;
}

export function getClientFilePath(clientId: string, fallbackClientId = 'client'): string {
  const safeClientId = String(clientId || fallbackClientId).trim() || fallbackClientId;
  return `${WEBDAV_CLIENTS_DIR}/${safeClientId}.json`;
}

export function getAlistWebDavUrlHint(url: string): AlistWebDavUrlHint | null {
  const rawUrl = String(url || '').trim();
  if (!rawUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'dav.jianguoyun.com' || hostname === 'ogi.teracloud.jp') {
    return null;
  }

  const pathSegments = parsed.pathname.split('/').filter(Boolean).map((segment) => segment.toLowerCase());
  if (pathSegments.includes('dav')) {
    if (parsed.pathname === '/dav') {
      parsed.pathname = '/dav/';
      parsed.search = '';
      parsed.hash = '';
      return {
        kind: 'alist-dav-path',
        suggestedUrl: parsed.toString(),
        message: '如果这是 Alist 服务，WebDAV 地址通常需要以 /dav/ 结尾。',
      };
    }
    return null;
  }

  if (pathSegments[0] === 'webdav') {
    const tail = pathSegments.length > 1
      ? `/${parsed.pathname.split('/').filter(Boolean).slice(1).join('/')}`
      : '/';
    parsed.pathname = `/dav${tail}`;
  } else {
    const currentPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    parsed.pathname = currentPath ? `/dav/${currentPath}` : '/dav/';
  }
  parsed.search = '';
  parsed.hash = '';

  return {
    kind: 'alist-dav-path',
    suggestedUrl: parsed.toString(),
    message: '如果这是 Alist 服务，WebDAV 地址通常需要以 /dav/ 结尾。',
  };
}
