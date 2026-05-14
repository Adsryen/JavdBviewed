import { getPageContext } from './pageContext';

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
}

export function saveSubtaskDetail(payload: SubtaskDetailPayload): void {
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
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'orchestrator:saveTaskDetail',
        taskDetail,
      }, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
    }
  } catch {}
}
