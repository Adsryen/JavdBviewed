// src/apps/background/miscMessageRouter.ts
// 抽离杂项 handlers 与消息路由

import { refreshRecordById } from '../../features/records/refresh';
import { logsAdd as idbLogsAdd, logsQuery as idbLogsQuery } from '../../platform/storage/indexedDb';
import { handleNewWorksRuntimeMessage } from '../../features/newWorks/backgroundMessages';
import {
  handleCheckVideoUrl,
  handleFetchAVPreviewPreview,
  handleFetchJavDBPreview,
  handleFetchJavSpylPreview,
} from '../../features/previews/backgroundHandlers';
import { registerEmbyDynamicScripts } from './embyDynamicContentScripts';
import {
  handleClearTaskDetails,
  handleGetAggregatedMetrics,
  handleGetTaskDetails,
  handleSaveOrchestratorMetrics,
  handleSaveTaskDetail,
  handleStopAllTasks,
} from './orchestratorMetrics';
import {
  handleDrive115Push,
  handleDrive115Verify,
  handleOpenTabBackground,
} from './tabMessageHandlers';
import {
  handleEmbyLibraryCheckCodes,
  handleEmbyLibrarySync,
} from '../../features/embyLibrary/background/handlers';
import {
  handleExternalDataFetch,
  handleFetchExternalCover,
  handleFetchJavbusAjaxViaTab,
} from './networkMessageHandlers';
import { fetchUserProfileFromJavDB } from './userProfileMessageHandler';
import {
  applySchedulerConfigFromSettings,
  handlePrivacyLock,
  handleUpdateWatchedStatus,
  setupWebDAVSyncAlarm,
} from './utilityMessageHandlers';
import { handleClearAllRecords } from './clearRecordsHandler';

export { registerEmbyDynamicScripts };

const consoleMap: Record<'INFO' | 'WARN' | 'ERROR' | 'DEBUG', (message?: any, ...optionalParams: any[]) => void> = {
  INFO: console.info,
  WARN: console.warn,
  ERROR: console.error,
  DEBUG: console.debug,
};

async function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const logFunction = consoleMap[level] || console.log;
  if (data !== undefined) logFunction(message, data); else logFunction(message);
  try {
    const entry = { timestamp: new Date().toISOString(), level, message, data } as any;
    await idbLogsAdd(entry);
  } catch (e) {
    console.error('[Background] Failed to write log to IDB:', e);
  }
}

export function registerMiscRouter(): void {
  try {
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      switch (message.type) {
        case 'ping':
        case 'ping-background':
          sendResponse({ success: true, message: 'pong' });
          return false;
        case 'fetch-user-profile': {
          // 从 JavDB 抓取用户资料与服务器统计，并写入本地缓存
          // 注意：异步处理需 return true 保持消息通道
          fetchUserProfileFromJavDB()
            .then((profile) => sendResponse({ success: true, profile }))
            .catch((error: any) => sendResponse({ success: false, error: error?.message || '获取账号信息失败' }));
          return true;
        }
        case 'get-logs': {
          const payload = message?.payload || {};
          idbLogsQuery({
            level: payload.level,
            minLevel: payload.minLevel,
            fromMs: payload.fromMs,
            toMs: payload.toMs,
            offset: payload.offset ?? 0,
            limit: payload.limit ?? 100,
            order: payload.order ?? 'desc',
            query: payload.query ?? '',
            hasDataOnly: payload.hasDataOnly ?? false,
            source: payload.source ?? 'ALL',
          }).then(({ items, total }) => {
            // 兼容旧调用：返回 logs 字段
            sendResponse({ success: true, items, total, logs: items });
          }).catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'log-message': {
          const { payload } = message;
          if (payload && payload.level && payload.message) {
            log(payload.level, payload.message, payload.data)
              .then(() => sendResponse({ success: true }))
              .catch((error) => sendResponse({ success: false, error: error.message }));
          } else {
            sendResponse({ success: false, error: 'Invalid log message payload' });
          }
          return true;
        }
        case 'clear-all-records':
          void handleClearAllRecords(sendResponse);
          return true;
        case 'refresh-record': {
          const { videoId } = message;
          if (!videoId) { sendResponse({ success: false, error: 'No videoId provided' }); return false; }
          refreshRecordById(videoId)
            .then((updatedRecord) => sendResponse({ success: true, record: updatedRecord }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'OPEN_TAB_BACKGROUND': {
          handleOpenTabBackground(message, sendResponse);
          return true;
        }
        case 'fetch-external-data':
          handleExternalDataFetch(message, sendResponse);
          return true;
        case 'FETCH_JAVBUS_AJAX_VIA_TAB':
          handleFetchJavbusAjaxViaTab(message, sendResponse);
          return true;
        case 'CHECK_VIDEO_URL':
          handleCheckVideoUrl(message, sendResponse);
          return true;
        case 'FETCH_JAVDB_PREVIEW':
          handleFetchJavDBPreview(message, sendResponse);
          return true;
        case 'FETCH_JAVSPYL_PREVIEW':
          handleFetchJavSpylPreview(message, sendResponse);
          return true;
        case 'FETCH_AVPREVIEW_PREVIEW':
          handleFetchAVPreviewPreview(message, sendResponse);
          return true;
        case 'FETCH_EXTERNAL_COVER':
          handleFetchExternalCover(message, sendResponse);
          return true;
        case 'DRIVE115_PUSH':
          handleDrive115Push(message, sendResponse);
          return true;
        case 'DRIVE115_VERIFY':
          handleDrive115Verify(message, sendResponse);
          return true;
        case 'DRIVE115_HEARTBEAT':
          sendResponse({ type: 'DRIVE115_HEARTBEAT_RESPONSE', success: true });
          return false;
        case 'UPDATE_WATCHED_STATUS': {
          handleUpdateWatchedStatus(message, sendResponse);
          return true;
        }
        case 'EMBY_LIBRARY_SYNC': {
          handleEmbyLibrarySync(message, sendResponse);
          return true;
        }
        case 'EMBY_LIBRARY_CHECK_CODES': {
          handleEmbyLibraryCheckCodes(message, sendResponse);
          return true;
        }
        case 'setup-alarms':
          setupWebDAVSyncAlarm().then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'new-works-manual-check':
        case 'new-works-check-single-actor':
        case 'new-works-manual-cancel':
        case 'new-works-scheduler-restart':
        case 'new-works-scheduler-status':
          return handleNewWorksRuntimeMessage(message, sendResponse);
        case 'privacy-lock':
          // 处理手动锁定请求
          handlePrivacyLock(sendResponse);
          return true;
        case 'orchestrator:saveMetrics': {
          sendResponse({ success: true, queued: true });
          void handleSaveOrchestratorMetrics(message.metrics)
            .catch((error) => {
              console.warn('[Background] Failed to save orchestrator metrics:', error);
            });
          return false;
        }
        case 'orchestrator:getAggregatedMetrics': {
          // 获取聚合的性能指标
          handleGetAggregatedMetrics()
            .then((metrics) => sendResponse({ success: true, metrics }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:saveTaskDetail': {
          // 保存任务详细信息
          handleSaveTaskDetail(message.taskDetail, _sender)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:getTaskDetails': {
          // 获取任务详细信息
          handleGetTaskDetails(message.options)
            .then((details) => sendResponse({ success: true, details }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:clearTaskDetails': {
          // 清空任务详细信息
          handleClearTaskDetails()
            .then((result) => sendResponse(result))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:stopAllTasks': {
          handleStopAllTasks()
            .then((result) => sendResponse(result))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        default:
          return false;
      }
    });
    // 初始化调度器配置，并监听 settings 变化
    applySchedulerConfigFromSettings().catch(() => {});
    setupWebDAVSyncAlarm().catch(() => {});
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes['settings']) {
          applySchedulerConfigFromSettings().catch(() => {});
          setupWebDAVSyncAlarm().catch(() => {});
          // 如果 Emby/Jellyfin 设置发生变化，重新注册动态内容脚本
          const newSettings = changes['settings'].newValue as any;
          const oldSettings = changes['settings'].oldValue as any;
          const embyChanged = JSON.stringify(newSettings?.emby) !== JSON.stringify(oldSettings?.emby);
          if (embyChanged) {
            registerEmbyDynamicScripts(newSettings?.emby).catch(() => {});
          }
        }
      });
    } catch {}
  } catch {}
}

// ============== Helpers copied from previous background ==============
