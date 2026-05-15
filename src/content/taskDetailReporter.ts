import { getPageContext } from './pageContext';
import { log } from './state';

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

export function saveSubtaskDetail(payload: SubtaskDetailPayload): Promise<boolean> {
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

      chrome.runtime.sendMessage(
        {
          type: 'orchestrator:saveTaskDetail',
          taskDetail,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            log('[TaskDetailReporter] send failed', {
              label: taskDetail.label,
              parentLabel: taskDetail.parentLabel,
              pageInstanceId: taskDetail.pageInstanceId,
              error: chrome.runtime.lastError.message,
            });
            resolve(false);
            return;
          }

          const success = response?.success !== false;
          log('[TaskDetailReporter] send done', {
            label: taskDetail.label,
            parentLabel: taskDetail.parentLabel,
            pageInstanceId: taskDetail.pageInstanceId,
            success,
          });
          resolve(success);
        }
      );
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
