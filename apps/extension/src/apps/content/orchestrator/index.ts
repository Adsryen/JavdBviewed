/**
 * @file index.ts
 * @description Content Script 入口层 —— 页面启动、消息路由、编排器统一导出
 * @module apps/content
 */
export * from './initOrchestrator';
export type {
  InitPhase,
  InitTask,
  InitTaskOptions,
  ManagedScheduledTask,
  ScheduledTask,
  TaskBlueprint,
  TaskDeferredError,
  TaskDependencyDeferredError,
} from './types';
export {
  type InstallOrchestratorDashboardMetricsMessagesOptions,
  installOrchestratorDashboardMetricsMessages,
} from './dashboardMetricsMessages';
export { runHighPhaseTasks } from './highPhaseScheduler';
export {
  createInitialOrchestratorMetrics,
  OrchestratorMetricsState,
  type OrchestratorMetricsSnapshot,
} from './metrics';
export {
  type InstallOrchestratorPageLifecycleBindingsOptions,
  installOrchestratorPageLifecycleBindings,
} from './pageLifecycleBindings';
export { OrchestratorRetryTimers } from './retryTimers';
export {
  createDeferredRetryKey,
  createTaskKey,
  getDeferredRetryDelayMs,
  getDependencyWaitLimitMs,
  getHiddenIdleDelayMs,
  getPhaseTaskCost,
  isDeferredWaitReason,
  partitionTasksByDependencyReadiness,
  sortTasksByPriority,
} from './schedulingRules';
