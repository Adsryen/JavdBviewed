export interface SubtaskDetailPayload {
  label: string;
  phase: string;
  status: 'done' | 'error';
  durationMs: number;
  pageUrl?: string;
  timestamp?: number;
  error?: string;
  parentLabel?: string;
  subtaskLabel?: string;
  batchIndex?: number;
  itemCount?: number;
  detail?: string;
}

export function saveSubtaskDetail(payload: SubtaskDetailPayload): void {
  try {
    const taskDetail = {
      ...payload,
      pageUrl: payload.pageUrl || window.location.href,
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
