/**
 * @file indexedDbSchema.ts
 * @description IndexedDB 数据库 Schema 定义 —— 使用 idb 库的 DBSchema 类型
 * @module platform/storage
 *
 * 数据库名：javdb-extension，版本号通过 migrations.ts 管理
 * 包含 12 个 object store：视频记录、清单、日志、演员、新作、磁力缓存等
 */
import type { DBSchema } from 'idb';
import type { ActorRecord, ListRecord, LogEntry, NewWorkRecord, VideoRecord } from '../../types';
import type { ReportMonthly, ViewsDaily } from '../../types/insights';

/** 索引最大安全数值（用于时间戳降序排列） */
export const MAX_INDEX_NUMBER = Number.MAX_SAFE_INTEGER;

/** 持久化日志条目 —— 比原始 LogEntry 多了时间戳毫秒值和来源标识 */
export interface PersistedLogEntry extends LogEntry {
  id?: number;                                        // 自增主键
  timestampMs: number;                                // 毫秒时间戳（用于排序和索引）
  timestampISO?: string;                              // ISO 格式时间戳
  source?: 'GENERAL' | 'DRIVE115';                    // 日志来源
  category?: string;                                  // 日志分类
}

/** 115 网盘推送日志条目 */
export interface PersistedMagnetPushLogEntry {
  id?: number;
  type: 'push_start' | 'push_success' | 'push_failed';
  videoId: string;
  message: string;
  timestamp: number;
  timestampMs: number;
  timestampISO?: string;
  source: 'DRIVE115';
  category: 'DRIVE115';
  data?: any;
}

/** 磁力链接缓存记录 —— 缓存搜索结果避免重复请求 */
export interface MagnetCacheRecord {
  key: string;                                        // 复合主键：`{source}:{videoId}:{hash}`
  videoId: string;
  source: string;                                     // 来源站点标识
  name: string;                                       // 资源名称
  magnet: string;                                     // 磁力链接
  size?: string;                                      // 文件大小（人类可读）
  sizeBytes?: number;                                 // 文件大小（字节）
  date?: string;                                      // 发布日期
  seeders?: number;                                   // 做种数
  leechers?: number;                                  // 下载数
  hasSubtitle?: boolean;                              // 是否有字幕
  quality?: string;                                   // 画质标签
  createdAt: number;
  expireAt?: number;                                  // 过期时间戳（用于自动清理）
}

/** 视频-标签关联索引（用于按标签查询已看视频） */
export interface ViewedTagIndexRecord {
  key: string;                                        // `{tag}:{videoId}`
  tag: string;
  videoId: string;
}

/** 视频-清单关联索引（用于按清单查询视频） */
export interface ViewedListIndexRecord {
  key: string;                                        // `{listId}:{videoId}`
  listId: string;
  videoId: string;
}

/** 新作品每日统计快照 */
export interface NewWorksDailyStat {
  date: string;                                       // YYYY-MM-DD
  total: number;
  unread: number;
}

/**
 * IndexedDB Schema 定义（idb 库的 DBSchema 接口）
 * 对应数据库 `javdb-extension`，共 12 个 object store
 */
export interface JavdbDB extends DBSchema {
  /** 已看视频记录（核心表） */
  viewedRecords: {
    key: string;
    value: VideoRecord;
    indexes: {
      by_status: string;
      by_updatedAt: number;
      by_createdAt: number;
      by_status_updatedAt: [string, number];
      by_status_createdAt: [string, number];
      by_favorite_updatedAt: [number, number];
      by_favorite_createdAt: [number, number];
      by_status_favorite_updatedAt: [string, number, number];
      by_status_favorite_createdAt: [string, number, number];
    };
  };
  viewedByTag: {
    key: string;
    value: ViewedTagIndexRecord;
    indexes: {
      by_tag: string;
      by_videoId: string;
    };
  };
  viewedByList: {
    key: string;
    value: ViewedListIndexRecord;
    indexes: {
      by_listId: string;
      by_videoId: string;
    };
  };
  lists: {
    key: string;
    value: ListRecord;
    indexes: {
      by_type: string;
      by_updatedAt: number;
      by_source: string;
    };
  };
  logs: {
    key: number;
    value: PersistedLogEntry;
    indexes: {
      by_timestamp: number;
      by_level: string;
      by_level_timestamp: [string, number];
      by_source_timestamp: [string, number];
      by_category_timestamp: [string, number];
    };
  };
  actors: {
    key: string;
    value: ActorRecord;
    indexes: {
      by_name: string;
      by_updatedAt: number;
      by_gender: string;
      by_category: string;
      by_blacklisted: number;
      by_createdAt: number;
    };
  };
  newWorks: {
    key: string;
    value: NewWorkRecord;
    indexes: {
      by_actorId: string;
      by_discoveredAt: number;
      by_status: string;
      by_isRead: number;
    };
  };
  magnets: {
    key: string;
    value: MagnetCacheRecord;
    indexes: {
      by_videoId: string;
      by_source: string;
      by_createdAt: number;
      by_expireAt: number;
    };
  };
  magnetPushLogs: {
    key: number;
    value: PersistedMagnetPushLogEntry;
    indexes: {
      by_timestamp: number;
      by_type: string;
      by_videoId: string;
    };
  };
  insightsViews: {
    key: string;
    value: ViewsDaily;
    indexes: {
      by_date: string;
    };
  };
  insightsReports: {
    key: string;
    value: ReportMonthly;
    indexes: {
      by_month: string;
      by_createdAt: number;
    };
  };
  newWorksDailyStats: {
    key: string;
    value: NewWorksDailyStat;
    indexes: Record<string, never>;
  };
}
