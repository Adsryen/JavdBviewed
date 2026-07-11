/**
 * @file bootstrap.ts
 * @description bootstrap
 * @module apps/background
 */
// 背景入口：装配与注册各模块
// chrome 命名空间已由 manifest 入口 compatBootstrap 归一化

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
import { registerDbMessageRouter } from './dbMessageRouter';
import {
  registerDynamicContentScripts,
  registerEmbyDynamicContentScriptsOnStartup,
} from './dynamicContentScripts';
import { syncDrive115DailyAlarmFromSettings } from './drive115UserRefresh';
import { installCoversRefererDNR } from './dnrRules';
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

globalTaskCenter.restoreFromStorage().catch(console.warn);

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

registerDynamicContentScripts();
registerEmbyDynamicContentScriptsOnStartup();
initializeRouteAutoUpdate();

registerWebDAVRouter();
registerDbMessageRouter();
registerMiscRouter();
registerNetProxyRouter();

installCoversRefererDNR();
syncDrive115DailyAlarmFromSettings().catch(() => {});
initializeBackgroundAlarmWiring();
registerBackgroundErrorHandlers();

try {
  ensureChromeNamespace();
  const runtimeKind = detectBackgroundRuntimeKind();
  console.info('[Background] ready', {
    ts: new Date().toISOString(),
    runtimeKind,
  });
} catch {}
