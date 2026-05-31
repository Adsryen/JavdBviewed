import { TASK_CENTER_MESSAGE } from '../../shared/taskCenterProtocol';

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
      getActiveTaskIds?.();
    } catch {}
  };

  document.addEventListener('visibilitychange', report);
  report();
}
