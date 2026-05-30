import { joinWebDavUrl, WEBDAV_CLIENTS_DIR } from '../domain/paths';
import type { WebDAVAuth } from '../domain/types';

export type WebDAVClientLog = (level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) => void;

export interface WebDAVClientOptions {
  logger?: WebDAVClientLog;
}

function buildAuthHeader(auth: WebDAVAuth): string {
  return 'Basic ' + btoa(`${auth.username}:${auth.password}`);
}

export async function webDavReadJsonFile<T>(baseUrl: string, auth: WebDAVAuth, relativePath: string): Promise<T | null> {
  const url = joinWebDavUrl(baseUrl, relativePath);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: buildAuthHeader(auth),
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Read ${relativePath} failed with status: ${response.status}`);
  return await response.json() as T;
}

export async function webDavWriteJsonFile(baseUrl: string, auth: WebDAVAuth, relativePath: string, data: any): Promise<void> {
  const url = joinWebDavUrl(baseUrl, relativePath);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: buildAuthHeader(auth),
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data, null, 2),
  });
  if (!response.ok) throw new Error(`Write ${relativePath} failed with status: ${response.status}`);
}

export async function ensureWebDAVDirectoryExists(
  dirUrl: string,
  username: string,
  password: string,
  options: WebDAVClientOptions = {},
): Promise<void> {
  const logger = options.logger;
  try {
    const checkResponse = await fetch(dirUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: buildAuthHeader({ username, password }),
        Depth: '0',
      },
    });

    if (checkResponse.ok) {
      logger?.('DEBUG', 'WebDAV directory exists', { dirUrl });
      return;
    }

    if (checkResponse.status === 404) {
      logger?.('INFO', 'WebDAV directory not found, attempting to create', { dirUrl });

      const url = new URL(dirUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      let currentPath = '';

      for (const part of pathParts) {
        currentPath += '/' + part;
        const currentUrl = `${url.origin}${currentPath}/`;
        const existsResponse = await fetch(currentUrl, {
          method: 'PROPFIND',
          headers: {
            Authorization: buildAuthHeader({ username, password }),
            Depth: '0',
          },
        });

        if (existsResponse.status === 404) {
          const mkcolResponse = await fetch(currentUrl, {
            method: 'MKCOL',
            headers: {
              Authorization: buildAuthHeader({ username, password }),
            },
          });

          if (mkcolResponse.ok || mkcolResponse.status === 201) {
            logger?.('INFO', 'Created WebDAV directory', { path: currentUrl });
          } else if (mkcolResponse.status === 405) {
            logger?.('DEBUG', 'Directory might already exist (405)', { path: currentUrl });
          } else {
            logger?.('WARN', 'Failed to create directory', {
              path: currentUrl,
              status: mkcolResponse.status,
            });
          }
        }
      }

      logger?.('INFO', 'WebDAV directory structure ensured', { dirUrl });
    } else {
      logger?.('WARN', 'Unexpected response when checking directory', {
        dirUrl,
        status: checkResponse.status,
      });
    }
  } catch (error: any) {
    logger?.('ERROR', 'Failed to ensure WebDAV directory exists', {
      dirUrl,
      error: error.message,
    });
    throw error;
  }
}

export async function ensureWebDAVSupportDirs(
  baseUrl: string,
  username: string,
  password: string,
  options: WebDAVClientOptions = {},
): Promise<void> {
  await ensureWebDAVDirectoryExists(baseUrl, username, password, options);
  await ensureWebDAVDirectoryExists(joinWebDavUrl(baseUrl, WEBDAV_CLIENTS_DIR), username, password, options);
}
