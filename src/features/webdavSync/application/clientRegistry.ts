import { getClientFilePath, joinWebDavUrl, WEBDAV_CLIENTS_DIR } from '../domain/paths';
import type { WebDAVAuth, WebDAVClientProfile } from '../domain/types';
import { parseWebDAVResponse } from '../infrastructure/propfindParser';
import { webDavReadJsonFile, webDavWriteJsonFile } from '../infrastructure/webdavClient';
import { createUuidLike } from './clientIdentity';

export async function updateWebDAVClientRegistry(baseUrl: string, auth: WebDAVAuth, profile: WebDAVClientProfile): Promise<void> {
  const now = new Date().toISOString();
  const safeClientId = String(profile.clientId || '').trim() || createUuidLike();
  const payload: WebDAVClientProfile = {
    ...profile,
    clientId: safeClientId,
    lastSeenAt: now,
  };
  await webDavWriteJsonFile(baseUrl, auth, getClientFilePath(safeClientId), payload);
}

export async function readWebDAVClientProfile(
  baseUrl: string,
  auth: WebDAVAuth,
  clientId: string,
): Promise<WebDAVClientProfile | null> {
  return webDavReadJsonFile<WebDAVClientProfile>(baseUrl, auth, getClientFilePath(clientId));
}

export async function listWebDAVClientProfiles(
  baseUrl: string,
  auth: WebDAVAuth,
): Promise<WebDAVClientProfile[]> {
  const dirUrl = joinWebDavUrl(baseUrl, WEBDAV_CLIENTS_DIR);
  const response = await fetch(dirUrl, {
    method: 'PROPFIND',
    headers: {
      Authorization: 'Basic ' + btoa(`${auth.username}:${auth.password}`),
      Depth: '1',
      'Content-Type': 'application/xml; charset=utf-8',
    },
    body: `<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:getlastmodified/><D:getcontentlength/><D:resourcetype/></D:prop></D:propfind>`,
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`List clients failed with status: ${response.status}`);

  const xml = await response.text();
  const files = parseWebDAVResponse(xml).filter(file => !file.isDirectory && /\.json$/i.test(file.name));
  const clients = await Promise.all(files.map(async (file) => {
    try {
      return await webDavReadJsonFile<WebDAVClientProfile>(baseUrl, auth, `${WEBDAV_CLIENTS_DIR}/${file.name}`);
    } catch {
      return null;
    }
  }));

  return clients.filter((client): client is WebDAVClientProfile => !!client && !!String(client.clientId || '').trim());
}
