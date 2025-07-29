import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";
import type { Drive115Settings } from "../services/drive115/types";

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
    dataSync: {
        requestInterval: number; // 请求间隔（秒），用于缓解服务器压力
        batchSize: number; // 批量处理大小
        maxRetries: number; // 最大重试次数
        urls: {
            wantWatch: string; // 想看视频列表URL
            watchedVideos: string; // 已看视频列表URL
            collectionActors: string; // 收藏演员列表URL
        };
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
    drive115: Drive115Settings; // 115网盘配置

    // 新增：数据增强配置
    dataEnhancement: {
        enableMultiSource: boolean; // 启用多数据源获取
        enableImageCache: boolean; // 启用图片缓存
        enableVideoPreview: boolean; // 启用视频预览
        enableTranslation: boolean; // 启用标题翻译
        enableRatingAggregation: boolean; // 启用评分聚合
        enableActorInfo: boolean; // 启用演员信息获取
        cacheExpiration: number; // 缓存过期时间（小时）
    };

    // 新增：用户体验配置
    userExperience: {
        enableQuickCopy: boolean; // 启用快捷复制
        enableContentFilter: boolean; // 启用内容过滤
        enableKeyboardShortcuts: boolean; // 启用键盘快捷键
        enableMagnetSearch: boolean; // 启用磁力搜索
        showEnhancedTooltips: boolean; // 显示增强提示
    };

    // 新增：内容过滤配置
    contentFilter: {
        enabled: boolean;
        rules: FilterRule[];
        highlightRules: FilterRule[];
    };

    version: string;
    recordsPerPage?: number;
}

// 新增：过滤规则接口
export interface FilterRule {
    id: string;
    type: 'code' | 'title' | 'tags' | 'score' | 'actor' | 'studio';
    pattern: string;
    isRegex: boolean;
    action: 'hide' | 'highlight';
    enabled: boolean;
    createdAt: number;
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

  // 新增：增强数据字段
  enhancedData?: {
    coverImage?: string; // 高质量封面图
    previewVideo?: string; // 预览视频链接
    translatedTitle?: string; // 翻译后的标题
    ratings?: EnhancedRating[]; // 多源评分数据
    actors?: EnhancedActor[]; // 演员信息
    studio?: string; // 制作商
    series?: string; // 系列
    genre?: string[]; // 类别标签
    magnets?: EnhancedMagnet[]; // 磁力链接
    lastEnhanced?: number; // 最后增强时间
  };
}

// 新增：增强评分接口
export interface EnhancedRating {
  source: string; // 评分来源 (JavDB, JavLibrary, DMM等)
  score: number; // 评分
  total: number; // 总分
  count?: number; // 评分人数
  url?: string; // 评分页面链接
}

// 新增：增强演员接口
export interface EnhancedActor {
  name: string; // 演员姓名
  avatar?: string; // 头像链接
  profileUrl?: string; // 个人页面链接
  aliases?: string[]; // 别名
}

// 新增：增强磁力链接接口
export interface EnhancedMagnet {
  name: string; // 文件名
  link: string; // 磁力链接
  size: string; // 文件大小
  sizeBytes: number; // 文件大小（字节）
  date: string; // 发布日期
  source: string; // 来源站点
  hasSubtitle: boolean; // 是否有字幕
  quality?: string; // 画质信息
  format?: string; // 格式信息
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