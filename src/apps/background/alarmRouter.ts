import { handleAlarmAsync, compensateOnStartup, INSIGHTS_ALARM, registerMonthlyAlarm } from './scheduler';
import { newWorksScheduler } from '../../features/newWorks';
import { handleTelemetryAlarm, syncTelemetryHeartbeatAlarm } from '../../features/telemetry';
import { getSettings } from '../../utils/storage';
import { registerDynamicContentScripts } from './dynamicContentScripts';
import {
  handleDrive115Alarm,
  handleDrive115SettingsChange,
} from './drive115UserRefresh';

export function initializeBackgroundAlarmWiring(): void {
  syncInsightsMonthlyAlarmFromSettings();
  registerNewWorksStartupInitializer();
  registerBackgroundAlarmRouter();
  registerBackgroundSettingsChangeRouter();
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

      const keepAlive = setInterval(() => {
        try { chrome.storage.local.get('_keepalive', () => {}); } catch {}
      }, 20000);
      const done = () => clearInterval(keepAlive);
      try {
        const p = (async () => {
          if (await handleTelemetryAlarm(alarm?.name || '')) return;
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
