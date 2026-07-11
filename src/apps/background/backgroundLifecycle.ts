/**
 * @file backgroundLifecycle.ts
 * @description 后台冷启动 / 唤醒后的幂等关键接线（Chromium SW 与 Firefox event page 共用）
 * @module apps/background
 *
 * 设计原则：
 * - SW 与 event page 被回收后都会整脚本重跑；此模块把「必须重新装上」的副作用集中列出
 * - 各子步骤自身应幂等（DNR replace、alarms re-sync、task restore 一次）
 * - 禁止在 feature 内 if (firefox)；生命周期差异仅通过 runtimeKind 日志暴露
 * - 不替代顶层 listener 注册（onMessage / onAlarm 仍在 bootstrap 同步安装，避免丢首条消息）
 */

import {
  detectBackgroundRuntimeKind,
  ensureChromeNamespace,
  type BackgroundRuntimeKind,
} from '../../platform/browser/extensionApi';
import { globalTaskCenter } from '../../background/globalTaskCenter';
import { newWorksScheduler } from '../../features/newWorks';
import {
  syncEmbyLibrarySyncAlarmFromCurrentSettings,
  syncEmbyLibrarySyncAlarmFromSettings,
} from '../../features/embyLibrary/background/scheduler';
import { getSettings } from '../../utils/storage';
import { syncInsightsMonthlyAlarmFromSettings } from './alarmRouter';
import {
  registerDynamicContentScripts,
  registerEmbyDynamicContentScriptsOnStartup,
} from './dynamicContentScripts';
import { installCoversRefererDNR } from './dnrRules';
import { syncDrive115DailyAlarmFromSettings } from './drive115UserRefresh';
import { compensateOnStartup } from './scheduler';

export type BackgroundColdStartResult = {
  runtimeKind: BackgroundRuntimeKind;
  taskCenterRestored: boolean;
  errors: string[];
};

/**
 * 冷启动关键接线：任务中心恢复、DNR、动态 content scripts、alarms 再同步、新作品调度器。
 * 可与 bootstrap 顶层同步注册并行；await 完成后再依赖内存任务状态的逻辑应走 ensureReady。
 */
export async function runBackgroundColdStartWiring(): Promise<BackgroundColdStartResult> {
  ensureChromeNamespace();
  const runtimeKind = detectBackgroundRuntimeKind();
  const errors: string[] = [];
  let taskCenterRestored = false;

  // DNR 先装：避免 await storage restore 期间封面请求缺 referer（对齐旧 bootstrap 同步时序）
  try {
    installCoversRefererDNR();
  } catch (error) {
    errors.push(`dnr:${formatError(error)}`);
  }

  try {
    await globalTaskCenter.restoreFromStorage();
    taskCenterRestored = true;
  } catch (error) {
    errors.push(`taskCenter:${formatError(error)}`);
  }

  try {
    await registerDynamicContentScripts(false);
  } catch (error) {
    errors.push(`dynamicContentScripts:${formatError(error)}`);
  }

  try {
    await registerEmbyDynamicContentScriptsOnStartup();
  } catch (error) {
    errors.push(`embyDynamicScripts:${formatError(error)}`);
  }

  try {
    syncInsightsMonthlyAlarmFromSettings();
  } catch (error) {
    errors.push(`insightsAlarm:${formatError(error)}`);
  }

  try {
    await syncEmbyLibrarySyncAlarmFromCurrentSettings();
  } catch (error) {
    errors.push(`embyAlarm:${formatError(error)}`);
  }

  try {
    await syncDrive115DailyAlarmFromSettings();
  } catch (error) {
    errors.push(`drive115Alarm:${formatError(error)}`);
  }

  // newWorks 使用 chrome.alarms 做周期检查；冷启动仍 initialize 以恢复 isRunning 状态、
  // 并在 autoCheckEnabled 时幂等 ensureAlarm（浏览器可能已保留 alarm，create 前会 clear 再写）
  try {
    await newWorksScheduler.initialize();
  } catch (error) {
    errors.push(`newWorks:${formatError(error)}`);
  }

  // 可选：启动补偿上月月报 + 再同步 emby alarm（settings 已读）
  // compensate 幂等（已有 final 月报则跳过）；浏览器级 onStartup 仍会再跑一遍
  try {
    const settings = await getSettings();
    const ins = settings?.insights || {};
    if (ins.autoCompensateOnStartupEnabled) {
      compensateOnStartup();
    }
    syncEmbyLibrarySyncAlarmFromSettings(settings);
  } catch (error) {
    errors.push(`startupCompensate:${formatError(error)}`);
  }

  try {
    console.info('[Background] cold-start wiring complete', {
      runtimeKind,
      taskCenterRestored,
      errorCount: errors.length,
      errors: errors.length ? errors : undefined,
    });
  } catch {
    // ignore log failures
  }

  return { runtimeKind, taskCenterRestored, errors };
}

/**
 * 挂接 runtime.onSuspend（Firefox event page 支持；Chromium SW 通常无此事件）。
 * 在挂起前强制刷任务中心快照，缩小「最后 30s 周期快照」窗口丢失。
 */
export function registerBackgroundSuspendFlush(): void {
  try {
    ensureChromeNamespace();
    type RuntimeWithSuspend = {
      onSuspend?: {
        addListener: (cb: () => void) => void;
      };
    };
    const runtime = (globalThis as typeof globalThis & {
      chrome?: { runtime?: RuntimeWithSuspend };
    }).chrome?.runtime;

    const onSuspend = runtime?.onSuspend;
    if (!onSuspend?.addListener) return;

    onSuspend.addListener(() => {
      try {
        globalTaskCenter.flushPersist();
        console.info('[Background] onSuspend: task center snapshot flushed');
      } catch (error) {
        try {
          console.warn('[Background] onSuspend flush failed:', formatError(error));
        } catch {
          // ignore
        }
      }
    });
  } catch {
    // Chromium SW 或 mock 环境无 onSuspend 时静默跳过
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message || String(error);
  return String(error);
}
