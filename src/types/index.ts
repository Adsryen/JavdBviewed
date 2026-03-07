// src/types/index.ts
// 全局类型定义

// ============================================================
// 演员相关类型
// ============================================================

/**
 * 演员记录
 */
export interface ActorRecord {
  id: string;
  name: string;
  aliases: string[];
  gender: 'male' | 'female' | 'unknown';
  category: 'unknown' | string;
  avatarUrl?: string;
  profileUrl: string;
  createdAt: number;
  updatedAt: number;
  syncInfo?: {
    source: string;
    lastSyncAt: number;
    syncStatus: 'success' | 'error' | 'pending';
  };
  details?: {
    worksCount?: number;
  };
  blacklisted?: boolean;
}

/**
 * 演员搜索结果
 */
export interface ActorSearchResult {
  id: string;
  name: string;
  aliases: string[];
  avatarUrl?: string;
  profileUrl: string;
}

/**
 * 演员同步配置
 */
export interface ActorSyncConfig {
  forceUpdate?: boolean;
  onProgress?: (progress: ActorSyncProgress) => void;
}

/**
 * 演员同步进度
 */
export interface ActorSyncProgress {
  stage: 'init' | 'syncing' | 'complete' | 'error';
  current: number;
  total: number;
  percentage: number;
  message: string;
  stats?: {
    currentPage: number;
    totalProcessed: number;
    newActors: number;
    updatedActors: number;
    skippedActors: number;
  };
  errors?: string[];
}

/**
 * 演员同步结果
 */
export interface ActorSyncResult {
  success: boolean;
  syncedCount: number;
  newActors: number;
  updatedActors: number;
  skippedCount: number;
  errors: string[];
  duration: number;
}

// ============================================================
// 视频记录相关类型
// ============================================================

/**
 * 视频记录
 */
export interface VideoRecord {
  id: string;
  title: string;
  status: 'viewed' | 'browsed' | 'want';
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  releaseDate?: string;
  javdbUrl?: string;
  javdbImage?: string;
  coverImage?: string;
  actors?: string[];
  genres?: string[];
  rating?: number;
  notes?: string;
}

// ============================================================
// 扩展设置相关类型
// ============================================================

/**
 * 扩展设置（占位类型，实际定义在各个模块中）
 */
export interface ExtensionSettings {
  [key: string]: any;
}

// ============================================================
// 导出其他类型模块
// ============================================================

export * from './ai';
export * from './insights';
export * from './privacy';
