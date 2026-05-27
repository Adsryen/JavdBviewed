import { getSettings } from '../../../utils/storage';
import type { TelemetryEventType, TelemetryReportResult } from '../domain/types';
import { getTelemetryClientState, writeTelemetryClientState } from './clientState';
import { buildTelemetryPayload } from './buildTelemetryPayload';
import { sendTelemetry } from '../infrastructure/telemetryClient';

export const TELEMETRY_HEARTBEAT_ALARM = 'telemetry.heartbeat';
const HEARTBEAT_INTERVAL_MINUTES = 180;
const STARTUP_THROTTLE_MS = 30 * 60 * 1000;
const HEARTBEAT_THROTTLE_MS = 3 * 60 * 60 * 1000;

export interface ReportTelemetryEventOptions {
  settings?: any;
  fetchImpl?: typeof fetch;
  now?: Date;
  force?: boolean;
}

export async function initializeTelemetryReporter(): Promise<void> {
  const settings = await getSettings();
  syncTelemetryHeartbeatAlarm(settings);
  await reportTelemetryEvent('startup', { settings }).catch(() => ({ sent: false, reason: 'network-error' }));
}

export async function handleTelemetryAlarm(name: string): Promise<boolean> {
  if (name !== TELEMETRY_HEARTBEAT_ALARM) return false;
  await reportTelemetryEvent('heartbeat');
  return true;
}

export function syncTelemetryHeartbeatAlarm(settings?: any): void {
  try {
    if (!chrome?.alarms) return;
    const enabled = settings?.telemetry?.enabled !== false;
    const endpoint = String(settings?.telemetry?.endpoint || '').trim();
    if (!enabled || !endpoint) {
      chrome.alarms.clear(TELEMETRY_HEARTBEAT_ALARM);
      return;
    }

    chrome.alarms.get(TELEMETRY_HEARTBEAT_ALARM, (existing) => {
      if (existing) return;
      chrome.alarms.create(TELEMETRY_HEARTBEAT_ALARM, {
        delayInMinutes: HEARTBEAT_INTERVAL_MINUTES,
        periodInMinutes: HEARTBEAT_INTERVAL_MINUTES,
      });
    });
  } catch {}
}

export async function reportTelemetryEvent(
  event: TelemetryEventType,
  options: ReportTelemetryEventOptions = {},
): Promise<TelemetryReportResult> {
  const settings = options.settings || await getSettings();
  const telemetrySettings = settings?.telemetry || {};
  if (telemetrySettings.enabled === false) return { sent: false, reason: 'disabled' };

  const endpoint = String(telemetrySettings.endpoint || '').trim();
  if (!endpoint) return { sent: false, reason: 'missing-endpoint' };

  const now = options.now || new Date();
  const state = await getTelemetryClientState(settings, now);
  const lastEventAt = event === 'startup' ? state.lastStartupAt : state.lastHeartbeatAt;
  const throttleMs = event === 'startup' ? STARTUP_THROTTLE_MS : HEARTBEAT_THROTTLE_MS;
  if (!options.force && typeof lastEventAt === 'number' && now.getTime() - lastEventAt < throttleMs) {
    return { sent: false, reason: 'throttled' };
  }

  const attemptedState = {
    ...state,
    ...(event === 'startup' ? { lastStartupAt: now.getTime() } : { lastHeartbeatAt: now.getTime() }),
  };
  await writeTelemetryClientState(attemptedState);

  try {
    const payload = await buildTelemetryPayload({
      event,
      settings,
      state: attemptedState,
      now,
    });
    const result = await sendTelemetry({
      endpoint,
      payload,
      fetchImpl: options.fetchImpl,
    });

    if (!result.ok) {
      return { sent: false, reason: 'http-error', status: result.status };
    }

    await writeTelemetryClientState({
      ...attemptedState,
      lastSuccessAt: now.getTime(),
    });
    return { sent: true, status: result.status };
  } catch {
    return { sent: false, reason: 'network-error' };
  }
}
