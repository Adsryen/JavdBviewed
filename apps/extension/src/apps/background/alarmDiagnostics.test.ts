/**
 * @file alarmDiagnostics.test.ts
 * @description 后台 alarm 诊断读写单测
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ALARM_DIAGNOSTICS_STORAGE_KEY,
  readAlarmDiagnostics,
  recordAlarmFire,
} from './alarmDiagnostics';

describe('alarmDiagnostics', () => {
  const originalChrome = (globalThis as any).chrome;
  let store: Record<string, unknown>;

  beforeEach(() => {
    store = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn((key: string, cb?: (items: Record<string, unknown>) => void) => {
            const result = { [key]: store[key] };
            if (cb) cb(result);
            return Promise.resolve(result);
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(store, items);
          }),
        },
      },
      alarms: {
        get: vi.fn((_name: string, cb?: (a: any) => void) => {
          if (cb) cb(undefined);
          return Promise.resolve(undefined);
        }),
      },
    };
  });

  afterEach(() => {
    if (originalChrome === undefined) delete (globalThis as any).chrome;
    else (globalThis as any).chrome = originalChrome;
  });

  it('records and reads last fire', async () => {
    await recordAlarmFire('newWorks.periodic_check', 'success', { summary: 'new-works-check' });
    const map = await readAlarmDiagnostics();
    expect(map['newWorks.periodic_check']?.lastResult).toBe('success');
    expect(map['newWorks.periodic_check']?.lastSummary).toBe('new-works-check');
    expect(store[ALARM_DIAGNOSTICS_STORAGE_KEY]).toBeTruthy();
  });
});
