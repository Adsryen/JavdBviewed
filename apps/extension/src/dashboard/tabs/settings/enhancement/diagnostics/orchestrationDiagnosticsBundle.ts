/**
 * @file orchestrationDiagnosticsBundle.ts
 * @description 编排中心诊断包构建（纯函数，便于单测与远程排障）
 * @module dashboard/tabs/settings/enhancement/diagnostics
 */

import { resolveTaskBucket } from '../../../../../platform/tasks/taskPolicy';

export const ORCHESTRATION_DIAGNOSTICS_SCHEMA_VERSION = 1;

export interface OrchestrationDiagnosticsBundle {
  schemaVersion: number;
  exportedAt: number;
  extensionVersion: string;
  meta?: {
    note?: string;
    userAgent?: string;
    branchHint?: string;
  };
  alarmDiagnostics?: Record<string, unknown>;
  taskCenter?: {
    tasks: Array<Record<string, unknown>>;
    taskCount: number;
    truncated: boolean;
  };
  taskDetails?: {
    records: Array<Record<string, unknown>>;
    recordCount: number;
    truncated: boolean;
  };
  orchestratorTimeline?: {
    items: Array<Record<string, unknown>>;
    itemCount: number;
    truncated: boolean;
  };
  errors?: string[];
}

export interface BuildOrchestrationDiagnosticsInput {
  extensionVersion: string;
  exportedAt?: number;
  alarmDiagnostics?: Record<string, unknown> | null;
  taskCenterTasks?: Array<Record<string, unknown>> | null;
  taskDetails?: Array<Record<string, unknown>> | null;
  orchestratorTimeline?: Array<Record<string, unknown>> | null;
  meta?: OrchestrationDiagnosticsBundle['meta'];
  limits?: {
    taskCenterMax?: number;
    taskDetailsMax?: number;
    timelineMax?: number;
  };
  errors?: string[];
}

const DEFAULT_LIMITS = {
  taskCenterMax: 200,
  taskDetailsMax: 300,
  timelineMax: 200,
};

/** 瘦身全局任务中心条目，便于粘贴 */
export function thinTaskCenterTask(task: Record<string, unknown>): Record<string, unknown> {
  const label = String(task.label || task?.descriptor && (task as any).descriptor?.label || '');
  const bucket =
    typeof task.bucket === 'string'
      ? task.bucket
      : label
        ? resolveTaskBucket(label)
        : undefined;
  return {
    taskId: task.taskId ?? (task as any).descriptor?.taskId,
    label: label || task.label,
    status: task.status ?? (task as any).runtime?.status,
    phase: task.phase ?? (task as any).descriptor?.phase,
    priority: task.priority ?? (task as any).descriptor?.priority,
    bucket,
    waitReason: task.waitReason ?? (task as any).runtime?.waitReason,
    visibilityPolicy: task.visibilityPolicy ?? (task as any).descriptor?.visibilityPolicy,
    shareScope: task.shareScope ?? (task as any).descriptor?.shareScope,
    executionClass: task.executionClass ?? (task as any).descriptor?.executionClass,
    tabId: task.tabId ?? (task as any).descriptor?.tabId,
    pageUrl: task.pageUrl ?? (task as any).descriptor?.pageUrl,
    pageInstanceId: task.pageInstanceId ?? (task as any).descriptor?.pageInstanceId,
    retryCount: task.retryCount ?? (task as any).runtime?.retryCount,
    heartbeatTs: task.heartbeatTs ?? (task as any).runtime?.heartbeatTs,
    createdAt: task.createdAt ?? (task as any).descriptor?.createdAt,
  };
}

/** 规范化明细：补 bucket / queueAgeMs */
export function enrichTaskDetailRecord(detail: Record<string, unknown>): Record<string, unknown> {
  const label = String(detail.label || '');
  const bucket =
    typeof detail.bucket === 'string' && detail.bucket
      ? detail.bucket
      : label
        ? resolveTaskBucket(label)
        : undefined;

  const registeredAt = typeof detail.registeredAt === 'number' ? detail.registeredAt : 0;
  const startedAt = typeof detail.startedAt === 'number' ? detail.startedAt : 0;
  let queueAgeMs = typeof detail.queueAgeMs === 'number' ? detail.queueAgeMs : undefined;
  if (queueAgeMs == null && registeredAt > 0 && startedAt > 0) {
    queueAgeMs = Math.max(0, startedAt - registeredAt);
  }

  return {
    ...detail,
    ...(bucket ? { bucket } : {}),
    ...(queueAgeMs != null ? { queueAgeMs } : {}),
  };
}

export function buildOrchestrationDiagnosticsBundle(
  input: BuildOrchestrationDiagnosticsInput,
): OrchestrationDiagnosticsBundle {
  const limits = { ...DEFAULT_LIMITS, ...(input.limits || {}) };
  const exportedAt = typeof input.exportedAt === 'number' ? input.exportedAt : Date.now();
  const errors = [...(input.errors || [])];

  const centerAll = Array.isArray(input.taskCenterTasks) ? input.taskCenterTasks : [];
  const centerSlice = centerAll.slice(0, limits.taskCenterMax).map((t) => thinTaskCenterTask(t || {}));

  const detailsAll = Array.isArray(input.taskDetails) ? input.taskDetails : [];
  // 假定调用方已按时间倒序；再截断
  const detailsSlice = detailsAll
    .slice(0, limits.taskDetailsMax)
    .map((d) => enrichTaskDetailRecord(d || {}));

  const timelineAll = Array.isArray(input.orchestratorTimeline) ? input.orchestratorTimeline : [];
  const timelineSlice = timelineAll.slice(0, limits.timelineMax);

  const bundle: OrchestrationDiagnosticsBundle = {
    schemaVersion: ORCHESTRATION_DIAGNOSTICS_SCHEMA_VERSION,
    exportedAt,
    extensionVersion: String(input.extensionVersion || 'unknown'),
  };

  if (input.meta) bundle.meta = input.meta;
  if (input.alarmDiagnostics && typeof input.alarmDiagnostics === 'object') {
    bundle.alarmDiagnostics = input.alarmDiagnostics;
  }
  if (centerAll.length > 0 || input.taskCenterTasks) {
    bundle.taskCenter = {
      tasks: centerSlice,
      taskCount: centerAll.length,
      truncated: centerAll.length > limits.taskCenterMax,
    };
  }
  if (detailsAll.length > 0 || input.taskDetails) {
    bundle.taskDetails = {
      records: detailsSlice,
      recordCount: detailsAll.length,
      truncated: detailsAll.length > limits.taskDetailsMax,
    };
  }
  if (timelineAll.length > 0) {
    bundle.orchestratorTimeline = {
      items: timelineSlice,
      itemCount: timelineAll.length,
      truncated: timelineAll.length > limits.timelineMax,
    };
  }
  if (errors.length > 0) bundle.errors = errors;

  return bundle;
}

export function stringifyDiagnosticsBundle(bundle: OrchestrationDiagnosticsBundle): string {
  return JSON.stringify(bundle, null, 2);
}
