import { normalizeWebDavBaseUrl } from '../domain/paths';
import type { WebDAVClientLog, WebDAVClientOptions } from '../infrastructure/webdavClient';
import type { WebDAVFile } from '../domain/types';
import { isUserBackupFile, parseWebDAVResponse } from '../infrastructure/propfindParser';
import { enrichFilesWithUploadIndex } from './uploadIndex';

export interface WebDAVSettingsProvider {
  getSettings: () => Promise<any>;
}

export interface WebDAVCleanupOptions extends WebDAVClientOptions, WebDAVSettingsProvider {
  logger?: WebDAVClientLog;
}

export async function listWebDAVFiles(options: WebDAVCleanupOptions): Promise<{ success: boolean; error?: string; files?: WebDAVFile[] }> {
  const logger = options.logger;
  logger?.('INFO', 'Attempting to list files from WebDAV.');
  const settings = await options.getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) {
    const errorMsg = 'WebDAV is not enabled or URL is not configured.';
    logger?.('WARN', errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const url = normalizeWebDavBaseUrl(settings.webdav.url);
    const auth = { username: settings.webdav.username, password: settings.webdav.password };
    logger?.('INFO', `Sending PROPFIND request to: ${url}`);
    const headers: Record<string, string> = {
      Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
      Depth: '1',
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'JavDB-Extension/1.0',
    };
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>\n<D:propfind xmlns:D="DAV:">\n    <D:allprop/>\n</D:propfind>`;
    const response = await fetch(url, { method: 'PROPFIND', headers, body: xmlBody });
    logger?.('INFO', `WebDAV response status: ${response.status} ${response.statusText}`);
    const headersObj: Record<string, string> = {};
    try { response.headers.forEach((value, key) => { headersObj[key] = value; }); } catch {}
    logger?.('DEBUG', 'WebDAV response headers:', headersObj);
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 401) errorDetail += ' - 认证失败，请检查用户名和密码';
      else if (response.status === 403) errorDetail += ' - 访问被拒绝，请检查权限设置';
      else if (response.status === 404) errorDetail += ' - 路径不存在，请检查WebDAV URL';
      else if (response.status === 405) errorDetail += ' - 服务器不支持PROPFIND方法';
      else if (response.status >= 500) errorDetail += ' - 服务器内部错误';
      throw new Error(errorDetail);
    }
    const text = await response.text();
    logger?.('DEBUG', 'Received WebDAV PROPFIND response:', {
      responseLength: text.length,
      responsePreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    });
    if (!text || text.trim().length === 0) throw new Error('服务器返回空响应');

    const files = (await enrichFilesWithUploadIndex(url, auth, parseWebDAVResponse(text))).filter(isUserBackupFile);
    logger?.('INFO', `Successfully parsed ${files.length} files from WebDAV response`);
    logger?.('DEBUG', 'Parsed WebDAV files:', { files });
    if (files.length === 0) logger?.('WARN', 'No backup files found in WebDAV response. This might be normal if no backups exist yet.');

    return { success: true, files };
  } catch (error: any) {
    const latestSettings = await options.getSettings();
    logger?.('ERROR', 'Failed to list WebDAV files.', {
      error: error.message,
      url: latestSettings.webdav.url,
      username: latestSettings.webdav.username ? '[CONFIGURED]' : '[NOT SET]',
    });
    return { success: false, error: error.message };
  }
}

export async function cleanupOldBackups(retentionCount: number, options: WebDAVCleanupOptions): Promise<void> {
  const logger = options.logger;
  const settings = await options.getSettings();
  if (!settings.webdav.enabled || !settings.webdav.url) return;
  try {
    logger?.('INFO', 'cleanupOldBackups started (per-device)', { retentionCount });
    const result = await listWebDAVFiles(options);
    if (!result.success || !result.files || result.files.length === 0) {
      logger?.('WARN', 'cleanupOldBackups: listFiles returned no files', { success: result.success, fileCount: result.files?.length });
      return;
    }
    const allBackupFiles = result.files
      .filter((f) => f.name.includes('javdb-extension-backup-') && (f.name.endsWith('.json') || f.name.endsWith('.zip')));

    logger?.('INFO', 'cleanupOldBackups: total backup files found', { total: allBackupFiles.length });

    if (retentionCount <= 0) {
      logger?.('INFO', 'cleanupOldBackups: retention disabled (retentionCount <= 0)');
      return;
    }

    // 按设备分组
    const filesByDevice = new Map<string, WebDAVFile[]>();
    for (const file of allBackupFiles) {
      const deviceKey = file.uploaderClientId || 'unknown';
      if (!filesByDevice.has(deviceKey)) {
        filesByDevice.set(deviceKey, []);
      }
      filesByDevice.get(deviceKey)!.push(file);
    }

    logger?.('INFO', 'cleanupOldBackups: grouped by device', {
      deviceCount: filesByDevice.size,
      devices: Array.from(filesByDevice.entries()).map(([device, files]) => ({
        device,
        fileCount: files.length,
        deviceLabel: files[0]?.uploaderDeviceLabel || 'unknown',
      })),
    });

    // 每个设备分别清理
    const filesToDelete: WebDAVFile[] = [];
    for (const [deviceKey, deviceFiles] of filesByDevice.entries()) {
      // 按文件名排序（文件名包含时间戳，新的在前）
      const sortedFiles = deviceFiles.sort((a, b) => (a.name > b.name ? -1 : 1));

      if (sortedFiles.length > retentionCount) {
        const toDeleteFromDevice = sortedFiles.slice(retentionCount);
        filesToDelete.push(...toDeleteFromDevice);

        logger?.('INFO', 'cleanupOldBackups: device cleanup plan', {
          device: deviceKey,
          deviceLabel: sortedFiles[0]?.uploaderDeviceLabel || 'unknown',
          totalFiles: sortedFiles.length,
          toKeep: retentionCount,
          toDelete: toDeleteFromDevice.length,
          deleteNames: toDeleteFromDevice.map(f => f.name),
        });
      } else {
        logger?.('INFO', 'cleanupOldBackups: device needs no cleanup', {
          device: deviceKey,
          deviceLabel: sortedFiles[0]?.uploaderDeviceLabel || 'unknown',
          fileCount: sortedFiles.length,
          retentionCount,
        });
      }
    }

    if (filesToDelete.length === 0) {
      logger?.('INFO', 'cleanupOldBackups: no files to delete across all devices');
      return;
    }

    logger?.('INFO', 'cleanupOldBackups: starting deletion', {
      totalToDelete: filesToDelete.length,
      fileNames: filesToDelete.map(f => f.name),
    });

    // 执行删除
    for (const file of filesToDelete) {
      try {
        let fileUrl: string;
        if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
          fileUrl = file.path;
        } else {
          const origin = new URL(settings.webdav.url).origin;
          fileUrl = origin + (file.path.startsWith('/') ? file.path : '/' + file.path);
        }
        logger?.('INFO', 'cleanupOldBackups: deleting file', {
          name: file.name,
          device: file.uploaderClientId || 'unknown',
          deviceLabel: file.uploaderDeviceLabel || 'unknown',
          url: fileUrl,
        });
        const deleteResp = await fetch(fileUrl, {
          method: 'DELETE',
          headers: { Authorization: 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`), 'User-Agent': 'JavDB-Extension/1.0' },
        });
        if (deleteResp.ok || deleteResp.status === 204 || deleteResp.status === 404) {
          logger?.('INFO', 'Deleted old WebDAV backup', { name: file.name, url: fileUrl, status: deleteResp.status });
        } else {
          logger?.('WARN', 'DELETE request failed', { name: file.name, url: fileUrl, status: deleteResp.status });
        }
      } catch (e: any) {
        logger?.('WARN', 'Failed to delete old WebDAV backup', { name: file.name, error: e?.message });
      }
    }

    logger?.('INFO', 'cleanupOldBackups completed', {
      totalDeleted: filesToDelete.length,
      devicesProcessed: filesByDevice.size,
    });
  } catch (e: any) {
    logger?.('WARN', 'cleanupOldBackups encountered an error', { error: e?.message });
  }
}
