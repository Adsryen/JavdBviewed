/**
 * @file backgroundCloudSync.ts
 * @description Background：定时 Cloud 同步闹钟 + 消息触发同步
 * @module features/cloudSync
 */
import { loadCloudSession } from './chromeTokenStore';
import { loadCloudAutoSyncSettings } from './autoSyncSettings';
import {
  enqueueStorageItemChange,
  enqueueStorageItemDeletion,
  scheduleEnqueue,
} from './enqueueLocalChange';
import { shouldSuppressCloudStorageChange } from './storageChangeGate';
import { runCloudSyncNow } from './runCloudSyncNow';
import { shouldSyncStorageItemKey } from './storageItemPolicy';

export const CLOUD_AUTO_SYNC_ALARM = 'cloud-auto-sync';

let syncInFlight: Promise<unknown> | null = null;

export async function runCloudSyncExclusive(): Promise<Awaited<ReturnType<typeof runCloudSyncNow>>> {
  if (syncInFlight) {
    await syncInFlight.catch(() => {});
  }
  const run = runCloudSyncNow();
  syncInFlight = run.finally(() => {
    syncInFlight = null;
  });
  return run as Promise<Awaited<ReturnType<typeof runCloudSyncNow>>>;
}

export async function setupCloudAutoSyncAlarm(): Promise<void> {
  try {
    const auto = await loadCloudAutoSyncSettings();
    const session = await loadCloudSession();
    const loggedIn = Boolean(session?.accessToken);
    if (!auto.enabled || !loggedIn) {
      try {
        chrome.alarms?.clear?.(CLOUD_AUTO_SYNC_ALARM);
      } catch {
        // ignore
      }
      return;
    }
    const period = Math.max(5, auto.intervalMinutes);
    chrome.alarms.create(CLOUD_AUTO_SYNC_ALARM, {
      delayInMinutes: Math.min(period, 5),
      periodInMinutes: period,
    });
  } catch (e) {
    console.warn('[CloudSync] setup alarm failed', e);
  }
}

export async function handleCloudAutoSyncAlarm(name: string): Promise<boolean> {
  if (name !== CLOUD_AUTO_SYNC_ALARM) return false;
  try {
    const session = await loadCloudSession();
    if (!session?.accessToken) return true;
    const auto = await loadCloudAutoSyncSettings();
    if (!auto.enabled) return true;
    await runCloudSyncExclusive();
  } catch (e) {
    console.warn('[CloudSync] auto sync failed', e);
  }
  return true;
}

export function registerCloudSyncMessageHandler(): void {
  try {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      if (message.type === 'CLOUD_SYNC_NOW') {
        runCloudSyncExclusive()
          .then((result) => sendResponse({ success: true, result }))
          .catch((e: unknown) =>
            sendResponse({
              success: false,
              error: e instanceof Error ? e.message : String(e),
            }),
          );
        return true;
      }
      if (message.type === 'CLOUD_SYNC_SETUP_ALARM') {
        setupCloudAutoSyncAlarm()
          .then(() => sendResponse({ success: true }))
          .catch((e: unknown) =>
            sendResponse({
              success: false,
              error: e instanceof Error ? e.message : String(e),
            }),
          );
        return true;
      }
      return false;
    });
  } catch {
    // ignore
  }
}

/** storage 变更时刷新闹钟（登录态 / 自动同步开关） */
export function registerCloudSyncStorageListener(): void {
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (
        changes.cloud_sync_session_v1 ||
        changes.cloud_auto_sync_settings_v1 ||
        changes.cloud_sync_settings_v1
      ) {
        void setupCloudAutoSyncAlarm();
      }
      const storageChanges = Object.entries(changes).filter(
        ([key, change]) =>
          shouldSyncStorageItemKey(key) &&
          !shouldSuppressCloudStorageChange(key, change),
      );
      if (storageChanges.length) {
        scheduleEnqueue(async () => {
          for (const [key, change] of storageChanges) {
            if (Object.prototype.hasOwnProperty.call(change, 'newValue')) {
              await enqueueStorageItemChange(key, change.newValue);
            } else {
              await enqueueStorageItemDeletion(key);
            }
          }
        });
      }
    });
  } catch {
    // ignore
  }
}
