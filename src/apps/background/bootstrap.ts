// 背景入口：装配与注册各模块

if (typeof self === 'undefined' || !(self as any).registration) {
  console.warn('[Background] Service Worker context not ready, waiting...');
}

import { installDrive115V2Proxy } from '../../background/drive115Proxy';
import { registerDbMessageRouter } from '../../background/dbRouter';
import { ensureMigrationsStart } from '../../background/migrations';
import { registerMiscRouter } from '../../background/miscHandlers';
import { registerWebDAVRouter } from '../../background/webdav';
import { globalTaskCenter } from '../../background/globalTaskCenter';
import { registerNetProxyRouter } from '../../platform/network/backgroundFetchRouter';
import { installConsoleProxyWithSettings } from '../../platform/logging/backgroundConsole';
import {
  handleTelemetryRuntimeMessage,
  initializeTelemetryReporter,
} from '../../features/telemetry';
import { initializeBackgroundAlarmWiring } from './alarmRouter';
import {
  registerDynamicContentScripts,
  registerEmbyDynamicContentScriptsOnStartup,
} from './dynamicContentScripts';
import { syncDrive115DailyAlarmFromSettings } from './drive115UserRefresh';
import { installCoversRefererDNR } from './dnrRules';
import { registerBackgroundErrorHandlers } from './errorHandlers';
import { registerReleaseAnnouncementEvents } from './releaseAnnouncementEvents';
import { initializeRouteAutoUpdate } from './routeAutoUpdate';

installConsoleProxyWithSettings();
installDrive115V2Proxy();
ensureMigrationsStart();
registerReleaseAnnouncementEvents();
initializeTelemetryReporter().catch(() => {});

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
  if (message?.type === 'task-center:page-lifecycle') {
    try {
      const pageInstanceId = String(message.payload?.pageInstanceId || '');
      const reason = String(message.payload?.reason || 'page-refresh-replaced');
      console.log('[Background] Page lifecycle cancellation received', { pageInstanceId, reason, tabId: sender.tab?.id });
      if (!pageInstanceId) {
        sendResponse({ ok: false, error: 'missing-page-instance-id' });
      } else {
        sendResponse(globalTaskCenter.cancelTasksByPageInstance(pageInstanceId, reason));
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
    return false;
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
  console.info('[Background] Service Worker ready', { ts: new Date().toISOString() });
} catch {}
