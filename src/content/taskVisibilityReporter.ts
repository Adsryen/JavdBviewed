import { TASK_CENTER_MESSAGE } from '../shared/taskCenterProtocol';
import { pauseManagedTask, resumeManagedTask } from './taskRuntime';

export function installTaskVisibilityReporter(getActiveTaskIds?: () => string[]): void {
  const report = () => {
    try {
      const visible = document.visibilityState === 'visible';
      chrome.runtime.sendMessage({
        type: TASK_CENTER_MESSAGE.VISIBILITY,
        payload: {
          visible,
          pageUrl: window.location.href,
        },
      });
      const taskIds = getActiveTaskIds?.() || [];
      if (taskIds.length > 0) {
        if (visible) {
          taskIds.forEach(taskId => { resumeManagedTask(taskId).catch(() => {}); });
        } else {
          taskIds.forEach(taskId => { pauseManagedTask(taskId, 'tab-hidden').catch(() => {}); });
        }
      }
    } catch {}
  };

  document.addEventListener('visibilitychange', report);
  report();
}
