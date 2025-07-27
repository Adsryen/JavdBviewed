import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";

export interface ExtensionSettings {
    display: {
        hideViewed: boolean;
        hideBrowsed: boolean;
        hideVR: boolean;
    };
    webdav: {
        enabled: boolean;
        url: string;
        username: string;
        password: string;
        autoSync: boolean;
        syncInterval: number;
        lastSync: string | null;
    };
    searchEngines: {
        id: string;
        name: string;
        urlTemplate: string;
        icon: string;
    }[];
    logging: {
        maxLogEntries: number;
    };
    version: string;
    recordsPerPage?: number;
}

export type VideoStatus = 'viewed' | 'browsed' | 'want';

/**
 * @deprecated Use VideoRecord instead
 */
export interface OldVideoRecord {
  id: string;
  title?: string; // Add optional title
  status: 'viewed' | 'unviewed';
  tags?: string[];
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export interface VideoRecord {
  id: string; // 番号 (唯一标识)
  title: string; // 标题
  status: VideoStatus; // 观看状态
  tags: string[]; // 标签
  createdAt: number; // 创建时间 (Unix timestamp)
  updatedAt: number; // 最后更新时间 (Unix timestamp)
  releaseDate?: string; // 发行日期 (可选)
  javdbUrl?: string; // 对应JavDB页面的URL
  javdbImage?: string; // 封面图片链接 (可选)
}

export interface UserProfile {
  email: string; // 邮箱地址
  username: string; // 用户名
  userType: string; // 用户类型
  isLoggedIn: boolean; // 是否已登录
  lastUpdated?: number; // 最后更新时间 (Unix timestamp)
  serverStats?: UserServerStats; // 服务器端统计数据
}

export interface UserServerStats {
  wantCount: number; // 想看数量
  watchedCount: number; // 看过数量
  listsCount?: number; // 清单数量（可选）
  lastSyncTime: number; // 最后同步时间
}