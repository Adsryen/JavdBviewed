// src/features/actors/index.ts
// 演员库功能模块统一导出

export { ActorManager, actorManager } from './actorManager';
export { ActorSyncService, actorSyncService } from './actorSync';
export type {
  ActorPagedSearchResult,
  ActorRecord,
  ActorSearchResult,
  ActorSyncConfig,
  ActorSyncProgress,
  ActorSyncResult,
} from '../../types';
