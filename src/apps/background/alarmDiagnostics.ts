/**
 * @file alarmDiagnostics.ts
 * @description 后台 alarm 最近触发诊断（MVP）
 * @module apps/background
 */
export const ALARM_DIAGNOSTICS_STORAGE_KEY = 'alarmDiagnostics:v1';

export type AlarmFireResult = 'success' | 'error' | 'skipped';

export interface AlarmDiagnosticEntry {
  lastFiredAt: number;
  lastResult: AlarmFireResult;
  lastError?: string;
  lastSummary?: string;
  updatedAt: number;
  nextScheduledAt?: number;
}

export type AlarmDiagnosticsMap = Record<string, AlarmDiagnosticEntry>;

export async function recordAlarmFire(
  alarmName: string,
  result: AlarmFireResult,
  options: { error?: string; summary?: string; nextScheduledAt?: number } = {},
): Promise<void> {
  if (!alarmName || !chrome?.storage?.local) return;

  try {
    const now = Date.now();
    const current = await readAlarmDiagnostics();
    const next: AlarmDiagnosticsMap = {
      ...current,
      [alarmName]: {
        lastFiredAt: now,
        lastResult: result,
        lastError: options.error,
        lastSummary: options.summary,
        updatedAt: now,
        nextScheduledAt: options.nextScheduledAt,
      },
    };
    await chrome.storage.local.set({ [ALARM_DIAGNOSTICS_STORAGE_KEY]: next });
  } catch {
    // 诊断失败不影响业务
  }
}

export async function readAlarmDiagnostics(): Promise<AlarmDiagnosticsMap> {
  try {
    if (!chrome?.storage?.local?.get) return {};
    const result = await new Promise<Record<string, any>>((resolve) => {
      let settled = false;
      const finish = (items?: Record<string, any>) => {
        if (settled) return;
        settled = true;
        resolve(items || {});
      };
      try {
        // chrome.storage.local.get 在类型上为 callback void；运行时可能返回 Promise
        const maybe = chrome.storage.local.get(
          ALARM_DIAGNOSTICS_STORAGE_KEY,
          (items) => finish(items || {}),
        ) as unknown;
        const asPromise = maybe as { then?: (onFulfilled: (v: any) => void, onRejected?: () => void) => void };
        if (typeof asPromise?.then === 'function') {
          asPromise.then((items) => finish(items || {}), () => finish({}));
        }
      } catch {
        finish({});
      }
    });
    const value = result?.[ALARM_DIAGNOSTICS_STORAGE_KEY];
    if (!value || typeof value !== 'object') return {};
    return value as AlarmDiagnosticsMap;
  } catch {
    return {};
  }
}

export async function getAlarmNextScheduledAt(alarmName: string): Promise<number | undefined> {
  try {
    if (!chrome?.alarms?.get) return undefined;
    const alarm = await new Promise<chrome.alarms.Alarm | undefined>((resolve) => {
      let settled = false;
      const finish = (item?: chrome.alarms.Alarm) => {
        if (settled) return;
        settled = true;
        resolve(item);
      };
      try {
        const maybe = chrome.alarms.get(alarmName, (item) => finish(item)) as unknown;
        const asPromise = maybe as { then?: (onFulfilled: (v: any) => void, onRejected?: () => void) => void };
        if (typeof asPromise?.then === 'function') {
          asPromise.then((item) => finish(item), () => finish(undefined));
        }
      } catch {
        finish(undefined);
      }
    });
    return typeof alarm?.scheduledTime === 'number' ? alarm.scheduledTime : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 包装 alarm 处理器：记录成功/失败摘要
 */
export async function withAlarmDiagnostics<T>(
  alarmName: string,
  run: () => Promise<T> | T,
  summarize?: (value: T) => string | undefined,
): Promise<T> {
  try {
    const value = await run();
    const nextScheduledAt = await getAlarmNextScheduledAt(alarmName);
    await recordAlarmFire(alarmName, 'success', {
      summary: summarize ? summarize(value) : undefined,
      nextScheduledAt,
    });
    return value;
  } catch (error) {
    const nextScheduledAt = await getAlarmNextScheduledAt(alarmName);
    await recordAlarmFire(alarmName, 'error', {
      error: error instanceof Error ? error.message : String(error),
      nextScheduledAt,
    });
    throw error;
  }
}
