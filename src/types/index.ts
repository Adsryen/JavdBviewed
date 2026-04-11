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
  // 手动编辑锁定的字段列表
  manuallyEditedFields?: string[];
  // Wiki数据
  wikiData?: {
    age?: number;
    heightCm?: number;
    cup?: string;
    retired?: boolean;
    ig?: string;
    tw?: string;
    wikiUrl?: string;
    xslistUrl?: string;
    source?: 'wikipedia' | 'xslist';
    fetchedAt?: number;
  };
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
 * 演员分页搜索结果
 */
export interface ActorPagedSearchResult {
  actors: ActorRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
// 清单相关类型
// ============================================================

/**
 * 清单记录
 */
export interface ListRecord {
  id: string;
  name: string;
  /** 清单类型：'mine' = 我的清单，'favorite' = 收藏清单，'local' = 本地自定义清单 */
  type: 'mine' | 'favorite' | 'local';
  /**
   * 清单来源：
   * - 'javdb'：从 JavDB 同步的清单（默认值，兼容旧数据）
   * - 'local'：用户在扩展内手动创建的本地清单
   */
  source: 'javdb' | 'local';
  moviesCount?: number;
  clickedCount?: number;
  url?: string;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// 视频记录相关类型
// ============================================================

/** 视频状态类型 */
export type VideoStatus = 'viewed' | 'browsed' | 'want' | 'untracked';

/**
 * 视频记录
 */
export interface VideoRecord {
  id: string;
  title: string;
  status: VideoStatus;
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
  // 手动编辑锁定的字段列表
  manuallyEditedFields?: string[];
  // 扩展字段
  videoCode?: string;
  duration?: number;
  director?: string;
  directorUrl?: string;
  maker?: string;
  makerUrl?: string;
  publisher?: string;
  publisherUrl?: string;
  series?: string;
  seriesUrl?: string;
  ratingCount?: number;
  wantToWatchCount?: number;
  watchedCount?: number;
  categories?: string[];
  userRating?: number;
  userNotes?: string;
  isFavorite?: boolean;
  /** 该视频所属的清单 ID 列表 */
  listIds?: string[];
  /** 收藏时间戳 */
  favoritedAt?: number;
  /** 增强数据（封面等） */
  enhancedData?: { coverImage?: string; [key: string]: any };
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
// 内容过滤相关类型
// ============================================================

/**
 * 关键字过滤规则
 */
export interface KeywordFilterRule {
  id: string;
  name: string;
  keyword: string;
  isRegex: boolean;
  caseSensitive: boolean;
  action: 'hide' | 'highlight' | 'blur' | 'mark';
  enabled: boolean;
  fields: ('title' | 'actor' | 'studio' | 'genre' | 'tag' | 'video-id' | 'release-date')[];
  style?: {
    backgroundColor?: string;
    color?: string;
    border?: string;
    opacity?: number;
    filter?: string;
  };
  message?: string;
  // 发行日期范围过滤
  releaseDateRange?: {
    enabled: boolean;
    comparison?: 'between' | 'before' | 'after' | 'exact'; // 对比方式
    startDate?: string; // YYYY-MM-DD 格式，用于 between 和 after
    endDate?: string;   // YYYY-MM-DD 格式，用于 between 和 before
    exactDate?: string; // YYYY-MM-DD 格式，用于 exact
  };
}

/**
 * 内容过滤配置
 */
export interface ContentFilterConfig {
  enabled: boolean;
  showFilteredCount: boolean;
  keywordRules: KeywordFilterRule[];
}

// ============================================================
// 用户资料相关类型
// ============================================================

/**
 * 用户资料
 */
export interface UserProfile {
  email: string;
  username: string;
  userType: string;
  isLoggedIn: boolean;
  lastUpdated: number;
  serverStats?: {
    wantCount: number;
    watchedCount: number;
    lastSyncTime: number;
  };
}

// ============================================================
// 导出其他类型模块
// ============================================================

export * from './ai';
export * from './insights';
export * from './privacy';
