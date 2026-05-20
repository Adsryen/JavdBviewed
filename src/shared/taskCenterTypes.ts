export type GlobalTaskStatus = 'registered' | 'queued' | 'leased' | 'running' | 'paused' | 'canceled' | 'done' | 'error';
export type GlobalTaskCost = 'light' | 'medium' | 'heavy';
export type GlobalTaskVisibilityPolicy = 'foreground_first' | 'background_allowed' | 'foreground_only';
export type GlobalTaskResumePolicy = 'restart' | 'resume' | 'cache_then_skip';

export interface GlobalTaskDescriptor {
  taskId: string;
  label: string;
  parentTaskId?: string;
  rootTaskId?: string;
  correlationId?: string;
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
  registrationSource?: 'blueprint' | 'runtime';
  resumePolicy: GlobalTaskResumePolicy;
  dependsOn?: string[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface GlobalTaskRuntimeState {
  status: GlobalTaskStatus;
  waitReason?: string;
  startedAt?: number;
  endedAt?: number;
  lastProgressAt?: number;
  progressPct?: number;
  stage?: string;
  stageStartedAt?: number;
  stageDurationMs?: number;
  detail?: string;
  retryCount: number;
  pauseCount: number;
  resumeCount: number;
  heartbeatTs?: number;
}

export interface GlobalTaskRecord {
  descriptor: GlobalTaskDescriptor;
  runtime: GlobalTaskRuntimeState;
}
