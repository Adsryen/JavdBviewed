import { TASK_CENTER_MESSAGE } from '../../shared/taskCenterProtocol';

export async function fetchGlobalTaskState(): Promise<any> {
  try {
    return await chrome.runtime.sendMessage({ type: TASK_CENTER_MESSAGE.QUERY });
  } catch (error) {
    return { tasks: [], error: String(error) };
  }
}
