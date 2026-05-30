import {
  magnetPushLogsAdd as defaultMagnetPushLogsAdd,
  magnetPushLogsBulkAdd as defaultMagnetPushLogsBulkAdd,
  magnetPushLogsClear as defaultMagnetPushLogsClear,
  magnetPushLogsGetAll as defaultMagnetPushLogsGetAll,
  magnetPushLogsQuery as defaultMagnetPushLogsQuery,
} from '../../platform/storage/indexedDb';

type SendResponse = (response: any) => void;

export interface MagnetPushLogDependencies {
  add?: typeof defaultMagnetPushLogsAdd;
  bulkAdd?: typeof defaultMagnetPushLogsBulkAdd;
  query?: typeof defaultMagnetPushLogsQuery;
  clear?: typeof defaultMagnetPushLogsClear;
  getAll?: typeof defaultMagnetPushLogsGetAll;
}

export function handleMagnetPushLogMessage(
  message: any,
  sendResponse: SendResponse,
  deps: MagnetPushLogDependencies = {},
): boolean {
  const add = deps.add ?? defaultMagnetPushLogsAdd;
  const bulkAdd = deps.bulkAdd ?? defaultMagnetPushLogsBulkAdd;
  const query = deps.query ?? defaultMagnetPushLogsQuery;
  const clear = deps.clear ?? defaultMagnetPushLogsClear;
  const getAll = deps.getAll ?? defaultMagnetPushLogsGetAll;

  if (message.type === 'DB:MAGNET_PUSH_LOGS_ADD') {
    const entry = message?.payload?.entry;
    try {
      console.info('[115Trace] bg:magnet-log:add:received', {
        traceId: entry?.data?.traceId || entry?.data?.correlationId || '',
        correlationId: entry?.data?.correlationId || '',
        taskId: entry?.data?.taskId || '',
        type: entry?.type,
        videoId: entry?.videoId,
        action: entry?.data?.action,
      });
    } catch {}
    add(entry).then((id) => {
      try {
        console.info('[115Trace] bg:magnet-log:add:success', {
          traceId: entry?.data?.traceId || entry?.data?.correlationId || '',
          correlationId: entry?.data?.correlationId || '',
          taskId: entry?.data?.taskId || '',
          id,
          type: entry?.type,
          videoId: entry?.videoId,
        });
      } catch {}
      sendResponse({ success: true, id });
    })
      .catch((e) => {
        try {
          console.warn('[115Trace] bg:magnet-log:add:error', {
            traceId: entry?.data?.traceId || entry?.data?.correlationId || '',
            correlationId: entry?.data?.correlationId || '',
            taskId: entry?.data?.taskId || '',
            type: entry?.type,
            videoId: entry?.videoId,
            error: e?.message || String(e),
          });
        } catch {}
        sendResponse({ success: false, error: e?.message || 'magnet push log add failed' });
      });
    return true;
  }

  if (message.type === 'DB:MAGNET_PUSH_LOGS_BULK') {
    const entries = message?.payload?.entries || [];
    bulkAdd(entries).then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'magnet push log bulk add failed' }));
    return true;
  }

  if (message.type === 'DB:MAGNET_PUSH_LOGS_QUERY') {
    const payload = message?.payload || {};
    try { console.info('[115Trace] bg:magnet-log:query:received', payload); } catch {}
    query(payload).then((data) => {
      try {
        console.info('[115Trace] bg:magnet-log:query:success', {
          total: (data as any)?.total,
          items: Array.isArray((data as any)?.items) ? (data as any).items.length : -1,
          query: payload?.query || '',
          status: payload?.status || 'ALL',
          offset: payload?.offset,
          limit: payload?.limit,
        });
      } catch {}
      sendResponse({ success: true, ...data });
    })
      .catch((e) => {
        try { console.warn('[115Trace] bg:magnet-log:query:error', { error: e?.message || String(e), payload }); } catch {}
        sendResponse({ success: false, error: e?.message || 'magnet push log query failed' });
      });
    return true;
  }

  if (message.type === 'DB:MAGNET_PUSH_LOGS_CLEAR') {
    const beforeMs = message?.payload?.beforeMs;
    clear(beforeMs).then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'magnet push log clear failed' }));
    return true;
  }

  if (message.type === 'DB:MAGNET_PUSH_LOGS_EXPORT') {
    getAll().then((records) => sendResponse({ success: true, json: JSON.stringify(records) }))
      .catch((e) => sendResponse({ success: false, error: e?.message || 'magnet push log export failed' }));
    return true;
  }

  return false;
}
