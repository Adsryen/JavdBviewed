/**
 * @file bootstrap.ts
 * @description bootstrap
 * @module apps/background
 */
// 背景入口：装配与注册各模块
// chrome 命名空间已由 manifest 入口 compatBootstrap 归一化
//
// 生命周期约定（Chromium service_worker 与 Firefox event page 共用）：
// 1. 同步阶段：立刻挂 listener（onMessage / onAlarm / onRemoved），避免首条消息丢失
// 2. 冷启动接线：restore 任务中心 + 幂等 DNR/动态脚本/alarms/newWorks（见 backgroundLifecycle）
// 3. onSuspend：event page 挂起前刷任务快照（SW 通常无此事件，静默跳过）

import {
  detectBackgroundRuntimeKind,
  ensureChromeNamespace,
} from '../../platform/browser/extensionApi';
import { installDrive115V2Proxy } from '../../features/drive115/v2/backgroundProxy';
import { ensureMigrationsStart } from '../../platform/storage/migrations';
import { registerMiscRouter } from './miscMessageRouter';
import { registerWebDAVRouter } from '../../features/webdavSync/background/controller';
import { globalTaskCenter } from '../../background/globalTaskCenter';
import { registerNetProxyRouter } from '../../platform/network/backgroundFetchRouter';
import { installConsoleProxyWithSettings } from '../../platform/logging/backgroundConsole';
import { ensureWebDAVClientIdentity } from '../../features/webdavSync';
import {
  handleTelemetryRuntimeMessage,
  initializeTelemetryReporter,
} from '../../features/telemetry';
import { getSettings, saveSettings } from '../../utils/storage';
import { initializeBackgroundAlarmWiring } from './alarmRouter';
import {
  registerBackgroundSuspendFlush,
  runBackgroundColdStartWiring,
} from './backgroundLifecycle';
import { registerDbMessageRouter } from './dbMessageRouter';
import { registerBackgroundErrorHandlers } from './errorHandlers';
import { registerReleaseAnnouncementEvents } from './releaseAnnouncementEvents';
import { initializeRouteAutoUpdate } from './routeAutoUpdate';
import { initializeTelemetryAfterClientIdentity } from './telemetryStartup';

installConsoleProxyWithSettings();
installDrive115V2Proxy();
ensureMigrationsStart();
registerReleaseAnnouncementEvents();
initializeTelemetryAfterClientIdentity({
  ensureClientIdentity: () => ensureWebDAVClientIdentity({ getSettings, saveSettings }),
  initializeTelemetry: initializeTelemetryReporter,
  logWarning: (message, context) => console.warn(message, context),
}).catch(() => {});

// —— 同步 listener：必须在任何 await 之前安装 ——
chrome.tabs.onRemoved.addListener((tabId) => {
  try {
    console.log('[Background] Tab removed, canceling tasks', { tabId });
    globalTaskCenter.cancelTasksByTabId(tabId, 'page-closed-by-user');
  } catch (err) {
    console.warn('[Background] cancelTasksByTabId failed:', err);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (handleTelemetryRuntimeMessage(message, sendResponse)) {
    return true;
  }
  if (typeof message?.type === 'string' && message.type.startsWith('task-center:')) {
    globalTaskCenter.handleMessage(message, sender, sendResponse);
    return globalTaskCenter.isAsyncMessage(message.type) || undefined;
  }
  if (message?.type === 'CANCEL_STALE_LEASE') {
    try {
      const { taskId, reason } = message.payload || {};
      if (taskId) {
        globalTaskCenter.cancelTask(taskId, reason || 'hidden-timeout');
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: 'missing-task-id' });
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
    return false;
  }
  return false;
});

// 消息路由 / alarm 路由：同步注册（幂等由各 router 自身保证）
registerWebDAVRouter();
registerDbMessageRouter();
registerMiscRouter();
registerNetProxyRouter();
initializeBackgroundAlarmWiring();
registerBackgroundErrorHandlers();
registerBackgroundSuspendFlush();

// 冷启动接线：任务恢复 + DNR + 动态 content scripts + alarms 再同步 + newWorks
// 与旧 bootstrap 顶层 fire-and-forget 等价，但集中到 lifecycle 模块并带汇总日志
void runBackgroundColdStartWiring().catch((err) => {
  try {
    console.warn('[Background] cold-start wiring failed:', err);
  } catch {
    // ignore
  }
});

// 线路自动更新（内部会 await 网络；与冷启动并行）
initializeRouteAutoUpdate();

try {
  ensureChromeNamespace();
  const runtimeKind = detectBackgroundRuntimeKind();
  console.info('[Background] ready', {
    ts: new Date().toISOString(),
    runtimeKind,
  });
} catch {}
