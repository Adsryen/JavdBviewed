import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";
import type { Drive115Settings } from "../services/drive115/types";
import type { PrivacyConfig } from "./privacy";

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

    // 新增：演员同步配置
    actorSync: ActorSyncConfig;

    // 新增：隐私保护配置
    privacy: PrivacyConfig;

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

// 演员相关类型定义
export interface ActorRecord {
  id: string; // 演员唯一标识 (通常是JavDB的演员ID)
  name: string; // 主要艺名
  aliases: string[]; // 其他艺名/别名
  gender: 'female' | 'male' | 'unknown'; // 性别
  category: 'censored' | 'uncensored' | 'western' | 'unknown'; // 分类：有码、无码、欧美
  avatarUrl?: string; // 头像地址
  profileUrl?: string; // 演员详情页地址
  worksUrl?: string; // 作品列表页地址
  createdAt: number; // 创建时间 (Unix timestamp)
  updatedAt: number; // 最后更新时间 (Unix timestamp)

  // 可选的详细信息
  details?: {
    birthDate?: string; // 生日
    height?: number; // 身高 (cm)
    measurements?: string; // 三围
    bloodType?: string; // 血型
    hometown?: string; // 出身地
    hobbies?: string[]; // 兴趣爱好
    debut?: string; // 出道时间
    retired?: boolean; // 是否已退役
    worksCount?: number; // 作品数量
    lastWorkDate?: string; // 最后作品时间
  };

  // 同步相关信息
  syncInfo?: {
    source: 'javdb' | 'manual'; // 数据来源
    lastSyncAt?: number; // 最后同步时间
    syncStatus: 'success' | 'failed' | 'pending'; // 同步状态
    errorMessage?: string; // 错误信息
  };
}

// 演员搜索结果
export interface ActorSearchResult {
  actors: ActorRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 演员同步配置
export interface ActorSyncConfig {
  enabled: boolean; // 是否启用演员同步
  autoSync: boolean; // 是否自动同步
  syncInterval: number; // 同步间隔 (分钟)
  batchSize: number; // 批量处理大小
  maxRetries: number; // 最大重试次数
  requestInterval: number; // 请求间隔 (秒)
  urls: {
    collectionActors: string; // 收藏演员列表URL
    actorDetail: string; // 演员详情页URL模板
  };
}

// 演员同步进度
export interface ActorSyncProgress {
  stage: 'pages' | 'details' | 'complete' | 'error';
  current: number;
  total: number;
  percentage: number;
  message: string;
  errors?: string[];
  stats?: {
    currentPage?: number;
    totalProcessed?: number;
    newActors?: number;
    updatedActors?: number;
    skippedActors?: number;
    currentPageActors?: number;
    currentPageProgress?: number;
    currentPageTotal?: number;
  };
}

// 演员同步结果
export interface ActorSyncResult {
  success: boolean;
  syncedCount: number;
  skippedCount: number;
  errorCount: number;
  newActors: number;
  updatedActors: number;
  errors: string[];
  duration: number; // 同步耗时 (毫秒)
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