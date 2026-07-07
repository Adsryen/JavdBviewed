/**
 * @file webdavDeviceRegistry.test.ts
 * @description WebDAV 已知设备清单合并测试
 * @module tests/extension
 */
import { describe, expect, it, vi } from 'vitest';
import type { WebDAVClientProfile, WebDAVUploadIndexItem } from '../../src/features/webdavSync/domain/types';
import { getChromeStorageSnapshot, setChromeStorage } from '../setup/chrome';
import { STORAGE_KEYS } from '../../src/utils/config';

const sourceA = {
  configId: 'config-a',
  configName: 'A 端',
  urlFingerprint: 'https://dav-a.example.com/dav/|user-a',
};

const sourceB = {
  configId: 'config-b',
  configName: 'B 端',
  urlFingerprint: 'https://dav-b.example.com/dav/|user-b',
};

function profile(clientId: string, deviceLabel: string, lastSeenAt: string): WebDAVClientProfile {
  return {
    clientId,
    deviceLabel,
    browserName: 'Chrome',
    platform: 'windows',
    extensionVersion: '1.21.2',
    installedAt: '2026-06-01T00:00:00.000Z',
    lastSeenAt,
  };
}

async function sendWebDAVRuntimeMessage(message: Record<string, unknown>): Promise<any> {
  const { registerWebDAVRouter } = await import('../../src/background/webdav');
  registerWebDAVRouter();
  const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls.at(-1)?.[0];
  expect(listener).toBeTypeOf('function');

  return new Promise((resolve) => {
    const asyncResult = listener?.(message, {} as chrome.runtime.MessageSender, resolve);
    expect(asyncResult).toBe(true);
  });
}

function emptyPropfindXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
    <d:multistatus xmlns:d="DAV:">
      <d:response>
        <d:href>/dav/backups/clients/</d:href>
        <d:propstat>
          <d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop>
          <d:status>HTTP/1.1 200 OK</d:status>
        </d:propstat>
      </d:response>
    </d:multistatus>`;
}

describe('WebDAV known device registry', () => {
  it('exposes an empty knownDevices list in default WebDAV settings', async () => {
    const { DEFAULT_SETTINGS } = await import('../../src/utils/config');

    expect(DEFAULT_SETTINGS.webdav.knownDevices).toEqual([]);
  });

  it('merges remote devices by clientId without deleting local-only devices', async () => {
    const { mergeKnownDevices } = await import('../../src/features/webdavSync/application/deviceRegistry');

    const result = mergeKnownDevices(
      [
        {
          ...profile('device-local', '本地设备', '2026-07-01T08:00:00.000Z'),
          firstSeenAt: 1782892800000,
          lastKnownAt: 1782892800000,
          sources: [],
        },
      ],
      [
        {
          profile: profile('device-cloud', '云端设备', '2026-07-02T08:00:00.000Z'),
          source: { ...sourceA, seenAt: 1782979200000, hasClientProfile: true, hasBackup: false },
        },
      ],
      { now: 1782979200000 },
    );

    expect(result.map((device) => device.clientId).sort()).toEqual(['device-cloud', 'device-local']);
    expect(result.find((device) => device.clientId === 'device-local')?.deviceLabel).toBe('本地设备');
    expect(result.find((device) => device.clientId === 'device-cloud')?.sources).toEqual([
      expect.objectContaining({
        configId: 'config-a',
        hasClientProfile: true,
        hasBackup: false,
      }),
    ]);
  });

  it('keeps local device label when older remote profile has a different label', async () => {
    const { mergeKnownDevices } = await import('../../src/features/webdavSync/application/deviceRegistry');

    const result = mergeKnownDevices(
      [
        {
          ...profile('device-a', '书房电脑', '2026-07-03T08:00:00.000Z'),
          firstSeenAt: 1783065600000,
          lastKnownAt: 1783065600000,
          sources: [{ ...sourceA, firstSeenAt: 1783065600000, lastSeenAt: 1783065600000, hasClientProfile: true, hasBackup: true }],
        },
      ],
      [
        {
          profile: profile('device-a', '旧云端名称', '2026-07-02T08:00:00.000Z'),
          source: { ...sourceB, seenAt: 1783152000000, hasClientProfile: true, hasBackup: false },
        },
      ],
      { now: 1783152000000 },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.deviceLabel).toBe('书房电脑');
    expect(result[0]?.sources).toHaveLength(2);
  });

  it('always keeps the current local client profile in known devices', async () => {
    const { mergeKnownDevices } = await import('../../src/features/webdavSync/application/deviceRegistry');

    const currentProfile = profile('current-device', '当前设备', '2026-07-04T08:00:00.000Z');
    const result = mergeKnownDevices([], [], {
      now: 1783238400000,
      currentProfile,
      currentSource: { ...sourceA, seenAt: 1783238400000, hasClientProfile: true, hasBackup: false },
    });

    expect(result).toEqual([
      expect.objectContaining({
        clientId: 'current-device',
        deviceLabel: '当前设备',
        firstSeenAt: Date.parse('2026-06-01T00:00:00.000Z'),
        lastKnownAt: 1783238400000,
        sources: [
          expect.objectContaining({
            configId: 'config-a',
            hasClientProfile: true,
            hasBackup: false,
          }),
        ],
      }),
    ]);
  });

  it('builds known device inputs from clients and upload index without inventing backups', async () => {
    const {
      buildKnownDeviceInputsFromRemoteState,
      mergeKnownDevices,
      buildKnownDeviceViews,
    } = await import('../../src/features/webdavSync/application/deviceRegistry');

    const uploadItems: WebDAVUploadIndexItem[] = [
      {
        uploadId: 'upload-backup-only',
        uploadedAt: '2026-07-05T08:00:00.000Z',
        clientId: 'backup-only-device',
        deviceLabel: '只有备份记录的设备',
        browserName: 'Edge',
        type: 'full',
        status: 'success',
        file: 'backup.zip',
      },
    ];

    const incoming = buildKnownDeviceInputsFromRemoteState({
      profiles: [profile('profile-device', '有设备档案的设备', '2026-07-05T07:00:00.000Z')],
      uploadItems,
      source: { ...sourceA, seenAt: 1783324800000 },
    });
    const knownDevices = mergeKnownDevices([], incoming, { now: 1783324800000 });
    const views = buildKnownDeviceViews(knownDevices, 'profile-device', sourceA);

    expect(knownDevices.map((device) => device.clientId).sort()).toEqual(['backup-only-device', 'profile-device']);
    expect(views.find((device) => device.clientId === 'profile-device')?.currentRemote).toEqual(expect.objectContaining({
      hasClientProfile: true,
      hasBackup: false,
    }));
    expect(views.find((device) => device.clientId === 'backup-only-device')?.currentRemote).toEqual(expect.objectContaining({
      hasClientProfile: false,
      hasBackup: true,
      lastUploadId: 'upload-backup-only',
      lastUploadAt: Date.parse('2026-07-05T08:00:00.000Z'),
    }));
  });

  it('plans remote client profile backfill only for missing client registry files', async () => {
    const { buildMissingRemoteClientProfiles } = await import('../../src/features/webdavSync/application/deviceRegistry');
    const knownDevices = [
      {
        ...profile('current-device', '当前设备', '2026-07-05T08:00:00.000Z'),
        firstSeenAt: 1783324800000,
        lastKnownAt: 1783324800000,
        sources: [],
      },
      {
        ...profile('remote-device', '远端已有设备', '2026-07-05T08:00:00.000Z'),
        firstSeenAt: 1783324800000,
        lastKnownAt: 1783324800000,
        sources: [],
      },
    ];

    const missing = buildMissingRemoteClientProfiles(
      knownDevices,
      [profile('remote-device', '远端已有设备', '2026-07-05T08:00:00.000Z')],
    );

    expect(missing).toEqual([
      expect.objectContaining({
        clientId: 'current-device',
        deviceLabel: '当前设备',
      }),
    ]);
  });

  it('lists local known devices and backfills missing remote client profiles for the active WebDAV config', async () => {
    const putUrls: string[] = [];
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (options?.method === 'PROPFIND' && url.endsWith('/clients/')) {
        return new Response(emptyPropfindXml(), { status: 207 });
      }
      if (!options?.method || options.method === 'GET') {
        return new Response('', { status: 404 });
      }
      if (options?.method === 'PUT') {
        putUrls.push(url);
        return new Response('', { status: 201 });
      }
      return new Response('', { status: 200 });
    });
    global.fetch = fetchMock as any;

    setChromeStorage({
      [STORAGE_KEYS.SETTINGS]: {
        webdav: {
          enabled: true,
          url: 'https://dav.example.com/dav/backups/',
          username: 'user',
          password: 'pass',
          activeConfigId: 'config-active',
          configs: [
            {
              id: 'config-active',
              name: 'B 端',
              url: 'https://dav.example.com/dav/backups/',
              username: 'user',
              password: 'pass',
              updatedAt: 1783324800000,
              lastSync: null,
            },
          ],
          clientId: 'local-device',
          deviceLabel: '本机',
          browserName: 'Chrome',
          clientInstalledAt: '2026-07-01T00:00:00.000Z',
          knownDevices: [
            {
              ...profile('local-device', '本机', '2026-07-05T08:00:00.000Z'),
              firstSeenAt: 1782892800000,
              lastKnownAt: 1783324800000,
              sources: [],
            },
          ],
        },
      },
    });

    const response = await sendWebDAVRuntimeMessage({ type: 'webdav-list-clients' });

    expect(response).toEqual(expect.objectContaining({
      success: true,
      currentClientId: 'local-device',
      remoteSync: {
        attempted: true,
        written: 1,
        failed: 0,
      },
    }));
    expect(response.clients).toEqual([
      expect.objectContaining({
        clientId: 'local-device',
        deviceLabel: '本机',
        currentRemote: expect.objectContaining({
          hasClientProfile: true,
          hasBackup: false,
        }),
      }),
    ]);
    expect(putUrls).toEqual(['https://dav.example.com/dav/backups/clients/local-device.json']);
    expect(putUrls.some((url) => url.endsWith('upload-index.json'))).toBe(false);
    expect(getChromeStorageSnapshot()[STORAGE_KEYS.SETTINGS].webdav.knownDevices).toEqual([
      expect.objectContaining({ clientId: 'local-device', deviceLabel: '本机' }),
    ]);
  });

  it('keeps local known devices visible when the active WebDAV config cannot be read', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as any;

    setChromeStorage({
      [STORAGE_KEYS.SETTINGS]: {
        webdav: {
          enabled: true,
          url: 'https://dav-down.example.com/dav/backups/',
          username: 'user',
          password: 'pass',
          activeConfigId: 'config-down',
          configs: [
            {
              id: 'config-down',
              name: '维护中的端',
              url: 'https://dav-down.example.com/dav/backups/',
              username: 'user',
              password: 'pass',
              updatedAt: 1783324800000,
              lastSync: null,
            },
          ],
          clientId: 'local-device',
          deviceLabel: '本机',
          browserName: 'Chrome',
          clientInstalledAt: '2026-07-01T00:00:00.000Z',
          knownDevices: [
            {
              ...profile('local-device', '本机', '2026-07-05T08:00:00.000Z'),
              firstSeenAt: 1782892800000,
              lastKnownAt: 1783324800000,
              sources: [],
            },
            {
              ...profile('other-device', '另一台设备', '2026-07-04T08:00:00.000Z'),
              firstSeenAt: 1782806400000,
              lastKnownAt: 1783238400000,
              sources: [],
            },
          ],
        },
      },
    });

    const response = await sendWebDAVRuntimeMessage({ type: 'webdav-list-clients' });

    expect(response).toEqual(expect.objectContaining({
      success: true,
      currentClientId: 'local-device',
      error: '无法连接到 WebDAV 服务器，请检查服务器地址和当前网络。',
      remoteSync: {
        attempted: false,
        written: 0,
        failed: 0,
      },
    }));
    expect(response.clients.map((client: WebDAVClientProfile) => client.clientId).sort()).toEqual(['local-device', 'other-device']);
    expect(getChromeStorageSnapshot()[STORAGE_KEYS.SETTINGS].webdav.knownDevices).toHaveLength(2);
  });

  it('updates local known devices after a successful WebDAV upload', async () => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doMock('../../src/features/webdavSync/application/backupCollector', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/features/webdavSync/application/backupCollector')>();
      return {
        ...actual,
        collectBackupData: vi.fn().mockResolvedValue({
          version: 1,
          data: { 'SSIS-001': { id: 'SSIS-001' } },
          stats: { storage: { viewed: { count: 1 } } },
        }),
      };
    });

    const savedSettings: any[] = [];
    const initialSettings = {
      webdav: {
        enabled: true,
        url: 'https://dav.example.com/dav/backups/',
        username: 'user',
        password: 'pass',
        clientId: 'upload-device',
        deviceLabel: '上传设备',
        browserName: 'Chrome',
        clientInstalledAt: '2026-07-01T00:00:00.000Z',
        uploadIndexLimit: 50,
        knownDevices: [],
      },
    };

    global.fetch = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === 'PROPFIND') return new Response('', { status: 207 });
      if (options?.method === 'GET') return new Response('', { status: 404 });
      if (options?.method === 'PUT') return new Response('', { status: 201 });
      return new Response('', { status: 200 });
    }) as any;

    const { performWebDAVUpload } = await import('../../src/features/webdavSync/application/uploadService');
    const result = await performWebDAVUpload({
      getSettings: async () => savedSettings.at(-1) || initialSettings,
      saveSettings: async (settings: any) => {
        savedSettings.push(settings);
      },
    });

    expect(result.success).toBe(true);
    expect(savedSettings.at(-1)?.webdav.knownDevices).toEqual([
      expect.objectContaining({
        clientId: 'upload-device',
        deviceLabel: '上传设备',
        lastSyncStatus: 'success',
      }),
    ]);
    expect(savedSettings.at(-1)?.webdav.knownDevices[0]?.lastUploadId).toBe(savedSettings.at(-1)?.webdav.clientLastUploadId);

    vi.doUnmock('../../src/features/webdavSync/application/backupCollector');
  });

  it('updates the current device label in local known devices', async () => {
    global.fetch = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === 'PROPFIND') return new Response('', { status: 207 });
      if (options?.method === 'PUT') return new Response('', { status: 201 });
      return new Response('', { status: 200 });
    }) as any;

    setChromeStorage({
      [STORAGE_KEYS.SETTINGS]: {
        webdav: {
          enabled: true,
          url: 'https://dav.example.com/dav/backups/',
          username: 'user',
          password: 'pass',
          clientId: 'local-device',
          deviceLabel: '旧名称',
          browserName: 'Chrome',
          clientInstalledAt: '2026-07-01T00:00:00.000Z',
          knownDevices: [
            {
              ...profile('local-device', '旧名称', '2026-07-05T08:00:00.000Z'),
              firstSeenAt: 1782892800000,
              lastKnownAt: 1783324800000,
              sources: [],
            },
          ],
        },
      },
    });

    const response = await sendWebDAVRuntimeMessage({
      type: 'webdav-update-device-label',
      deviceLabel: '新名称',
    });

    expect(response).toEqual(expect.objectContaining({
      success: true,
      profile: expect.objectContaining({
        clientId: 'local-device',
        deviceLabel: '新名称',
      }),
    }));
    const webdav = getChromeStorageSnapshot()[STORAGE_KEYS.SETTINGS].webdav;
    expect(webdav.deviceLabel).toBe('新名称');
    expect(webdav.knownDevices).toEqual([
      expect.objectContaining({
        clientId: 'local-device',
        deviceLabel: '新名称',
      }),
    ]);
  });
});
