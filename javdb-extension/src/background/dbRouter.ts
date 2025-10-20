// src/background/dbRouter.ts
// 抽离 DB 相关消息路由

import { initDB, viewedPut as idbViewedPut, viewedBulkPut as idbViewedBulkPut, viewedCount as idbViewedCount, viewedPage as idbViewedPage, viewedCountByStatus as idbViewedCountByStatus, viewedGetAll as idbViewedGetAll, viewedStats as idbViewedStats, viewedDelete as idbViewedDelete, viewedBulkDelete as idbViewedBulkDelete, viewedQuery as idbViewedQuery, logsAdd as idbLogsAdd, logsBulkAdd as idbLogsBulkAdd, logsQuery as idbLogsQuery, logsClear as idbLogsClear, viewedExportJSON as idbViewedExportJSON, logsExportJSON as idbLogsExportJSON, magnetsUpsertMany as idbMagnetsUpsertMany, magnetsQuery as idbMagnetsQuery, magnetsClearAll as idbMagnetsClearAll, magnetsClearExpired as idbMagnetsClearExpired, actorsPut as idbActorsPut, actorsBulkPut as idbActorsBulkPut, actorsGet as idbActorsGet, actorsDelete as idbActorsDelete, actorsQuery as idbActorsQuery, actorsStats as idbActorsStats, actorsExportJSON as idbActorsExportJSON, newWorksPut as idbNewWorksPut, newWorksBulkPut as idbNewWorksBulkPut, newWorksDelete as idbNewWorksDelete, newWorksGet as idbNewWorksGet, newWorksGetAll as idbNewWorksGetAll, newWorksQuery as idbNewWorksQuery, newWorksStats as idbNewWorksStats, newWorksExportJSON as idbNewWorksExportJSON, insViewsPut, insViewsBulkPut, insViewsRange, insReportsPut, insReportsGet, insReportsList, insReportsDelete, insReportsExportJSON, insReportsImportJSON } from './db';

export function registerDbMessageRouter(): void {
  try { initDB().catch(() => {}); } catch {}
  try {
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      // DB message routing
      if (message.type === 'DB:VIEWED_PUT') {
        const record = message?.payload?.record;
        idbViewedPut(record).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb put failed' }));
        return true; // async
      }
      if (message.type === 'DB:VIEWED_BULK_PUT') {
        const records = message?.payload?.records || [];
        idbViewedBulkPut(records).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb bulkPut failed' }));
        return true; // async
      }
      if (message.type === 'DB:VIEWED_GET_ALL') {
        idbViewedGetAll().then((records) => sendResponse({ success: true, records }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb getAll failed' }));
        return true; // async
      }
      if (message.type === 'DB:VIEWED_COUNT') {
        const status = message?.payload?.status as any;
        const p = status ? idbViewedCountByStatus(status) : idbViewedCount();
        p.then((total) => sendResponse({ success: true, total }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb count failed' }));
        return true;
      }
      if (message.type === 'DB:VIEWED_PAGE') {
        const payload = message?.payload || {};
        idbViewedPage(payload).then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb page failed' }));
        return true;
      }
      if (message.type === 'DB:VIEWED_QUERY') {
        const payload = message?.payload || {};
        idbViewedQuery(payload).then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb query failed' }));
        return true;
      }
      if (message.type === 'DB:VIEWED_EXPORT') {
        idbViewedExportJSON().then((json) => sendResponse({ success: true, json }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb viewed export failed' }));
        return true;
      }
      if (message.type === 'DB:VIEWED_STATS') {
        idbViewedStats().then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb viewed stats failed' }));
        return true;
      }
      if (message.type === 'DB:VIEWED_DELETE') {
        const id = message?.payload?.id;
        idbViewedDelete(id).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb viewed delete failed' }));
        return true;
      }
      if (message.type === 'DB:VIEWED_BULK_DELETE') {
        const ids = message?.payload?.ids || [];
        idbViewedBulkDelete(ids).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'idb viewed bulk delete failed' }));
        return true;
      }
      if (message.type === 'DB:LOGS_ADD') {
        const entry = message?.payload?.entry;
        try { console.debug('[DB][logs] ADD', { hasEntry: !!entry, level: entry?.level, msgLen: String(entry?.message||'').length }); } catch {}
        idbLogsAdd(entry).then((id) => sendResponse({ success: true, id }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'logs add failed' }));
        return true;
      }
      if (message.type === 'DB:LOGS_BULK') {
        const entries = message?.payload?.entries || [];
        idbLogsBulkAdd(entries).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'logs bulk failed' }));
        return true;
      }
      if (message.type === 'DB:LOGS_QUERY') {
        const payload = message?.payload || {};
        try { console.info('[DB][logs] QUERY', { offset: payload?.offset, limit: payload?.limit, level: payload?.level, minLevel: payload?.minLevel, hasDataOnly: payload?.hasDataOnly, source: payload?.source, hasQuery: !!payload?.query }); } catch {}
        idbLogsQuery(payload).then((data) => {
          try { console.info('[DB][logs] QUERY:RESULT', { items: Array.isArray(data?.items) ? data.items.length : -1, total: (data as any)?.total }); } catch {}
          sendResponse({ success: true, ...data });
        })
          .catch((e) => sendResponse({ success: false, error: e?.message || 'logs query failed' }));
        return true;
      }
      if (message.type === 'DB:LOGS_CLEAR') {
        const beforeMs = message?.payload?.beforeMs;
        idbLogsClear(beforeMs).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'logs clear failed' }));
        return true;
      }
      if (message.type === 'DB:LOGS_EXPORT') {
        idbLogsExportJSON().then((json) => sendResponse({ success: true, json }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'logs export failed' }));
        return true;
      }
      // actors
      if (message.type === 'DB:ACTORS_PUT') {
        const record = message?.payload?.record;
        idbActorsPut(record).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors put failed' }));
        return true;
      }
      if (message.type === 'DB:ACTORS_BULK_PUT') {
        const records = message?.payload?.records || [];
        idbActorsBulkPut(records).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors bulkPut failed' }));
        return true;
      }
      if (message.type === 'DB:ACTORS_GET') {
        const id = message?.payload?.id;
        idbActorsGet(id).then((record) => sendResponse({ success: true, record }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors get failed' }));
        return true;
      }
      if (message.type === 'DB:ACTORS_DELETE') {
        const id = message?.payload?.id;
        idbActorsDelete(id).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors delete failed' }));
        return true;
      }
      if (message.type === 'DB:ACTORS_QUERY') {
        const params = message?.payload || {};
        idbActorsQuery(params).then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors query failed' }));
        return true;
      }
      if (message.type === 'DB:ACTORS_STATS') {
        idbActorsStats().then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors stats failed' }));
        return true;
      }
      if (message.type === 'DB:ACTORS_EXPORT') {
        idbActorsExportJSON().then((json) => sendResponse({ success: true, json }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'actors export failed' }));
        return true;
      }
      // newWorks
      if (message.type === 'DB:NEWWORKS_PUT') {
        const record = message?.payload?.record;
        idbNewWorksPut(record).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks put failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_BULK_PUT') {
        const records = message?.payload?.records || [];
        idbNewWorksBulkPut(records).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks bulkPut failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_DELETE') {
        const id = message?.payload?.id;
        idbNewWorksDelete(id).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks delete failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_GET') {
        const id = message?.payload?.id;
        idbNewWorksGet(id).then((record) => sendResponse({ success: true, record }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks get failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_GET_ALL') {
        idbNewWorksGetAll().then((records) => sendResponse({ success: true, records }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks getAll failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_QUERY') {
        const params = message?.payload || {};
        idbNewWorksQuery(params).then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks query failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_STATS') {
        idbNewWorksStats().then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks stats failed' }));
        return true;
      }
      if (message.type === 'DB:NEWWORKS_EXPORT') {
        idbNewWorksExportJSON().then((json) => sendResponse({ success: true, json }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'newWorks export failed' }));
        return true;
      }
      // magnets
      if (message.type === 'DB:MAGNETS_UPSERT') {
        const records = message?.payload?.records || [];
        idbMagnetsUpsertMany(records).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets upsert failed' }));
        return true;
      }
      if (message.type === 'DB:MAGNETS_QUERY') {
        const payload = message?.payload || {};
        idbMagnetsQuery(payload).then((data) => sendResponse({ success: true, ...data }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets query failed' }));
        return true;
      }
      if (message.type === 'DB:MAGNETS_CLEAR') {
        idbMagnetsClearAll().then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets clear failed' }));
        return true;
      }
      if (message.type === 'DB:MAGNETS_CLEAR_EXPIRED') {
        const beforeMs = message?.payload?.beforeMs;
        idbMagnetsClearExpired(beforeMs).then((removed) => sendResponse({ success: true, removed }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'magnets clear expired failed' }));
        return true;
      }
      // insights views
      if (message.type === 'DB:INSIGHTS_VIEWS_PUT') {
        const view = message?.payload?.view;
        insViewsPut(view).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights views put failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_VIEWS_BULK_PUT') {
        const views = message?.payload?.views || [];
        insViewsBulkPut(views).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights views bulk put failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_VIEWS_RANGE') {
        const startDate = message?.payload?.startDate;
        const endDate = message?.payload?.endDate;
        insViewsRange(startDate, endDate).then((records) => sendResponse({ success: true, records }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights views range failed' }));
        return true;
      }
      // insights reports
      if (message.type === 'DB:INSIGHTS_REPORTS_PUT') {
        const report = message?.payload?.report;
        insReportsPut(report).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports put failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_REPORTS_GET') {
        const month = message?.payload?.month;
        insReportsGet(month).then((record) => sendResponse({ success: true, record }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports get failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_REPORTS_LIST') {
        const limit = Number(message?.payload?.limit ?? 24);
        insReportsList(limit).then((records) => sendResponse({ success: true, records }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports list failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_REPORTS_DELETE') {
        const month = message?.payload?.month;
        insReportsDelete(month).then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports delete failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_REPORTS_EXPORT') {
        insReportsExportJSON().then((json) => sendResponse({ success: true, json }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports export failed' }));
        return true;
      }
      if (message.type === 'DB:INSIGHTS_REPORTS_IMPORT') {
        const json = message?.payload?.json || '[]';
        insReportsImportJSON(json).then((count) => sendResponse({ success: true, count }))
          .catch((e) => sendResponse({ success: false, error: e?.message || 'insights reports import failed' }));
        return true;
      }
      return false;
    });
  } catch {}
}
