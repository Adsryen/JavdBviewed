/**
 * @file index.ts
 * @description 演员管理（CRUD、搜索、同步）统一导出
 * @module features/actors
 */
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
