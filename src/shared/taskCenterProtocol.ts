import type { GlobalTaskDescriptor } from './taskCenterTypes';

export const TASK_CENTER_MESSAGE = {
  REGISTER: 'task-center:register',
  REQUEST_LEASE: 'task-center:request-lease',
  HEARTBEAT: 'task-center:heartbeat',
  PROGRESS: 'task-center:progress',
  PAUSE: 'task-center:pause',
  RESUME: 'task-center:resume',
  COMPLETE: 'task-center:complete',
  FAIL: 'task-center:fail',
  CANCEL: 'task-center:cancel',
  VISIBILITY: 'task-center:visibility',
  QUERY: 'task-center:query',
  CLEAR: 'task-center:clear'
} as const;

export interface RegisterTaskMessage {
  type: typeof TASK_CENTER_MESSAGE.REGISTER;
  payload: GlobalTaskDescriptor;
}

export interface RequestLeaseMessage {
  type: typeof TASK_CENTER_MESSAGE.REQUEST_LEASE;
  payload: { taskId: string };
}
