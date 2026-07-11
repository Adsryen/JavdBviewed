/**
 * @file backgroundLifecycle.test.ts
 * @description 后台冷启动接线单测（隔离依赖）
 * @module apps/background
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const restoreFromStorage = vi.fn(async () => {});
const flushPersist = vi.fn();
const installCoversRefererDNR = vi.fn();
const registerDynamicContentScripts = vi.fn(async () => {});
const registerEmbyDynamicContentScriptsOnStartup = vi.fn(async () => {});
const syncInsightsMonthlyAlarmFromSettings = vi.fn();
const syncEmbyLibrarySyncAlarmFromCurrentSettings = vi.fn(async () => {});
const syncDrive115DailyAlarmFromSettings = vi.fn(async () => {});
const newWorksInitialize = vi.fn(async () => {});
const getSettings = vi.fn(async () => ({ insights: { autoCompensateOnStartupEnabled: false } }));
const compensateOnStartup = vi.fn();
const syncEmbyLibrarySyncAlarmFromSettings = vi.fn();
const ensureChromeNamespace = vi.fn(() => ({}));
const detectBackgroundRuntimeKind = vi.fn(() => 'event_page' as const);

vi.mock('../../platform/browser/extensionApi', () => ({
  ensureChromeNamespace: () => ensureChromeNamespace(),
  detectBackgroundRuntimeKind: () => detectBackgroundRuntimeKind(),
}));

vi.mock('../../background/globalTaskCenter', () => ({
  globalTaskCenter: {
    restoreFromStorage: () => restoreFromStorage(),
    flushPersist: () => flushPersist(),
  },
}));

vi.mock('../../features/newWorks', () => ({
  newWorksScheduler: {
    initialize: () => newWorksInitialize(),
  },
}));

vi.mock('../../features/embyLibrary/background/scheduler', () => ({
  syncEmbyLibrarySyncAlarmFromCurrentSettings: () => syncEmbyLibrarySyncAlarmFromCurrentSettings(),
  syncEmbyLibrarySyncAlarmFromSettings: (s: unknown) => syncEmbyLibrarySyncAlarmFromSettings(s),
}));

vi.mock('../../utils/storage', () => ({
  getSettings: () => getSettings(),
}));

vi.mock('./alarmRouter', () => ({
  syncInsightsMonthlyAlarmFromSettings: () => syncInsightsMonthlyAlarmFromSettings(),
}));

vi.mock('./dynamicContentScripts', () => ({
  registerDynamicContentScripts: (v?: boolean) => registerDynamicContentScripts(v),
  registerEmbyDynamicContentScriptsOnStartup: () => registerEmbyDynamicContentScriptsOnStartup(),
}));

vi.mock('./dnrRules', () => ({
  installCoversRefererDNR: () => installCoversRefererDNR(),
}));

vi.mock('./drive115UserRefresh', () => ({
  syncDrive115DailyAlarmFromSettings: () => syncDrive115DailyAlarmFromSettings(),
}));

vi.mock('./scheduler', () => ({
  compensateOnStartup: () => compensateOnStartup(),
}));

describe('backgroundLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detectBackgroundRuntimeKind.mockReturnValue('event_page');
    getSettings.mockResolvedValue({ insights: { autoCompensateOnStartupEnabled: false } });
  });

  it('runs cold-start steps and reports task center restore', async () => {
    const { runBackgroundColdStartWiring } = await import('./backgroundLifecycle');
    const result = await runBackgroundColdStartWiring();

    expect(ensureChromeNamespace).toHaveBeenCalled();
    // DNR 应先于 task restore（同步安装，避免 restore await 窗口）
    expect(installCoversRefererDNR).toHaveBeenCalledTimes(1);
    expect(restoreFromStorage).toHaveBeenCalledTimes(1);
    expect(registerDynamicContentScripts).toHaveBeenCalledWith(false);
    expect(registerEmbyDynamicContentScriptsOnStartup).toHaveBeenCalledTimes(1);
    expect(syncInsightsMonthlyAlarmFromSettings).toHaveBeenCalledTimes(1);
    expect(syncEmbyLibrarySyncAlarmFromCurrentSettings).toHaveBeenCalledTimes(1);
    expect(syncDrive115DailyAlarmFromSettings).toHaveBeenCalledTimes(1);
    expect(newWorksInitialize).toHaveBeenCalledTimes(1);
    expect(compensateOnStartup).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      runtimeKind: 'event_page',
      taskCenterRestored: true,
      errors: [],
    });
  });

  it('collects errors without throwing when a step fails', async () => {
    restoreFromStorage.mockRejectedValueOnce(new Error('storage down'));
    installCoversRefererDNR.mockImplementationOnce(() => {
      throw new Error('dnr fail');
    });

    const { runBackgroundColdStartWiring } = await import('./backgroundLifecycle');
    const result = await runBackgroundColdStartWiring();

    expect(result.taskCenterRestored).toBe(false);
    expect(result.errors.some((e) => e.startsWith('taskCenter:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('dnr:'))).toBe(true);
    expect(newWorksInitialize).toHaveBeenCalled();
  });

  it('runs insights compensate when settings enable it', async () => {
    getSettings.mockResolvedValueOnce({
      insights: { autoCompensateOnStartupEnabled: true },
    });

    const { runBackgroundColdStartWiring } = await import('./backgroundLifecycle');
    await runBackgroundColdStartWiring();

    expect(compensateOnStartup).toHaveBeenCalledTimes(1);
    expect(syncEmbyLibrarySyncAlarmFromSettings).toHaveBeenCalled();
  });

  it('registers onSuspend flush when available', async () => {
    const addListener = vi.fn();
    (globalThis as any).chrome = {
      runtime: {
        onSuspend: { addListener },
      },
    };

    const { registerBackgroundSuspendFlush } = await import('./backgroundLifecycle');
    registerBackgroundSuspendFlush();

    expect(addListener).toHaveBeenCalledTimes(1);
    const cb = addListener.mock.calls[0][0] as () => void;
    cb();
    expect(flushPersist).toHaveBeenCalledTimes(1);

    delete (globalThis as any).chrome;
  });
});