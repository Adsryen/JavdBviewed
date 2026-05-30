import { hasDrive115V2Credentials, isDrive115EnabledState, normalizeDrive115Settings } from '../../features/drive115/app';
import { getSettings, saveSettings } from '../../utils/storage';

export const DRIVE115_USER_REFRESH_ALARM = 'drive115.daily_user_refresh';

export async function broadcastDrive115RefreshUserInfo(): Promise<void> {
  try {
    const extUrl = chrome.runtime.getURL('');
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && tab.url.startsWith(extUrl)) {
        console.log('[Background] Broadcasting drive115.refresh_user_info to extension tab:', { tabId: tab.id, url: tab.url });
        chrome.tabs.sendMessage(tab.id, { type: 'drive115.refresh_user_info' }, () => {
          if (chrome.runtime.lastError) {
            console.debug('[Background] drive115.refresh_user_info skipped:', { tabId: tab.id, error: chrome.runtime.lastError.message });
          }
        });
      }
    }
  } catch {}
}

export async function backgroundRefreshDrive115UserInfo(): Promise<void> {
  try {
    const settings = await getSettings();
    const drv = normalizeDrive115Settings((settings as any)?.drive115 || {});
    const enabled: boolean = isDrive115EnabledState(drv);
    const rtStatus: string = drv.v2RefreshTokenStatus || 'unknown';
    const refreshToken: string = (drv.v2RefreshToken || '').trim();

    if (!enabled || !refreshToken) return;
    if (rtStatus === 'invalid' || rtStatus === 'expired') return;

    console.info('[Background] 115 后台自动刷新用户信息开始');

    const { getDrive115V2Service } = await import('../../features/drive115/v2');
    const svc = getDrive115V2Service();
    const result = await svc.fetchUserInfoAuto({ forceAutoRefresh: true });
    if (!result.success || !result.data) {
      console.warn('[Background] 115 后台刷新用户信息失败:', result.message);
      return;
    }

    const latest = await getSettings();
    const ns: any = { ...(latest || {}) };
    ns.drive115 = {
      ...((latest as any)?.drive115 || {}),
      v2UserInfo: result.data,
      v2UserInfoUpdatedAt: Date.now(),
      v2UserInfoExpired: false,
    };
    await saveSettings(ns);

    console.info('[Background] 115 后台刷新用户信息成功，已持久化');
    await broadcastDrive115RefreshUserInfo();
  } catch (e: any) {
    console.warn('[Background] 115 后台刷新用户信息异常:', e?.message || e);
  }
}

export function registerDrive115DailyAlarm(): void {
  try {
    chrome.alarms.get(DRIVE115_USER_REFRESH_ALARM, (existing) => {
      if (!existing) {
        chrome.alarms.create(DRIVE115_USER_REFRESH_ALARM, {
          delayInMinutes: 60,
          periodInMinutes: 1440,
        });
        console.info('[Background] 115 每日用户信息刷新 alarm 已注册');
      }
    });
  } catch {}
}

export async function syncDrive115DailyAlarmFromSettings(settings?: any): Promise<void> {
  const nextSettings = settings || await getSettings();
  const drv = normalizeDrive115Settings((nextSettings as any)?.drive115 || {});
  if (isDrive115EnabledState(drv) && hasDrive115V2Credentials(drv) && drv.v2RefreshToken) {
    registerDrive115DailyAlarm();
  }
}

export function handleDrive115Alarm(alarmName: string): boolean {
  if (alarmName !== DRIVE115_USER_REFRESH_ALARM) return false;
  try { backgroundRefreshDrive115UserInfo(); } catch {}
  return true;
}

export function handleDrive115SettingsChange(oldSettings: any, newSettings: any): void {
  const oldDrv = normalizeDrive115Settings(oldSettings?.drive115 || {});
  const newDrv = normalizeDrive115Settings(newSettings?.drive115 || {});
  const wasValid = oldDrv.v2RefreshTokenStatus === 'valid';
  const isNowValid = newDrv.v2RefreshTokenStatus === 'valid';

  if (!wasValid && isNowValid) {
    console.info('[Background] 115 refresh_token 变为有效，立即刷新用户信息');
    setTimeout(() => { backgroundRefreshDrive115UserInfo(); }, 1500);
  }

  const newEnabled = isDrive115EnabledState(newDrv) && hasDrive115V2Credentials(newDrv) && !!newDrv.v2RefreshToken;
  const oldEnabled = isDrive115EnabledState(oldDrv) && hasDrive115V2Credentials(oldDrv) && !!oldDrv.v2RefreshToken;
  if (newEnabled && !oldEnabled) {
    registerDrive115DailyAlarm();
  } else if (!newEnabled && oldEnabled) {
    try { chrome.alarms?.clear?.(DRIVE115_USER_REFRESH_ALARM); } catch {}
  }
}
