/**
 * @file scheduler.test.ts
 * @description NewWorksScheduler chrome.alarms 周期调度单测
 * @module features/newWorks
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NEW_WORKS_CHECK_ALARM,
  NewWorksScheduler,
  checkIntervalHoursToPeriodMinutes,
} from './scheduler';

describe('checkIntervalHoursToPeriodMinutes', () => {
  it('converts hours to minutes with floor of 1', () => {
    expect(checkIntervalHoursToPeriodMinutes(24)).toBe(1440);
    expect(checkIntervalHoursToPeriodMinutes(1)).toBe(60);
    expect(checkIntervalHoursToPeriodMinutes(0.5)).toBe(30);
    expect(checkIntervalHoursToPeriodMinutes(0)).toBe(60);
    expect(checkIntervalHoursToPeriodMinutes(Number.NaN)).toBe(60);
  });
});

describe('NewWorksScheduler alarms', () => {
  const originalChrome = (globalThis as { chrome?: unknown }).chrome;
  let alarmsCreate: ReturnType<typeof vi.fn>;
  let alarmsClear: ReturnType<typeof vi.fn>;

  const manager = {
    initialize: vi.fn(async () => undefined),
    getGlobalConfig: vi.fn(),
    getSubscriptions: vi.fn(async () => [] as Array<{ actorId: string; actorName: string; enabled: boolean }>),
    updateGlobalConfig: vi.fn(async () => undefined),
    addNewWorks: vi.fn(async () => undefined),
  };

  const collector = {
    checkMultipleActors: vi.fn(async () => ({
      discovered: 0,
      errors: [] as string[],
      newWorks: [] as unknown[],
    })),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    alarmsCreate = vi.fn();
    alarmsClear = vi.fn();
    (globalThis as { chrome: unknown }).chrome = {
      runtime: { id: 'test-ext' },
      alarms: {
        create: alarmsCreate,
        clear: alarmsClear,
      },
      notifications: {
        create: vi.fn((_id: string, _opts: unknown, cb?: () => void) => cb?.()),
        clear: vi.fn(),
        onClicked: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      tabs: {
        create: vi.fn(),
      },
    };

    manager.initialize.mockClear();
    manager.getGlobalConfig.mockReset();
    manager.getSubscriptions.mockReset();
    manager.updateGlobalConfig.mockClear();
    manager.addNewWorks.mockClear();
    collector.checkMultipleActors.mockClear();
    manager.getSubscriptions.mockResolvedValue([]);
    collector.checkMultipleActors.mockResolvedValue({
      discovered: 0,
      errors: [],
      newWorks: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalChrome === undefined) {
      delete (globalThis as { chrome?: unknown }).chrome;
    } else {
      (globalThis as { chrome: unknown }).chrome = originalChrome;
    }
    vi.restoreAllMocks();
  });

  function createScheduler(): NewWorksScheduler {
    const scheduler = new NewWorksScheduler();
    scheduler.setDependencies(manager as any, collector as any);
    return scheduler;
  }

  it('start creates alarm with period from checkInterval hours when autoCheckEnabled', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 6,
      lastGlobalCheck: Date.now(),
    });

    const scheduler = createScheduler();
    await scheduler.start();

    expect(alarmsClear).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM);
    expect(alarmsCreate).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM, {
      delayInMinutes: 360,
      periodInMinutes: 360,
    });
    expect(scheduler.getStatus().isRunning).toBe(true);
    expect(scheduler.getStatus().intervalId).toBeUndefined();
  });

  it('start does not create alarm when autoCheckEnabled is false', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: false,
      checkInterval: 24,
    });

    const scheduler = createScheduler();
    await scheduler.start();

    expect(alarmsCreate).not.toHaveBeenCalled();
    expect(alarmsClear).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM);
    expect(scheduler.getStatus().isRunning).toBe(false);
  });

  it('stop clears alarm and marks not running', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 24,
      lastGlobalCheck: 1,
    });

    const scheduler = createScheduler();
    await scheduler.start();
    scheduler.stop();

    expect(alarmsClear).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM);
    expect(scheduler.getStatus().isRunning).toBe(false);
  });

  it('handleAlarm runs collection path for matching name', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 24,
      lastGlobalCheck: 1,
      filters: {},
    });
    manager.getSubscriptions.mockResolvedValue([
      { actorId: 'a1', actorName: 'Actor', enabled: true },
    ]);
    collector.checkMultipleActors.mockResolvedValue({
      discovered: 2,
      errors: [],
      newWorks: [{ id: 'w1' }, { id: 'w2' }],
    });

    const scheduler = createScheduler();
    const handled = scheduler.handleAlarm(NEW_WORKS_CHECK_ALARM);
    expect(handled).toBe(true);

    await vi.waitFor(() => {
      expect(collector.checkMultipleActors).toHaveBeenCalled();
    });
    expect(manager.addNewWorks).toHaveBeenCalled();
    expect(manager.updateGlobalConfig).toHaveBeenCalledWith(
      expect.objectContaining({ lastGlobalCheck: expect.any(Number) }),
    );
  });

  it('handleAlarm returns false for unrelated names', () => {
    const scheduler = createScheduler();
    expect(scheduler.handleAlarm('other.alarm')).toBe(false);
    expect(collector.checkMultipleActors).not.toHaveBeenCalled();
  });

  it('initialize starts alarm when autoCheckEnabled', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 12,
      lastGlobalCheck: 1,
    });

    const scheduler = createScheduler();
    await scheduler.initialize();

    expect(manager.initialize).toHaveBeenCalled();
    expect(alarmsCreate).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM, {
      delayInMinutes: 720,
      periodInMinutes: 720,
    });
    expect(scheduler.getStatus().isInitialized).toBe(true);
    expect(scheduler.getStatus().isRunning).toBe(true);
  });

  it('initialize clears residual alarm when autoCheckEnabled is false', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: false,
      checkInterval: 24,
    });

    const scheduler = createScheduler();
    await scheduler.initialize();

    expect(alarmsCreate).not.toHaveBeenCalled();
    expect(alarmsClear).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM);
    expect(scheduler.getStatus().isInitialized).toBe(true);
    expect(scheduler.getStatus().isRunning).toBe(false);
  });

  it('handleAlarm clears residual alarm when autoCheckEnabled is false', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: false,
      checkInterval: 24,
      lastGlobalCheck: 1,
    });

    const scheduler = createScheduler();
    const handled = scheduler.handleAlarm(NEW_WORKS_CHECK_ALARM);
    expect(handled).toBe(true);

    await vi.waitFor(() => {
      expect(alarmsClear).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM);
    });
    expect(collector.checkMultipleActors).not.toHaveBeenCalled();
    expect(scheduler.getStatus().isRunning).toBe(false);
  });

  it('restart clears and recreates alarm', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 2,
      lastGlobalCheck: 1,
    });

    const scheduler = createScheduler();
    await scheduler.start();
    alarmsCreate.mockClear();
    alarmsClear.mockClear();

    await scheduler.restart();

    expect(alarmsClear).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM);
    expect(alarmsCreate).toHaveBeenCalledWith(NEW_WORKS_CHECK_ALARM, {
      delayInMinutes: 120,
      periodInMinutes: 120,
    });
    expect(scheduler.getStatus().isRunning).toBe(true);
  });

  it('schedules first-run delayed check when lastGlobalCheck is missing', async () => {
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 24,
      lastGlobalCheck: undefined,
      filters: {},
    });
    manager.getSubscriptions.mockResolvedValue([
      { actorId: 'a1', actorName: 'Actor', enabled: true },
    ]);

    const scheduler = createScheduler();
    await scheduler.start();

    expect(collector.checkMultipleActors).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    await vi.waitFor(() => {
      expect(collector.checkMultipleActors).toHaveBeenCalled();
    });
  });

  it('does not schedule periodic setInterval for collection', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    manager.getGlobalConfig.mockResolvedValue({
      autoCheckEnabled: true,
      checkInterval: 24,
      lastGlobalCheck: 1,
    });

    const scheduler = createScheduler();
    await scheduler.start();

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(alarmsCreate).toHaveBeenCalled();
  });
});
