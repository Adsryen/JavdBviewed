/**
 * @file alarmRouter.ts
 * @description alarmRouter
 * @module apps/background
 */
import { handleAlarmAsync, compensateOnStartup, INSIGHTS_ALARM, registerMonthlyAlarm } from './scheduler';
import { newWorksScheduler } from '../../features/newWorks';
import { handleTelemetryAlarm, syncTelemetryHeartbeatAlarm } from '../../features/telemetry';
import { getSettings } from '../../utils/storage';
import { registerDynamicContentScripts } from './dynamicContentScripts';
import {
  handleEmbyLibraryAlarm,
  syncEmbyLibrarySyncAlarmFromCurrentSettings,
  syncEmbyLibrarySyncAlarmFromSettings,
} from '../../features/embyLibrary/background/scheduler';
import {
  handleDrive115Alarm,
  handleDrive115SettingsChange,
} from './drive115UserRefresh';
import { viewedPurgeExpired, actorsPurgeExpired } from '../../platform/storage/indexedDb';

const RECYCLE_BIN_CLEANUP_ALARM = 'RECYCLE_BIN_CLEANUP';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function initializeBackgroundAlarmWiring(): void {
  syncInsightsMonthlyAlarmFromSettings();
  syncEmbyLibrarySyncAlarmFromCurrentSettings().catch(() => {});
  registerNewWorksStartupInitializer();
  registerRecycleBinCleanupAlarm();
  registerBackgroundAlarmRouter();
  registerBackgroundSettingsChangeRouter();
}

function registerRecycleBinCleanupAlarm(): void {
  try {
    chrome.alarms.create(RECYCLE_BIN_CLEANUP_ALARM, { periodInMinutes: 360 }); // 每6小时
  } catch {}
}

async function handleRecycleBinCleanup(): Promise<void> {
  const purgedVideos = await viewedPurgeExpired(THIRTY_DAYS_MS).catch(() => 0);
  const purgedActors = await actorsPurgeExpired(THIRTY_DAYS_MS).catch(() => 0);
  if (purgedVideos > 0 || purgedActors > 0) {
    console.log(`[RecycleBin] 清理过期记录: 番号 ${purgedVideos} 条, 演员 ${purgedActors} 条`);
  }
}

export function syncInsightsMonthlyAlarmFromSettings(): void {
  try {
    (async () => {
      try {
        const settings = await getSettings();
        const ins = settings?.insights || {};
        if (ins.autoMonthlyEnabled) {
          const minute = Number(ins.autoMonthlyMinuteOfDay ?? 10);
          registerMonthlyAlarm({ enabled: true, minuteOfDay: Number.isFinite(minute) ? minute : 10 });
        } else {
          try { chrome.alarms?.clear?.(INSIGHTS_ALARM); } catch {}
        }
      } catch {}
    })();
  } catch {}
}

export function registerNewWorksStartupInitializer(): void {
  try {
    chrome.runtime.onStartup.addListener(async () => {
      try {
        await newWorksScheduler.initialize();
        try {
          const settings = await getSettings();
          syncEmbyLibrarySyncAlarmFromSettings(settings);
          const ins = settings?.insights || {};
          if (ins.autoCompensateOnStartupEnabled) {
            compensateOnStartup();
          }
        } catch {}
      } catch (e: any) {
        console.warn('[Background] Failed to initialize new works scheduler:', e?.message || e);
      }
    });
  } catch {}
}

export function registerBackgroundAlarmRouter(): void {
  try {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (handleDrive115Alarm(alarm?.name || '')) return;

      // 回收站清理
      if (alarm?.name === RECYCLE_BIN_CLEANUP_ALARM) {
        handleRecycleBinCleanup().catch(() => {});
        return;
      }

      const keepAlive = setInterval(() => {
        try { chrome.storage.local.get('_keepalive', () => {}); } catch {}
      }, 20000);
      const done = () => clearInterval(keepAlive);
      try {
        const p = (async () => {
          if (await handleTelemetryAlarm(alarm?.name || '')) return;
          if (await handleEmbyLibraryAlarm(alarm?.name || '')) return;
          await handleAlarmAsync(alarm?.name || '');
        })();
        p.then(done).catch(done);
      } catch { done(); }
    });
  } catch {}
}

export function registerBackgroundSettingsChangeRouter(): void {
  try {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes['settings']) {
        try {
          const settings = await getSettings();
          const ins = settings?.insights || {};
          if (ins.autoMonthlyEnabled) {
            const minute = Number(ins.autoMonthlyMinuteOfDay ?? 10);
            registerMonthlyAlarm({ enabled: true, minuteOfDay: Number.isFinite(minute) ? minute : 10 });
          } else {
            try { chrome.alarms?.clear?.(INSIGHTS_ALARM); } catch {}
          }
          syncTelemetryHeartbeatAlarm(settings);
          syncEmbyLibrarySyncAlarmFromSettings(settings);

          const oldSettings = changes['settings']?.oldValue as any;
          const newSettings = changes['settings']?.newValue as any;
          const oldRoutes = oldSettings?.routes;
          const newRoutes = newSettings?.routes;
          if (JSON.stringify(oldRoutes) !== JSON.stringify(newRoutes)) {
            console.info('[Background] Routes config changed, re-registering dynamic content scripts');
            await registerDynamicContentScripts(true);
          }

          handleDrive115SettingsChange(oldSettings, newSettings);
        } catch {}
      }
    });
  } catch {}
}
