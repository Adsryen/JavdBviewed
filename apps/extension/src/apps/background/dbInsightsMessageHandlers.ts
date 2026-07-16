/**
 * @file dbInsightsMessageHandlers.ts
 * @description 数据洞察的消息处理器 —— 响应 DB:INSIGHTS_* / DB:TRENDS_* 系列消息
 * @module apps/background
 */
import {
  insReportsDelete as defaultInsReportsDelete,
  insReportsExportJSON as defaultInsReportsExportJSON,
  insReportsGet as defaultInsReportsGet,
  insReportsImportJSON as defaultInsReportsImportJSON,
  insReportsList as defaultInsReportsList,
  insReportsPut as defaultInsReportsPut,
  insViewsBulkPut as defaultInsViewsBulkPut,
  insViewsPut as defaultInsViewsPut,
  insViewsRange as defaultInsViewsRange,
  trendsActorsRange as defaultTrendsActorsRange,
  trendsNewWorksRange as defaultTrendsNewWorksRange,
  trendsRecordsRange as defaultTrendsRecordsRange,
} from '../../platform/storage/indexedDb';

type SendResponse = (response: any) => void;  // chrome.runtime 消息回调类型

export interface InsightsMessageDependencies {
  viewsPut?: typeof defaultInsViewsPut;                           // 每日观影统计（增量）
  viewsBulkPut?: typeof defaultInsViewsBulkPut;                   // 每日观影统计（批量）
  viewsRange?: typeof defaultInsViewsRange;                       // 日期范围查询
  reportsPut?: typeof defaultInsReportsPut;                       // 月报存储
  reportsGet?: typeof defaultInsReportsGet;                       // 月报按月份查询
  reportsList?: typeof defaultInsReportsList;                     // 月报列表
  reportsDelete?: typeof defaultInsReportsDelete;                 // 月报删除
  reportsExportJSON?: typeof defaultInsReportsExportJSON;         // 月报导出
  reportsImportJSON?: typeof defaultInsReportsImportJSON;         // 月报导入
  trendsRecordsRange?: typeof defaultTrendsRecordsRange;          // 记录数趋势
  trendsActorsRange?: typeof defaultTrendsActorsRange;            // 演员数趋势
  trendsNewWorksRange?: typeof defaultTrendsNewWorksRange;        // 新作品趋势
  sendRuntimeMessage?: typeof chrome.runtime.sendMessage;         // 跨上下文通知
}

/**
 * 处理 DB:INSIGHTS_* / DB:TRENDS_* 消息 —— 数据洞察、趋势的增删查导出
 * @returns 返回 true 表示保持异步响应通道
 */

export function handleInsightsMessage(
  message: any,
  sendResponse: SendResponse,
  deps: InsightsMessageDependencies = {},
): boolean {
  const viewsPut = deps.viewsPut ?? defaultInsViewsPut;
  const viewsBulkPut = deps.viewsBulkPut ?? defaultInsViewsBulkPut;
  const viewsRange = deps.viewsRange ?? defaultInsViewsRange;
  const reportsPut = deps.reportsPut ?? defaultInsReportsPut;
  const reportsGet = deps.reportsGet ?? defaultInsReportsGet;
  const reportsList = deps.reportsList ?? defaultInsReportsList;
  const reportsDelete = deps.reportsDelete ?? defaultInsReportsDelete;
  const reportsExportJSON = deps.reportsExportJSON ?? defaultInsReportsExportJSON;
  const reportsImportJSON = deps.reportsImportJSON ?? defaultInsReportsImportJSON;
  const trendsRecordsRange = deps.trendsRecordsRange ?? defaultTrendsRecordsRange;
  const trendsActorsRange = deps.trendsActorsRange ?? defaultTrendsActorsRange;
  const trendsNewWorksRange = deps.trendsNewWorksRange ?? defaultTrendsNewWorksRange;
  const sendRuntimeMessage = deps.sendRuntimeMessage ?? chrome.runtime.sendMessage;

  if (message.type === 'DB:INSIGHTS_VIEWS_PUT') {
    const view = message?.payload?.view;
    viewsPut(view).then(() => {
      try { sendRuntimeMessage({ type: 'DB:INSIGHTS_VIEWS_CHANGED', payload: { date: view?.date || null, count: 1 } }); } catch {}
      sendResponse({ success: true });
    })
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights views put failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_VIEWS_BULK_PUT') {
    const views = message?.payload?.views || [];
    viewsBulkPut(views).then(() => {
      try { sendRuntimeMessage({ type: 'DB:INSIGHTS_VIEWS_CHANGED', payload: { count: Array.isArray(views) ? views.length : 0 } }); } catch {}
      sendResponse({ success: true });
    })
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights views bulk put failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_VIEWS_RANGE') {
    const startDate = message?.payload?.startDate;
    const endDate = message?.payload?.endDate;
    viewsRange(startDate, endDate).then((records) => sendResponse({ success: true, records }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights views range failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_REPORTS_PUT') {
    const report = message?.payload?.report;
    reportsPut(report).then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports put failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_REPORTS_GET') {
    const month = message?.payload?.month;
    reportsGet(month).then((record) => sendResponse({ success: true, record }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports get failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_REPORTS_LIST') {
    const limit = Number(message?.payload?.limit ?? 24);
    reportsList(limit).then((records) => sendResponse({ success: true, records }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports list failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_REPORTS_DELETE') {
    const month = message?.payload?.month;
    reportsDelete(month).then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports delete failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_REPORTS_EXPORT') {
    reportsExportJSON().then((json) => sendResponse({ success: true, json }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports export failed' }));
    return true;
  }

  if (message.type === 'DB:INSIGHTS_REPORTS_IMPORT') {
    const json = message?.payload?.json || '[]';
    reportsImportJSON(json).then((count) => sendResponse({ success: true, count }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports import failed' }));
    return true;
  }

  if (message.type === 'DB:TRENDS_RECORDS_RANGE') {
    const startDate = message?.payload?.startDate;
    const endDate = message?.payload?.endDate;
    const mode = message?.payload?.mode || 'cumulative';
    trendsRecordsRange(startDate, endDate, mode).then((points) => sendResponse({ success: true, points }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'trends records failed' }));
    return true;
  }

  if (message.type === 'DB:TRENDS_ACTORS_RANGE') {
    const startDate = message?.payload?.startDate;
    const endDate = message?.payload?.endDate;
    const mode = message?.payload?.mode || 'cumulative';
    trendsActorsRange(startDate, endDate, mode).then((points) => sendResponse({ success: true, points }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'trends actors failed' }));
    return true;
  }

  if (message.type === 'DB:TRENDS_NEWWORKS_RANGE') {
    const startDate = message?.payload?.startDate;
    const endDate = message?.payload?.endDate;
    const mode = message?.payload?.mode || 'cumulative';
    trendsNewWorksRange(startDate, endDate, mode).then((points) => sendResponse({ success: true, points }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'trends newWorks failed' }));
    return true;
  }

  return false;
}
