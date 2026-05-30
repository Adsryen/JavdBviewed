import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../../utils/config';
import {
  getValue as defaultGetValue,
} from '../../utils/storage';
import {
  viewedPut as defaultViewedPut,
} from '../../platform/storage/indexedDb';
import { requestScheduler as defaultRequestScheduler } from '../../platform/network/requestScheduler';
import { WEBDAV_SYNC_ALARM } from './scheduler';

type SendResponse = (response: any) => void;

export interface SchedulerConfigDependencies {
  getValue?: typeof defaultGetValue;
  requestScheduler?: typeof defaultRequestScheduler;
}

export async function applySchedulerConfigFromSettings(deps: SchedulerConfigDependencies = {}): Promise<void> {
  const getValue = deps.getValue ?? defaultGetValue;
  const requestScheduler = deps.requestScheduler ?? defaultRequestScheduler;

  try {
    const settings = await getValue<any>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS as any);
    const cc = settings?.magnetSearch?.concurrency || {};
    requestScheduler.updateConfig({
      globalMaxConcurrent: typeof cc.bgGlobalMaxConcurrent === 'number' ? cc.bgGlobalMaxConcurrent : 4,
      perHostMaxConcurrent: typeof cc.bgPerHostMaxConcurrent === 'number' ? cc.bgPerHostMaxConcurrent : 1,
      perHostRateLimitPerMin: typeof cc.bgPerHostRateLimitPerMin === 'number' ? cc.bgPerHostRateLimitPerMin : 12,
    });
    console.info('[Background] RequestScheduler config applied:', {
      global: cc.bgGlobalMaxConcurrent,
      perHost: cc.bgPerHostMaxConcurrent,
      rate: cc.bgPerHostRateLimitPerMin,
    });
  } catch (error) {
    console.warn('[Background] applySchedulerConfigFromSettings failed:', error);
  }
}

export interface WebDAVSyncAlarmDependencies {
  getValue?: typeof defaultGetValue;
  alarmName?: string;
}

export async function setupWebDAVSyncAlarm(deps: WebDAVSyncAlarmDependencies = {}): Promise<void> {
  const getValue = deps.getValue ?? defaultGetValue;
  const alarmName = deps.alarmName ?? WEBDAV_SYNC_ALARM;

  try {
    if (!('alarms' in chrome) || !chrome.alarms) return;
    const settings = await getValue<any>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS as any);
    const webdav = settings?.webdav || {};
    try { await chrome.alarms.clear(alarmName); } catch {}
    if (!webdav.enabled || !webdav.autoSync) return;
    if (!webdav.url || !webdav.username || !webdav.password) return;
    let interval = Number(webdav.syncInterval ?? 30);
    if (!Number.isFinite(interval)) interval = 30;
    if (interval < 5) interval = 5;
    if (interval > 1440) interval = 1440;
    chrome.alarms.create(alarmName, { delayInMinutes: interval, periodInMinutes: interval });
  } catch {}
}

export async function handleUpdateWatchedStatus(
  message: any,
  sendResponse: SendResponse,
  viewedPut: typeof defaultViewedPut = defaultViewedPut,
): Promise<void> {
  try {
    const videoId = message?.videoId;
    if (!videoId) {
      sendResponse({ success: false, error: 'No videoId provided' });
      return;
    }
    const record: any = { id: videoId, title: '', status: 'viewed', tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    await viewedPut(record);
    sendResponse({ success: true, record });
  } catch (error: any) {
    console.error('[Background] Failed to update watched status:', error);
    sendResponse({ success: false, error: error.message });
  }
}

export async function handlePrivacyLock(sendResponse: SendResponse): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('dashboard/dashboard.html') });

    for (const tab of tabs) {
      if (tab.id) {
        try {
          console.log('[Background] Sending privacy-lock-trigger to dashboard tab:', { tabId: tab.id, url: tab.url });
          await chrome.tabs.sendMessage(tab.id, { type: 'privacy-lock-trigger' });
        } catch (error) {
          console.error('Failed to send lock message to tab:', error);
        }
      }
    }

    sendResponse({ success: true });
  } catch (error: any) {
    console.error('[Background] Failed to handle privacy lock:', error);
    sendResponse({ success: false, error: error.message });
  }
}
