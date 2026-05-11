export type GlobalTaskStatus = 'registered' | 'queued' | 'leased' | 'running' | 'paused' | 'canceled' | 'done' | 'error';
export type GlobalTaskCost = 'light' | 'medium' | 'heavy';
export type GlobalTaskVisibilityPolicy = 'foreground_first' | 'background_allowed' | 'foreground_only';
export type GlobalTaskResumePolicy = 'restart' | 'resume' | 'cache_then_skip';

export interface GlobalTaskDescriptor {
  taskId: string;
  label: string;
  tabId: number;
  pageUrl: string;
  pageType: string;
  mainId: string;
  pageInstanceId: string;
  phase: string;
  priority: number;
  cost: GlobalTaskCost;
  visibilityPolicy: GlobalTaskVisibilityPolicy;
  timeoutMs: number;
  retryLimit: number;
  dedupeKey?: string;
  resumePolicy: GlobalTaskResumePolicy;
  createdAt: number;
}

export interface GlobalTaskRuntimeState {
  status: GlobalTaskStatus;
  waitReason?: string;
  startedAt?: number;
  endedAt?: number;
  retryCount: number;
  pauseCount: number;
  resumeCount: number;
  heartbeatTs?: number;
}

export interface GlobalTaskRecord {
  descriptor: GlobalTaskDescriptor;
  runtime: GlobalTaskRuntimeState;
}
