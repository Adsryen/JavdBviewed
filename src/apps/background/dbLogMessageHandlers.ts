/**
 * @file dbLogMessageHandlers.ts
 * @description 日志数据的消息处理器 —— 响应 DB:LOGS_* 系列消息
 * @module apps/background
 */
import {
  logsAdd as defaultLogsAdd,
  logsBulkAdd as defaultLogsBulkAdd,
  logsClear as defaultLogsClear,
  logsExportJSON as defaultLogsExportJSON,
  logsQuery as defaultLogsQuery,
} from '../../platform/storage/indexedDb';

type SendResponse = (response: any) => void;  // chrome.runtime 消息回调类型

export interface LogMessageDependencies {
  add?: typeof defaultLogsAdd;           // 添加日志
  bulkAdd?: typeof defaultLogsBulkAdd;   // 批量添加日志
  query?: typeof defaultLogsQuery;       // 查询日志
  clear?: typeof defaultLogsClear;       // 清理日志
  exportJSON?: typeof defaultLogsExportJSON;  // 导出日志JSON
}

/**
 * 处理 DB:LOGS_* 消息 —— 日志的增/查/清/导出操作
 * @returns 返回 true 表示保持异步响应通道
 */

export function handleLogMessage(
  message: any,
  sendResponse: SendResponse,
  deps: LogMessageDependencies = {},
): boolean {
  const add = deps.add ?? defaultLogsAdd;
  const bulkAdd = deps.bulkAdd ?? defaultLogsBulkAdd;
  const query = deps.query ?? defaultLogsQuery;
  const clear = deps.clear ?? defaultLogsClear;
  const exportJSON = deps.exportJSON ?? defaultLogsExportJSON;

  if (message.type === 'DB:LOGS_ADD') {
    const entry = message?.payload?.entry;
    add(entry).then((id) => sendResponse({ success: true, id }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'logs add failed' }));
    return true;
  }

  if (message.type === 'DB:LOGS_BULK') {
    const entries = message?.payload?.entries || [];
    bulkAdd(entries).then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'logs bulk failed' }));
    return true;
  }

  if (message.type === 'DB:LOGS_QUERY') {
    const payload = message?.payload || {};
    try { console.info('[Background] logs QUERY', { offset: payload?.offset, limit: payload?.limit, level: payload?.level, minLevel: payload?.minLevel, hasDataOnly: payload?.hasDataOnly, source: payload?.source, hasQuery: !!payload?.query }); } catch {}
    query(payload).then((data) => {
      try { console.info('[Background] logs QUERY:RESULT', { items: Array.isArray(data?.items) ? data.items.length : -1, total: (data as any)?.total }); } catch {}
      sendResponse({ success: true, ...data });
    })
      .catch((e) => sendResponse({ success: false, error: e?.message || 'logs query failed' }));
    return true;
  }

  if (message.type === 'DB:LOGS_CLEAR') {
    const beforeMs = message?.payload?.beforeMs;
    clear(beforeMs).then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'logs clear failed' }));
    return true;
  }

  if (message.type === 'DB:LOGS_EXPORT') {
    exportJSON().then((json) => sendResponse({ success: true, json }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'logs export failed' }));
    return true;
  }

  return false;
}
