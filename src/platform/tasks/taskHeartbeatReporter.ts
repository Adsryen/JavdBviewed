import { TASK_CENTER_MESSAGE } from '../../shared/taskCenterProtocol';

export function installTaskHeartbeatReporter(taskIds: () => string[]): void {
  const tick = () => {
    try {
      for (const taskId of taskIds()) {
        chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.HEARTBEAT, payload: { taskId } });
      }
    } catch {}
  };
  window.setInterval(tick, 5000);
  tick();
}
