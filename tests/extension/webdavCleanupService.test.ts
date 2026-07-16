/**
 * @file webdavCleanupService.test.ts
 * @description WebDAV cleanup service - per-device retention 测试
 * @module tests/extension
 */
import { describe, it, expect, vi } from 'vitest';
import type { WebDAVFile } from '../../apps/extension/src/features/webdavSync/domain/types';

describe('WebDAV cleanup service - per-device retention', () => {
  it('returns a readable WebDAV connection error when file listing fetch fails', async () => {
    vi.resetModules();
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;
    const logs: Array<{ level: string; message: string; payload?: any }> = [];

    const { listWebDAVFiles } = await import('../../apps/extension/src/features/webdavSync/application/cleanupService');

    const result = await listWebDAVFiles({
      getSettings: async () => ({
        webdav: {
          enabled: true,
          url: 'https://dav.example.com/dav/',
          username: 'user',
          password: 'pass',
        },
      }),
      logger: (level, message, payload) => {
        logs.push({ level, message, payload });
      },
    });

    expect(result).toEqual({
      success: false,
      error: '无法连接到 WebDAV 服务器，请检查服务器地址和当前网络。',
    });
    expect(logs).toContainEqual(expect.objectContaining({
      level: 'ERROR',
      message: 'Failed to list WebDAV files.',
      payload: expect.objectContaining({
        error: 'Failed to fetch',
        userMessage: '无法连接到 WebDAV 服务器，请检查服务器地址和当前网络。',
        url: 'https://dav.example.com/dav/',
        username: '[CONFIGURED]',
      }),
    }));
  });

  it('cleans up old backups per device independently', async () => {
    const mockFiles: WebDAVFile[] = [
      // Device A - 5 files (should keep 3, delete 2)
      { path: '/dav/backup-2026-06-10.zip', name: 'javdb-extension-backup-2026-06-10-10-00-00.zip', lastModified: '2026-06-10T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },
      { path: '/dav/backup-2026-06-09.zip', name: 'javdb-extension-backup-2026-06-09-10-00-00.zip', lastModified: '2026-06-09T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },
      { path: '/dav/backup-2026-06-08.zip', name: 'javdb-extension-backup-2026-06-08-10-00-00.zip', lastModified: '2026-06-08T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },
      { path: '/dav/backup-2026-06-07.zip', name: 'javdb-extension-backup-2026-06-07-10-00-00.zip', lastModified: '2026-06-07T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },
      { path: '/dav/backup-2026-06-06.zip', name: 'javdb-extension-backup-2026-06-06-10-00-00.zip', lastModified: '2026-06-06T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },

      // Device B - 4 files (should keep 3, delete 1)
      { path: '/dav/backup-2026-06-10-b.zip', name: 'javdb-extension-backup-2026-06-10-11-00-00.zip', lastModified: '2026-06-10T11:00:00Z', uploaderClientId: 'device-b', uploaderDeviceLabel: 'Device B' },
      { path: '/dav/backup-2026-06-09-b.zip', name: 'javdb-extension-backup-2026-06-09-11-00-00.zip', lastModified: '2026-06-09T11:00:00Z', uploaderClientId: 'device-b', uploaderDeviceLabel: 'Device B' },
      { path: '/dav/backup-2026-06-08-b.zip', name: 'javdb-extension-backup-2026-06-08-11-00-00.zip', lastModified: '2026-06-08T11:00:00Z', uploaderClientId: 'device-b', uploaderDeviceLabel: 'Device B' },
      { path: '/dav/backup-2026-06-07-b.zip', name: 'javdb-extension-backup-2026-06-07-11-00-00.zip', lastModified: '2026-06-07T11:00:00Z', uploaderClientId: 'device-b', uploaderDeviceLabel: 'Device B' },

      // Device C - 2 files (should keep both)
      { path: '/dav/backup-2026-06-10-c.zip', name: 'javdb-extension-backup-2026-06-10-12-00-00.zip', lastModified: '2026-06-10T12:00:00Z', uploaderClientId: 'device-c', uploaderDeviceLabel: 'Device C' },
      { path: '/dav/backup-2026-06-09-c.zip', name: 'javdb-extension-backup-2026-06-09-12-00-00.zip', lastModified: '2026-06-09T12:00:00Z', uploaderClientId: 'device-c', uploaderDeviceLabel: 'Device C' },
    ];

    const deletedFiles: string[] = [];
    const logMessages: Array<{ level: string; message: string; payload?: any }> = [];

    const mockFetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        deletedFiles.push(url);
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    global.fetch = mockFetch as any;

    const options = {
      getSettings: async () => ({
        webdav: {
          enabled: true,
          url: 'https://dav.example.com/dav/',
          username: 'user',
          password: 'pass',
        },
      }),
      logger: (level: string, message: string, payload?: any) => {
        logMessages.push({ level, message, payload });
      },
    };

    const cleanupModule = await import('../../apps/extension/src/features/webdavSync/application/cleanupService');
    const listFiles = vi.fn().mockResolvedValue({ success: true, files: mockFiles });

    await cleanupModule.cleanupOldBackups(3, { ...options, listFiles } as any);

    expect(listFiles).toHaveBeenCalled();

    // 验证删除的文件数量（Device A: 2个，Device B: 1个，Device C: 0个）
    expect(deletedFiles.length).toBe(3);

    // 验证 Device A 删除了最旧的 2 个文件
    expect(deletedFiles.some(url => url.includes('backup-2026-06-06.zip'))).toBe(true);
    expect(deletedFiles.some(url => url.includes('backup-2026-06-07.zip'))).toBe(true);

    // 验证 Device B 删除了最旧的 1 个文件
    expect(deletedFiles.some(url => url.includes('backup-2026-06-07-b.zip'))).toBe(true);

    // 验证 Device C 没有删除任何文件
    expect(deletedFiles.some(url => url.includes('-c.zip'))).toBe(false);

    // 验证日志中记录了按设备分组
    const groupedLog = logMessages.find(log => log.message === 'cleanupOldBackups: grouped by device');
    expect(groupedLog).toBeDefined();
    expect(groupedLog?.payload?.deviceCount).toBe(3);
  });

  it('handles devices with unknown clientId', async () => {
    const mockFiles: WebDAVFile[] = [
      { path: '/dav/javdb-extension-backup-2026-06-10.zip', name: 'javdb-extension-backup-2026-06-10.zip', lastModified: '2026-06-10T10:00:00Z' },
      { path: '/dav/javdb-extension-backup-2026-06-09.zip', name: 'javdb-extension-backup-2026-06-09.zip', lastModified: '2026-06-09T10:00:00Z' },
      { path: '/dav/javdb-extension-backup-2026-06-08.zip', name: 'javdb-extension-backup-2026-06-08.zip', lastModified: '2026-06-08T10:00:00Z' },
    ];

    const deletedFiles: string[] = [];

    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        deletedFiles.push(url);
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }
      return Promise.resolve({ ok: false, status: 404 } as Response);
    }) as any;

    const options = {
      getSettings: async () => ({
        webdav: {
          enabled: true,
          url: 'https://dav.example.com/dav/',
          username: 'user',
          password: 'pass',
        },
      }),
      logger: vi.fn(),
    };

    const cleanupModule = await import('../../apps/extension/src/features/webdavSync/application/cleanupService');
    const listFiles = vi.fn().mockResolvedValue({ success: true, files: mockFiles });

    await cleanupModule.cleanupOldBackups(2, { ...options, listFiles } as any);

    expect(listFiles).toHaveBeenCalled();

    // 所有文件都归到 'unknown' 设备，应该保留 2 个，删除 1 个
    expect(deletedFiles.length).toBe(1);
    expect(deletedFiles[0]).toContain('backup-2026-06-08.zip');
  });

  it('does not delete when retention is 0', async () => {
    const mockFiles: WebDAVFile[] = [
      { path: '/dav/backup-1.zip', name: 'javdb-extension-backup-2026-06-10.zip', lastModified: '2026-06-10T10:00:00Z', uploaderClientId: 'device-a' },
    ];

    const deletedFiles: string[] = [];
    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        deletedFiles.push(url);
      }
      return Promise.resolve({ ok: true, status: 204 } as Response);
    }) as any;

    const options = {
      getSettings: async () => ({
        webdav: { enabled: true, url: 'https://dav.example.com/dav/', username: 'user', password: 'pass' },
      }),
      logger: vi.fn(),
    };

    const cleanupModule = await import('../../apps/extension/src/features/webdavSync/application/cleanupService');
    const listFiles = vi.fn().mockResolvedValue({ success: true, files: mockFiles });

    await cleanupModule.cleanupOldBackups(0, { ...options, listFiles } as any);

    expect(deletedFiles.length).toBe(0);
  });

  it('keeps all files when each device has fewer than retention count', async () => {
    const mockFiles: WebDAVFile[] = [
      { path: '/dav/backup-a1.zip', name: 'javdb-extension-backup-2026-06-10-a.zip', lastModified: '2026-06-10T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },
      { path: '/dav/backup-a2.zip', name: 'javdb-extension-backup-2026-06-09-a.zip', lastModified: '2026-06-09T10:00:00Z', uploaderClientId: 'device-a', uploaderDeviceLabel: 'Device A' },
      { path: '/dav/backup-b1.zip', name: 'javdb-extension-backup-2026-06-10-b.zip', lastModified: '2026-06-10T11:00:00Z', uploaderClientId: 'device-b', uploaderDeviceLabel: 'Device B' },
    ];

    const deletedFiles: string[] = [];
    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        deletedFiles.push(url);
      }
      return Promise.resolve({ ok: true, status: 204 } as Response);
    }) as any;

    const options = {
      getSettings: async () => ({
        webdav: { enabled: true, url: 'https://dav.example.com/dav/', username: 'user', password: 'pass' },
      }),
      logger: vi.fn(),
    };

    const cleanupModule = await import('../../apps/extension/src/features/webdavSync/application/cleanupService');
    const listFiles = vi.fn().mockResolvedValue({ success: true, files: mockFiles });

    await cleanupModule.cleanupOldBackups(5, { ...options, listFiles } as any);

    // 每个设备的文件都少于 5 个，不应该删除任何文件
    expect(deletedFiles.length).toBe(0);
  });
});
