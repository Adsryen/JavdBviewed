import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TELEMETRY_CLIENT_STATE_KEY } from '../../src/features/telemetry';
import { STORAGE_KEYS } from '../../src/utils/config';

const root = process.cwd();

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function collectSwitchCases(source: string): string[] {
  return Array.from(source.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)).map(match => match[1]);
}

function collectExportedFunctions(source: string): string[] {
  return Array.from(source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)).map(match => match[1]);
}

describe('WebDAV backup and restore baseline', () => {
  afterEach(() => {
    vi.doUnmock('../../src/platform/storage/indexedDb');
    vi.resetModules();
  });

  it('locks current WebDAV router message contract and sync export contract', () => {
    expect(collectSwitchCases(readSource('src/features/webdavSync/background/router.ts'))).toEqual([
      'webdav-list-files',
      'WEB_DAV:RESTORE_PREVIEW',
      'WEB_DAV:RESTORE_UNIFIED',
      'webdav-restore',
      'webdav-test',
      'webdav-test-temp',
      'webdav-diagnose',
      'webdav-upload',
      'webdav-get-client-profile',
      'webdav-list-clients',
      'webdav-update-device-label',
      'webdav-update-client-device-label',
      'get-next-sync-time',
      'collect-backup-data',
      'webdav-download-file',
      'restore-from-json',
    ]);

    expect(collectExportedFunctions(readSource('src/background/sync.ts'))).toEqual([
      'refreshRecordById',
    ]);
  });

  it('routes the legacy webdav-restore message through unified restore', async () => {
    const { registerWebDAVRouterListener } = await import('../../src/features/webdavSync/background/router');
    const performRestoreUnified = vi.fn().mockResolvedValue({ success: true, summary: { restored: true } });

    registerWebDAVRouterListener({
      listFiles: vi.fn(),
      previewBackup: vi.fn(),
      performRestoreUnified,
      testWebDAVConnection: vi.fn(),
      testWebDAVConnectionWithConfig: vi.fn(),
      diagnoseWebDAVConnection: vi.fn(),
      performUpload: vi.fn(),
      getCurrentWebDAVClientProfile: vi.fn(),
      listWebDAVClients: vi.fn(),
      updateCurrentWebDAVDeviceLabel: vi.fn(),
      updateWebDAVClientDeviceLabel: vi.fn(),
      collectBackupData: vi.fn(),
      downloadBackupFileAsBase64: vi.fn(),
      applyImportDataDirect: vi.fn(),
    });

    const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls.at(-1)?.[0];
    expect(listener).toBeTypeOf('function');

    const response = await new Promise<any>((resolve) => {
      const asyncResult = listener!(
        {
          type: 'webdav-restore',
          filename: '/backup.zip',
          options: {
            restoreSettings: false,
            restoreRecords: true,
            restoreUserProfile: true,
            restoreActorRecords: false,
            restoreLogs: true,
            restoreMagnetPushLogs: true,
            restoreImportStats: false,
            restoreNewWorks: true,
          },
        },
        {} as chrome.runtime.MessageSender,
        resolve,
      );
      expect(asyncResult).toBe(true);
    });

    expect(response).toEqual({ success: true, summary: { restored: true } });
    expect(performRestoreUnified).toHaveBeenCalledWith('/backup.zip', {
      categories: {
        settings: false,
        viewed: true,
        userProfile: true,
        actors: false,
        logs: true,
        magnetPushLogs: true,
        importStats: false,
        newWorks: true,
      },
      autoBackupBeforeRestore: true,
    });
  });

  it('restores viewed records through the IndexedDB viewed facade', async () => {
    vi.resetModules();
    const viewedReplaceAll = vi.fn().mockResolvedValue(1);
    const fakeStore = {
      clear: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const fakeTx = {
      objectStore: vi.fn(() => fakeStore),
      complete: Promise.resolve(),
    };
    const initDB = vi.fn().mockResolvedValue({
      transaction: vi.fn(() => fakeTx),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        viewedReplaceAll,
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');
    const record = {
      id: 'ZEAA-087',
      title: 'ZEAA-087',
      status: 'browsed',
      tags: ['熟女'],
      listIds: ['list-1'],
      updatedAt: 1756311543641,
    };

    await applyImportDataDirect(
      { data: { [record.id]: record } },
      {
        categories: {
          settings: false,
          userProfile: false,
          viewed: true,
          actors: false,
          newWorks: false,
          magnets: false,
          logs: false,
          magnetPushLogs: false,
          importStats: false,
        },
      },
    );

    expect(viewedReplaceAll).toHaveBeenCalledWith([record]);
  });

  it('clears viewed records from chrome storage and IndexedDB', async () => {
    const setValue = vi.fn().mockResolvedValue(undefined);
    const viewedReplaceAll = vi.fn().mockResolvedValue(0);
    const sendResponse = vi.fn();

    const { handleClearAllRecords } = await import('../../src/apps/background/clearRecordsHandler');
    await handleClearAllRecords(sendResponse, { setValue, viewedReplaceAll });

    expect(sendResponse).toHaveBeenCalledWith({ success: true });
    expect(setValue).toHaveBeenCalledWith(STORAGE_KEYS.VIEWED_RECORDS, {});
    expect(viewedReplaceAll).toHaveBeenCalledWith([]);
  });

  it('normalizes WebDAV URLs, upload ids, and device labels', async () => {
    const {
      buildUploadId,
      joinWebDavUrl,
      normalizeWebDavBaseUrl,
      sanitizeDeviceLabel,
    } = await import('../../src/background/webdav');

    expect(normalizeWebDavBaseUrl(' https://alist.example.com/dav/backups ')).toBe('https://alist.example.com/dav/backups/');
    expect(joinWebDavUrl('https://alist.example.com/dav/backups/', '/javdb-extension-backup.zip')).toBe('https://alist.example.com/dav/backups/javdb-extension-backup.zip');
    expect(joinWebDavUrl('https://alist.example.com/dav/backups', 'clients/device.json')).toBe('https://alist.example.com/dav/backups/clients/device.json');
    expect(buildUploadId('abcdef1234567890', '2026-05-27T07:22:55.524Z')).toBe('20260527_072255524Z_abcdef12');
    expect(sanitizeDeviceLabel('  Work Laptop  ')).toBe('Work Laptop');
  }, 10000);

  it('parses PROPFIND XML and keeps only user backup files', async () => {
    const { isUserBackupFile, parseWebDAVResponse } = await import('../../src/background/webdav');
    const xml = `<?xml version="1.0"?>
      <d:multistatus xmlns:d="DAV:">
        <d:response>
          <d:href>/dav/backups/javdb-extension-backup-2026-05-27-07-22-55.zip</d:href>
          <d:propstat><d:prop>
            <d:getlastmodified>Wed, 27 May 2026 07:22:55 GMT</d:getlastmodified>
            <d:getcontentlength>1234</d:getcontentlength>
          </d:prop></d:propstat>
        </d:response>
        <d:response>
          <d:href>/dav/backups/upload-index.json</d:href>
          <d:propstat><d:prop><d:getcontentlength>99</d:getcontentlength></d:prop></d:propstat>
        </d:response>
        <d:response>
          <d:href>/dav/backups/clients/</d:href>
          <d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat>
        </d:response>
      </d:multistatus>`;

    const files = parseWebDAVResponse(xml);

    expect(files).toEqual([
      {
        name: 'javdb-extension-backup-2026-05-27-07-22-55.zip',
        path: '/dav/backups/javdb-extension-backup-2026-05-27-07-22-55.zip',
        lastModified: '2026-05-27T07:22:55.000Z',
        isDirectory: false,
        size: 1234,
      },
      {
        name: 'upload-index.json',
        path: '/dav/backups/upload-index.json',
        lastModified: 'N/A',
        isDirectory: false,
        size: 99,
      },
    ]);
    expect(files.filter(isUserBackupFile).map(file => file.name)).toEqual([
      'javdb-extension-backup-2026-05-27-07-22-55.zip',
    ]);
  });

  it('builds upload index updates with dedupe and retention limit', async () => {
    const { buildNextWebDAVUploadIndex } = await import('../../src/background/webdav');
    const next = buildNextWebDAVUploadIndex(
      {
        version: 1,
        updatedAt: '2026-05-25T00:00:00.000Z',
        lastUploadId: 'old',
        items: [
          { uploadId: 'dup', uploadedAt: '2026-05-25T00:00:00.000Z', clientId: 'client-a', deviceLabel: 'A', browserName: 'Chrome', type: 'full', status: 'success', file: 'old.zip' },
          { uploadId: 'keep', uploadedAt: '2026-05-24T00:00:00.000Z', clientId: 'client-b', deviceLabel: 'B', browserName: 'Edge', type: 'full', status: 'success', file: 'keep.zip' },
          { uploadId: 'drop', uploadedAt: '2026-05-23T00:00:00.000Z', clientId: 'client-c', deviceLabel: 'C', browserName: 'Chrome', type: 'full', status: 'success', file: 'drop.zip' },
        ],
      },
      { uploadId: 'dup', uploadedAt: '2026-05-27T07:22:55.524Z', clientId: 'client-a', deviceLabel: 'A', browserName: 'Chrome', type: 'full', status: 'success', file: 'new.zip' },
      2,
    );

    expect(next).toEqual({
      version: 1,
      updatedAt: '2026-05-27T07:22:55.524Z',
      lastUploadId: 'dup',
      items: [
        { uploadId: 'dup', uploadedAt: '2026-05-27T07:22:55.524Z', clientId: 'client-a', deviceLabel: 'A', browserName: 'Chrome', type: 'full', status: 'success', file: 'new.zip' },
        { uploadId: 'keep', uploadedAt: '2026-05-24T00:00:00.000Z', clientId: 'client-b', deviceLabel: 'B', browserName: 'Edge', type: 'full', status: 'success', file: 'keep.zip' },
      ],
    });
  });

  it('sanitizes imported settings and local-only storage keys', async () => {
    const {
      omitLocalOnlyStorageKeys,
      sanitizeImportedSettings,
    } = await import('../../src/background/webdav');

    expect(sanitizeImportedSettings(
      {
        theme: 'dark',
        webdav: {
          url: 'https://cloud.example.com/dav/',
          clientId: 'cloud-client',
          deviceLabel: 'Cloud Device',
          browserName: 'Cloud Browser',
          clientInstalledAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        webdav: {
          clientId: 'local-client',
          deviceLabel: 'Local Device',
          browserName: 'Chrome',
          clientInstalledAt: '2026-05-01T00:00:00.000Z',
        },
      },
    )).toEqual({
      theme: 'dark',
      webdav: {
        url: 'https://cloud.example.com/dav/',
        clientId: 'local-client',
        deviceLabel: 'Local Device',
        browserName: 'Chrome',
        clientInstalledAt: '2026-05-01T00:00:00.000Z',
      },
    });

    expect(omitLocalOnlyStorageKeys({
      settings: { theme: 'dark' },
      [TELEMETRY_CLIENT_STATE_KEY]: { installId: 'install-local-only' },
      [STORAGE_KEYS.EMBY_LIBRARY_STATE]: {
        entries: {
          'SSIS-001': [{ serverName: 'Home Jellyfin', itemId: 'movie-1' }],
        },
        updatedAt: 1760000000000,
      },
    })).toEqual({
      settings: { theme: 'dark' },
    });
  });

  it('normalizes restore collections and batches writes', async () => {
    const { chunk, toArrayFromObjMap } = await import('../../src/background/webdav');

    expect(toArrayFromObjMap({
      'SSIS-001': { id: 'SSIS-001' },
      'SSIS-002': { id: 'SSIS-002' },
    })).toEqual([
      { id: 'SSIS-001' },
      { id: 'SSIS-002' },
    ]);
    expect(toArrayFromObjMap([{ id: 'SSIS-003' }])).toEqual([{ id: 'SSIS-003' }]);
    expect(toArrayFromObjMap(null)).toEqual([]);
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('builds restore preview counts from backup stats and fallback shapes', async () => {
    const { buildBackupPreview } = await import('../../src/background/webdav');

    expect(buildBackupPreview({
      version: '2.1',
      timestamp: '2026-05-27T07:22:55.524Z',
      settings: { theme: 'dark' },
      userProfile: { username: 'alice' },
      idb: {
        viewedRecords: [{ id: 'SSIS-001' }],
        actors: [{ id: 'actor-1' }],
        newWorks: [{ id: 'work-1' }],
        magnets: [{ hash: 'abc' }],
        logs: [{ level: 'INFO' }],
      },
      importStats: { last: true },
      stats: {
        storage: { keys: 9 },
        idb: {
          viewedRecords: { count: 10 },
          actors: { count: 2 },
          newWorks: { count: 3 },
          magnets: { count: 4 },
          logs: { count: 5 },
        },
      },
    })).toMatchObject({
      version: '2.1',
      timestamp: '2026-05-27T07:22:55.524Z',
      counts: {
        viewed: 10,
        actors: 2,
        newWorks: 3,
        magnets: 4,
        logs: 5,
      },
      storageKeys: 9,
    });

    expect(buildBackupPreview({
      data: {
        'SSIS-001': { id: 'SSIS-001' },
        'SSIS-002': { id: 'SSIS-002' },
      },
      actorRecords: {
        alice: { id: 'alice' },
      },
      newWorks: {
        records: {
          'SSIS-003': { id: 'SSIS-003' },
        },
      },
    }).counts).toMatchObject({
      viewed: 2,
      actors: 1,
      newWorks: 1,
    });
  });

  it('maps WebDAV diagnostic config from settings shape', async () => {
    const { buildWebDAVDiagnosticConfig } = await import('../../src/background/webdav');

    expect(buildWebDAVDiagnosticConfig({
      enabled: true,
      url: 'https://cloud.example.com/dav/',
      username: 'alice',
      password: 'secret',
      extra: 'ignored',
    })).toEqual({
      url: 'https://cloud.example.com/dav/',
      username: 'alice',
      password: 'secret',
    });
  });
});
