/**
 * @file cloudSyncStorageListener.test.ts
 * @description Cloud 同步后台 storage 监听测试
 * @module tests/extension
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncEntity } from '@javdb/sync-protocol';
import { STORAGE_KEYS } from '../../apps/extension/src/utils/config';
import { CLOUD_PENDING_STORAGE_KEY } from '../../apps/extension/src/features/cloudSync/chromePendingStore';
import { getChromeStorageSnapshot, resetChromeMock } from '../setup/chrome';

async function flushStorageListener(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function readPending(): SyncEntity[] {
  const snapshot = getChromeStorageSnapshot();
  const value = snapshot[CLOUD_PENDING_STORAGE_KEY];
  return Array.isArray(value) ? (value as SyncEntity[]) : [];
}

describe('Cloud 同步 storage 监听', () => {
  beforeEach(() => {
    resetChromeMock();
    vi.resetModules();
    vi.setSystemTime(new Date('2026-07-20T09:30:00.000Z'));
  });

  it('settings 变化会自动入队为 storage_item/settings', async () => {
    const { registerCloudSyncStorageListener } = await import(
      '../../apps/extension/src/features/cloudSync/backgroundCloudSync'
    );
    registerCloudSyncStorageListener();

    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: { display: { hideViewed: true }, theme: 'dark' },
    });
    await flushStorageListener();

    expect(readPending()).toEqual([
      expect.objectContaining({
        id: STORAGE_KEYS.SETTINGS,
        type: 'storage_item',
        revision: 1,
        updatedAt: Date.now(),
        payload: {
          key: STORAGE_KEYS.SETTINGS,
          value: { display: { hideViewed: true }, theme: 'dark' },
        },
      }),
    ]);
  });

  it('日志和 Cloud 本机状态变化不会进入待同步队列', async () => {
    const { registerCloudSyncStorageListener } = await import(
      '../../apps/extension/src/features/cloudSync/backgroundCloudSync'
    );
    registerCloudSyncStorageListener();

    await chrome.storage.local.set({
      [STORAGE_KEYS.LOGS]: [{ message: 'local only' }],
      drive115_logs: [{ message: 'local only' }],
      cloud_sync_session_v1: { accessToken: 'secret' },
      cloud_sync_cursors_v1: { video: 3 },
      cloud_sync_pending_v1: [],
      cloud_auto_sync_settings_v1: { enabled: true },
      [STORAGE_KEYS.PRIVACY_SESSION]: { unlocked: true },
    });
    await flushStorageListener();

    expect(readPending()).toEqual([]);
  });

  it('删除可同步 storage key 时会入队删除标记', async () => {
    const { registerCloudSyncStorageListener } = await import(
      '../../apps/extension/src/features/cloudSync/backgroundCloudSync'
    );
    registerCloudSyncStorageListener();

    await chrome.storage.local.set({ [STORAGE_KEYS.DASHBOARD_LAST_PAGE]: '#/records' });
    await flushStorageListener();
    await chrome.storage.local.set({ [CLOUD_PENDING_STORAGE_KEY]: [] });
    await chrome.storage.local.remove(STORAGE_KEYS.DASHBOARD_LAST_PAGE);
    await flushStorageListener();

    expect(readPending()).toEqual([
      expect.objectContaining({
        id: STORAGE_KEYS.DASHBOARD_LAST_PAGE,
        type: 'storage_item',
        updatedAt: Date.now(),
        deletedAt: Date.now(),
        payload: expect.objectContaining({ key: STORAGE_KEYS.DASHBOARD_LAST_PAGE }),
      }),
    ]);
  });

  it('应用远端 storage_item 时不会重新写入本地待同步队列', async () => {
    const { registerCloudSyncStorageListener } = await import(
      '../../apps/extension/src/features/cloudSync/backgroundCloudSync'
    );
    const { createExtensionEntityStore } = await import(
      '../../apps/extension/src/features/cloudSync/extensionEntityStore'
    );
    registerCloudSyncStorageListener();

    await createExtensionEntityStore().applyRemote([
      {
        id: STORAGE_KEYS.SETTINGS,
        type: 'storage_item',
        revision: 2,
        updatedAt: Date.now(),
        payload: {
          key: STORAGE_KEYS.SETTINGS,
          value: { display: { hideViewed: false }, theme: 'light' },
        },
      },
    ]);
    await flushStorageListener();

    expect(getChromeStorageSnapshot()[STORAGE_KEYS.SETTINGS]).toEqual({
      display: { hideViewed: false },
      theme: 'light',
    });
    expect(readPending()).toEqual([]);
  });

  it('远端写入抑制只消费匹配的下一次 storage 变更', async () => {
    const { markCloudStorageWrite, shouldSuppressCloudStorageChange } = await import(
      '../../apps/extension/src/features/cloudSync/storageChangeGate'
    );
    const settings = { display: { hideViewed: false }, theme: 'light' };

    markCloudStorageWrite(STORAGE_KEYS.SETTINGS, settings);

    expect(
      shouldSuppressCloudStorageChange(STORAGE_KEYS.SETTINGS, {
        oldValue: {},
        newValue: { display: { hideViewed: false }, theme: 'dark' },
      }),
    ).toBe(false);
    expect(
      shouldSuppressCloudStorageChange(STORAGE_KEYS.SETTINGS, {
        oldValue: {},
        newValue: settings,
      }),
    ).toBe(true);
    expect(
      shouldSuppressCloudStorageChange(STORAGE_KEYS.SETTINGS, {
        oldValue: {},
        newValue: settings,
      }),
    ).toBe(false);

    markCloudStorageWrite(STORAGE_KEYS.DASHBOARD_LAST_PAGE);
    expect(
      shouldSuppressCloudStorageChange(STORAGE_KEYS.DASHBOARD_LAST_PAGE, {
        oldValue: '#/records',
      }),
    ).toBe(true);
  });
});
