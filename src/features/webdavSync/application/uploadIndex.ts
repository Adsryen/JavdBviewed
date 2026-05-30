import {
  DEFAULT_UPLOAD_INDEX_LIMIT,
  WEBDAV_UPLOAD_INDEX_FILE,
  WEBDAV_UPLOAD_INDEX_VERSION,
} from '../domain/paths';
import type {
  WebDAVAuth,
  WebDAVClientProfile,
  WebDAVFile,
  WebDAVUploadIndex,
  WebDAVUploadIndexItem,
} from '../domain/types';
import { readWebDAVClientProfile } from './clientRegistry';
import { webDavReadJsonFile, webDavWriteJsonFile } from '../infrastructure/webdavClient';

function createEmptyUploadIndex(): WebDAVUploadIndex {
  return {
    version: WEBDAV_UPLOAD_INDEX_VERSION,
    updatedAt: new Date(0).toISOString(),
    lastUploadId: '',
    items: [],
  };
}

export function buildNextWebDAVUploadIndex(
  existing: WebDAVUploadIndex | null | undefined,
  item: WebDAVUploadIndexItem,
  limit: number,
): WebDAVUploadIndex {
  const index = existing && typeof existing === 'object' ? existing : createEmptyUploadIndex();
  const deduped = (index.items || []).filter(entry => entry.uploadId !== item.uploadId);
  const finalLimit = Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_UPLOAD_INDEX_LIMIT;
  const items = [item, ...deduped].slice(0, finalLimit);
  return {
    version: WEBDAV_UPLOAD_INDEX_VERSION,
    updatedAt: item.uploadedAt,
    lastUploadId: item.uploadId,
    items,
  };
}

export async function appendWebDAVUploadIndex(
  baseUrl: string,
  auth: WebDAVAuth,
  item: WebDAVUploadIndexItem,
  limit: number,
): Promise<void> {
  const existing = await webDavReadJsonFile<WebDAVUploadIndex>(baseUrl, auth, WEBDAV_UPLOAD_INDEX_FILE).catch(() => null);
  const nextIndex = buildNextWebDAVUploadIndex(existing, item, limit);
  await webDavWriteJsonFile(baseUrl, auth, WEBDAV_UPLOAD_INDEX_FILE, nextIndex);
}

export async function enrichFilesWithUploadIndex(
  baseUrl: string,
  auth: WebDAVAuth,
  files: WebDAVFile[],
): Promise<WebDAVFile[]> {
  if (!Array.isArray(files) || files.length === 0) return files;
  const index = await webDavReadJsonFile<WebDAVUploadIndex>(baseUrl, auth, WEBDAV_UPLOAD_INDEX_FILE).catch(() => null);
  const items = Array.isArray(index?.items) ? index.items : [];

  const byFile = new Map<string, WebDAVUploadIndexItem>();
  for (const item of items) {
    if (item?.file) byFile.set(String(item.file), item);
  }

  const clientIds = Array.from(new Set(
    items
      .map(item => String(item?.clientId || '').trim())
      .filter(Boolean)
  ));
  const clientProfiles = await Promise.all(
    clientIds.map(async (clientId) => {
      return readWebDAVClientProfile(baseUrl, auth, clientId)
        .then(profile => profile && String(profile.clientId || '').trim() ? profile : null)
        .catch(() => null);
    })
  );
  const clientProfileMap = new Map<string, WebDAVClientProfile>();
  for (const profile of clientProfiles) {
    const clientId = String(profile?.clientId || '').trim();
    if (clientId) clientProfileMap.set(clientId, profile as WebDAVClientProfile);
  }

  if (items.length === 0 && clientProfileMap.size === 0) return files;

  return files.map((file) => {
    const matched = byFile.get(file.name);
    if (!matched) return file;
    const latestClientProfile = clientProfileMap.get(String(matched.clientId || '').trim());
    const latestDeviceLabel = String(latestClientProfile?.deviceLabel || matched.deviceLabel || matched.clientId || '').trim();
    const latestBrowserName = String(latestClientProfile?.browserName || matched.browserName || '').trim();
    return {
      ...file,
      uploaderClientId: matched.clientId,
      uploaderDeviceLabel: latestDeviceLabel,
      uploaderBrowserName: latestBrowserName,
      uploadId: matched.uploadId,
    };
  });
}
