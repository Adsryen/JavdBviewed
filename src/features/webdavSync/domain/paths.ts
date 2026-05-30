export const WEBDAV_CLIENTS_DIR = 'clients';
export const WEBDAV_UPLOAD_INDEX_FILE = 'upload-index.json';
export const WEBDAV_UPLOAD_INDEX_VERSION = 1;
export const DEFAULT_UPLOAD_INDEX_LIMIT = 50;

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
