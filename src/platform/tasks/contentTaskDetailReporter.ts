import { getPageContext } from '../browser/pageContext';

export interface SubtaskDetailPayload {
  label: string;
  taskId?: string;
  parentTaskId?: string;
  rootTaskId?: string;
  correlationId?: string;
  phase: string;
  status: 'done' | 'error';
  durationMs: number;
  pageUrl?: string;
  timestamp?: number;
  error?: string;
  tabId?: number;
  mainId?: string;
  pageType?: string;
  pageInstanceId?: string;
  parentLabel?: string;
  subtaskLabel?: string;
  batchIndex?: number;
  itemCount?: number;
  detail?: string;
  registrationSource?: 'blueprint' | 'runtime';
}

export interface ContentTaskDetailReporterOptions {
  log?: (...args: any[]) => void;
}

function defaultLog(...args: any[]): void {
  try {
    const verbose = typeof window !== 'undefined' && (window as any).__JDB_VERBOSE;
    if (verbose !== false) {
      console.log('[JavDB Ext]', ...args);
    }
  } catch {
    console.log('[JavDB Ext]', ...args);
  }
}

export function saveSubtaskDetail(
  payload: SubtaskDetailPayload,
  options: ContentTaskDetailReporterOptions = {},
): Promise<boolean> {
  const log = options.log || defaultLog;

  return new Promise<boolean>((resolve) => {
    try {
      const pageContext = getPageContext(payload.pageUrl);
      const taskDetail = {
        ...payload,
        pageUrl: payload.pageUrl || pageContext.pageUrl,
        pageType: payload.pageType || pageContext.pageType,
        mainId: payload.mainId || pageContext.mainId,
        pageInstanceId: payload.pageInstanceId || pageContext.pageInstanceId,
        timestamp: payload.timestamp || Date.now(),
      };

      if (!(typeof chrome !== 'undefined' && chrome.runtime?.sendMessage)) {
        log('[TaskDetailReporter] runtime unavailable', {
          label: taskDetail.label,
          parentLabel: taskDetail.parentLabel,
          pageInstanceId: taskDetail.pageInstanceId,
        });
        resolve(false);
        return;
      }

      log('[TaskDetailReporter] sending', {
        label: taskDetail.label,
        parentLabel: taskDetail.parentLabel,
        pageInstanceId: taskDetail.pageInstanceId,
        mainId: taskDetail.mainId,
      });

      chrome.runtime.sendMessage({
        type: 'orchestrator:saveTaskDetail',
        taskDetail,
      });

      log('[TaskDetailReporter] send done', {
        label: taskDetail.label,
        parentLabel: taskDetail.parentLabel,
        pageInstanceId: taskDetail.pageInstanceId,
        success: true,
      });
      resolve(true);
    } catch (error: any) {
      log('[TaskDetailReporter] send exception', {
        label: payload?.label,
        parentLabel: payload?.parentLabel,
        error: error?.message || String(error),
      });
      resolve(false);
    }
  });
}
