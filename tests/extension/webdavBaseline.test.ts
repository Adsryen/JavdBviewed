/**
 * @file webdavBaseline.test.ts
 * @description WebDAV backup and restore baseline 测试
 * @module tests/extension
 */
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
            restoreLists: true,
            categoryModes: {
              viewed: 'replace',
            },
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
        lists: true,
      },
      categoryModes: {
        viewed: 'replace',
      },
      autoBackupBeforeRestore: true,
    });
  });

  it('routes unified restore with a restore progress task id', async () => {
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
    const response = await new Promise<any>((resolve) => {
      const asyncResult = listener!(
        {
          type: 'WEB_DAV:RESTORE_UNIFIED',
          filename: '/backup.zip',
          restoreTaskId: 'restore-task-1',
          options: {
            categories: { viewed: true },
            categoryModes: { viewed: 'merge' },
          },
        },
        {} as chrome.runtime.MessageSender,
        resolve,
      );
      expect(asyncResult).toBe(true);
    });

    expect(response).toEqual({ success: true, summary: { restored: true } });
    expect(performRestoreUnified).toHaveBeenCalledWith('/backup.zip', {
      categories: { viewed: true },
      categoryModes: { viewed: 'merge' },
    }, 'restore-task-1');
  });

  it('backs up list, series, and label records from IndexedDB', async () => {
    vi.resetModules();
    const listRecords = [
      { id: 'local_1', name: '本地清单', type: 'local', source: 'local' },
      { id: 'series:abc', name: '系列 A', type: 'series', source: 'javdb' },
      { id: 'label:FC2', name: 'FC2', type: 'label', source: 'javdb' },
    ];
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn(async (storeName: string) => storeName === 'lists' ? listRecords : []),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        logsGetAll: vi.fn().mockResolvedValue([]),
        magnetPushLogsGetAll: vi.fn().mockResolvedValue([]),
      };
    });

    const { collectBackupData } = await import('../../src/features/webdavSync/application/backupCollector');

    const snapshot = await collectBackupData();

    expect(snapshot.idb.lists).toEqual(listRecords);
    expect(snapshot.stats.idb.lists.count).toBe(3);
  });

  it('restores list, series, and label records by default', async () => {
    vi.resetModules();
    const put = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn().mockResolvedValue(undefined);
    const fakeStore = { clear, put };
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
        viewedReplaceAll: vi.fn().mockResolvedValue(0),
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');
    const records = [
      { id: 'local_1', name: '本地清单', type: 'local', source: 'local' },
      { id: 'series:abc', name: '系列 A', type: 'series', source: 'javdb' },
      { id: 'label:FC2', name: 'FC2', type: 'label', source: 'javdb' },
    ];

    const result = await applyImportDataDirect({ idb: { lists: records } });

    expect(result.success).toBe(true);
    expect(initDB).toHaveBeenCalled();
    expect(fakeTx.objectStore).toHaveBeenCalledWith('lists');
    expect(put).toHaveBeenCalledTimes(3);
    expect(result.summary?.categories?.lists).toMatchObject({ cleared: true, written: 3 });
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
          lists: false,
        },
      },
    );

    expect(viewedReplaceAll).toHaveBeenCalledWith([record]);
  });

  it('reports real category progress while applying restore data', async () => {
    vi.resetModules();
    const viewedReplaceAll = vi.fn().mockResolvedValue(1);
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          clear: vi.fn().mockResolvedValue(undefined),
          put: vi.fn().mockResolvedValue(undefined),
        })),
        complete: Promise.resolve(),
      })),
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
    const progressEvents: any[] = [];

    const result = await applyImportDataDirect(
      { idb: { viewedRecords: [{ id: 'AAA-001', title: 'Cloud only' }] } },
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
          lists: false,
        },
        categoryModes: {
          viewed: 'replace',
        },
      },
      {
        onProgress: event => progressEvents.push(event),
      },
    );

    expect(result.success).toBe(true);
    expect(progressEvents).toEqual([
      expect.objectContaining({ stage: 'apply', status: 'running', message: '正在应用恢复策略...' }),
      expect.objectContaining({
        stage: 'category',
        status: 'running',
        category: 'viewed',
        categoryMode: 'replace',
        completedCategories: 0,
        totalCategories: 1,
      }),
      expect.objectContaining({
        stage: 'category',
        status: 'done',
        category: 'viewed',
        categoryMode: 'replace',
        completedCategories: 1,
        totalCategories: 1,
        summary: expect.objectContaining({ written: 1 }),
      }),
      expect.objectContaining({ stage: 'apply', status: 'done', message: '恢复数据写入完成' }),
    ]);
  });

  it('merges viewed records by id without duplicates and keeps local-only records', async () => {
    vi.resetModules();
    const existingRecords = [
      { id: 'AAA-001', title: 'Local old', status: 'browsed', tags: ['local'], updatedAt: 100 },
      { id: 'BBB-002', title: 'Local only', status: 'want', tags: ['keep'], updatedAt: 200 },
    ];
    const viewedGetAll = vi.fn().mockResolvedValue(existingRecords);
    const viewedReplaceAll = vi.fn().mockResolvedValue(3);
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          clear: vi.fn().mockResolvedValue(undefined),
          put: vi.fn().mockResolvedValue(undefined),
        })),
        complete: Promise.resolve(),
      })),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        viewedGetAll,
        viewedReplaceAll,
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');

    const result = await applyImportDataDirect(
      {
        idb: {
          viewedRecords: [
            { id: 'AAA-001', title: 'Cloud old duplicate', status: 'viewed', tags: ['cloud-old'], updatedAt: 50 },
            { id: 'AAA-001', title: 'Cloud newest', status: 'viewed', tags: ['cloud-new'], updatedAt: 300 },
            { id: 'CCC-003', title: 'Cloud only', status: 'browsed', tags: [], updatedAt: 150 },
          ],
        },
      },
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
          lists: false,
        },
        categoryModes: {
          viewed: 'merge',
        },
      },
    );

    expect(result.success).toBe(true);
    expect(viewedReplaceAll).toHaveBeenCalledTimes(1);
    const merged = viewedReplaceAll.mock.calls[0][0];
    expect(merged).toHaveLength(3);
    expect(merged.map((item: any) => item.id).sort()).toEqual(['AAA-001', 'BBB-002', 'CCC-003']);
    expect(merged.find((item: any) => item.id === 'AAA-001')).toMatchObject({
      title: 'Cloud newest',
      tags: ['cloud-new'],
      updatedAt: 300,
    });
    expect(merged.find((item: any) => item.id === 'BBB-002')).toMatchObject({
      title: 'Local only',
      updatedAt: 200,
    });
    expect(result.summary?.categories?.viewed).toMatchObject({
      mode: 'merge',
      added: 1,
      updated: 1,
      kept: 1,
      written: 3,
    });
  });

  it('overwrites viewed records only when the category mode is replace', async () => {
    vi.resetModules();
    const viewedGetAll = vi.fn().mockResolvedValue([
      { id: 'LOCAL-001', title: 'Local only', updatedAt: 200 },
    ]);
    const viewedReplaceAll = vi.fn().mockResolvedValue(1);
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          clear: vi.fn().mockResolvedValue(undefined),
          put: vi.fn().mockResolvedValue(undefined),
        })),
        complete: Promise.resolve(),
      })),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        viewedGetAll,
        viewedReplaceAll,
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');

    const result = await applyImportDataDirect(
      { idb: { viewedRecords: [{ id: 'CLOUD-001', title: 'Cloud only', updatedAt: 100 }] } },
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
          lists: false,
        },
        categoryModes: {
          viewed: 'replace',
        },
      },
    );

    expect(result.success).toBe(true);
    expect(viewedGetAll).not.toHaveBeenCalled();
    expect(viewedReplaceAll).toHaveBeenCalledWith([
      { id: 'CLOUD-001', title: 'Cloud only', updatedAt: 100 },
    ]);
    expect(result.summary?.categories?.viewed).toMatchObject({
      mode: 'replace',
      cleared: true,
      written: 1,
    });
  });

  it('merges list records by id without dropping local-only lists', async () => {
    vi.resetModules();
    const stores = new Map<string, any[]>([
      ['lists', [
        { id: 'list-1', name: 'Local list', updatedAt: 100 },
        { id: 'list-2', name: 'Local only', updatedAt: 200 },
      ]],
    ]);
    const putCalls: any[] = [];
    const fakeStore = {
      clear: vi.fn(async () => {
        stores.set('lists', []);
      }),
      put: vi.fn(async (record: any) => {
        putCalls.push(record);
      }),
    };
    const fakeTx = {
      objectStore: vi.fn(() => fakeStore),
      complete: Promise.resolve(),
    };
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn(async (storeName: string) => stores.get(storeName) || []),
      transaction: vi.fn(() => fakeTx),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        viewedReplaceAll: vi.fn().mockResolvedValue(0),
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');

    const result = await applyImportDataDirect(
      {
        idb: {
          lists: [
            { id: 'list-1', name: 'Cloud newest', updatedAt: 300 },
            { id: 'list-1', name: 'Cloud duplicate old', updatedAt: 150 },
            { id: 'list-3', name: 'Cloud only', updatedAt: 50 },
          ],
        },
      },
      {
        categories: {
          settings: false,
          userProfile: false,
          viewed: false,
          actors: false,
          newWorks: false,
          magnets: false,
          logs: false,
          magnetPushLogs: false,
          importStats: false,
          lists: true,
        },
        categoryModes: {
          lists: 'merge',
        },
      },
    );

    expect(result.success).toBe(true);
    expect(fakeStore.clear).toHaveBeenCalledTimes(1);
    expect(putCalls).toHaveLength(3);
    expect(putCalls.map(item => item.id).sort()).toEqual(['list-1', 'list-2', 'list-3']);
    expect(putCalls.find(item => item.id === 'list-1')).toMatchObject({
      name: 'Cloud newest',
      updatedAt: 300,
    });
    expect(putCalls.find(item => item.id === 'list-2')).toMatchObject({
      name: 'Local only',
      updatedAt: 200,
    });
    expect(result.summary?.categories?.lists).toMatchObject({
      mode: 'merge',
      added: 1,
      updated: 1,
      kept: 1,
      written: 3,
    });
  });

  it('merges logs by fingerprint without duplicating existing entries', async () => {
    vi.resetModules();
    const localLogs = [
      { id: 1, level: 'INFO', message: 'local keep', timestamp: '2026-06-01T00:00:00.000Z', timestampMs: 1780272000000 },
      { id: 2, level: 'WARN', message: 'same log', timestamp: '2026-06-01T00:01:00.000Z', timestampMs: 1780272060000, data: { a: 1 } },
    ];
    const logsGetAll = vi.fn().mockResolvedValue(localLogs);
    const logsBulkAdd = vi.fn().mockResolvedValue(undefined);
    const logsClear = vi.fn().mockResolvedValue(undefined);
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          clear: vi.fn().mockResolvedValue(undefined),
          put: vi.fn().mockResolvedValue(undefined),
        })),
        complete: Promise.resolve(),
      })),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        logsGetAll,
        logsBulkAdd,
        logsClear,
        viewedReplaceAll: vi.fn().mockResolvedValue(0),
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');

    const result = await applyImportDataDirect(
      {
        idb: {
          logs: [
            { id: 99, level: 'WARN', message: 'same log', timestamp: '2026-06-01T00:01:00.000Z', timestampMs: 1780272060000, data: { a: 1 } },
            { id: 100, level: 'ERROR', message: 'cloud only', timestamp: '2026-06-01T00:02:00.000Z', timestampMs: 1780272120000 },
            { id: 101, level: 'ERROR', message: 'cloud only', timestamp: '2026-06-01T00:02:00.000Z', timestampMs: 1780272120000 },
          ],
        },
      },
      {
        categories: {
          settings: false,
          userProfile: false,
          viewed: false,
          actors: false,
          newWorks: false,
          magnets: false,
          logs: true,
          magnetPushLogs: false,
          importStats: false,
          lists: false,
        },
        categoryModes: {
          logs: 'merge',
        },
      },
    );

    expect(result.success).toBe(true);
    expect(logsClear).not.toHaveBeenCalled();
    expect(logsBulkAdd).toHaveBeenCalledTimes(1);
    expect(logsBulkAdd.mock.calls[0][0]).toEqual([
      expect.objectContaining({ level: 'ERROR', message: 'cloud only' }),
    ]);
    expect(logsBulkAdd.mock.calls[0][0][0]).not.toHaveProperty('id');
    expect(result.summary?.categories?.logs).toMatchObject({
      mode: 'merge',
      added: 1,
      kept: 2,
      written: 1,
      total: 3,
    });
  });

  it('replaces magnet push logs without preserving backup ids', async () => {
    vi.resetModules();
    const magnetPushLogsBulkAdd = vi.fn().mockResolvedValue(undefined);
    const initDB = vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          clear: vi.fn().mockResolvedValue(undefined),
          put: vi.fn().mockResolvedValue(undefined),
        })),
        complete: Promise.resolve(),
      })),
    });

    vi.doMock('../../src/platform/storage/indexedDb', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/storage/indexedDb')>();
      return {
        ...actual,
        initDB,
        magnetPushLogsBulkAdd,
        viewedReplaceAll: vi.fn().mockResolvedValue(0),
      };
    });

    const { applyImportDataDirect } = await import('../../src/features/webdavSync/application/restoreService');

    const result = await applyImportDataDirect(
      {
        idb: {
          magnetPushLogs: [
            { id: 12, type: 'push_success', videoId: 'AAA-001', message: 'ok', timestamp: 1780272000000, data: { taskId: 't1' } },
          ],
        },
      },
      {
        categories: {
          settings: false,
          userProfile: false,
          viewed: false,
          actors: false,
          newWorks: false,
          magnets: false,
          logs: false,
          magnetPushLogs: true,
          importStats: false,
          lists: false,
        },
        categoryModes: {
          magnetPushLogs: 'replace',
        },
      },
    );

    expect(result.success).toBe(true);
    expect(magnetPushLogsBulkAdd).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'push_success', videoId: 'AAA-001', message: 'ok' }),
    ]);
    expect(magnetPushLogsBulkAdd.mock.calls[0][0][0]).not.toHaveProperty('id');
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
  }, 20000);

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
        lists: [{ id: 'local_1' }],
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
          lists: { count: 6 },
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
        lists: 6,
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
      idb: {
        lists: [{ id: 'local_1' }, { id: 'series:abc' }],
      },
    }).counts).toMatchObject({
      viewed: 2,
      actors: 1,
      newWorks: 1,
      lists: 2,
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
