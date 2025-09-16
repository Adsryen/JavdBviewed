import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";
import type { Drive115Settings } from "../services/drive115/types";
import type { PrivacyConfig } from "./privacy";
import type { AISettings } from "./ai";

export interface ExtensionSettings {
    display: {
        hideViewed: boolean;
        hideBrowsed: boolean;
        hideVR: boolean;
        hideWant?: boolean;
    };
    // 演员库相关设置
    actorLibrary: {
        blacklist: {
            hideInList: boolean; // 默认在演员库隐藏拉黑
            showBadge: boolean;  // 非隐藏时显示角标
        };
    };

    webdav: {
        enabled: boolean;
        url: string;
        username: string;
        password: string;
        autoSync: boolean;
        syncInterval: number;
        // 新增：保留备份天数，用于自动清理过期备份
        retentionDays?: number;
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
        verboseMode?: boolean; // 详细日志模式
        showPrivacyLogs?: boolean; // 显示隐私相关日志
        showStorageLogs?: boolean; // 显示存储相关日志
        // 统一控制台代理设置
        consoleLevel?: 'OFF' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
        consoleFormat?: {
            showTimestamp?: boolean;
            showSource?: boolean;
            color?: boolean;
            timeZone?: string;
        };
        consoleCategories?: Record<string, boolean>; // key: 类别名（core/orchestrator/drive115/privacy/magnet/actor/storage/general），value: 是否启用
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

    // 新增：翻译服务配置
    translation: {
        provider: 'traditional' | 'ai'; // 翻译服务提供商类型
        traditional: {
            service: 'google' | 'baidu' | 'youdao'; // 传统翻译服务
            apiKey?: string; // API密钥（百度、有道需要）
            sourceLanguage: string; // 源语言
            targetLanguage: string; // 目标语言
        };
        ai: {
            useGlobalModel: boolean; // 是否使用全局AI模型
            customModel?: string; // 自定义模型（当不使用全局模型时）
        };
        // 新增：显示方式与目标位置
        displayMode?: 'append' | 'replace'; // 展示方式：追加显示或替换原标题
        targets?: {
            currentTitle?: boolean; // 是否对影片页 .current-title 进行翻译
        };
    };

    // 新增：用户体验配置
    userExperience: {
        enableQuickCopy: boolean; // 启用快捷复制
        enableContentFilter: boolean; // 启用内容过滤
        enableKeyboardShortcuts: boolean; // 启用键盘快捷键
        enableMagnetSearch: boolean; // 启用磁力搜索
        enableAnchorOptimization: boolean; // 启用锚点优化
        enableListEnhancement: boolean; // 启用列表增强
        enableActorEnhancement: boolean; // 启用演员页增强
        showEnhancedTooltips: boolean; // 显示增强提示
    };

    // 新增：影片页增强配置
    videoEnhancement: {
        enabled: boolean; // 启用影片页增强
        enableCoverImage: boolean; // 启用高质量封面
        enableTranslation: boolean; // 启用标题定点翻译
        enableRating: boolean; // 启用评分信息
        enableActorInfo: boolean; // 启用演员信息
        showLoadingIndicator: boolean; // 显示加载指示器
        enableReviewBreaker: boolean; // 启用破解评论区
        enableFC2Breaker: boolean; // 启用破解FC2拦截
    };

    // 新增：内容过滤配置
    contentFilter: {
        enabled: boolean;
        keywordRules: KeywordFilterRule[];
    };

    // 新增：锚点优化配置
    anchorOptimization: {
        enabled: boolean;
        showPreviewButton: boolean;
        buttonPosition: 'right-center' | 'right-bottom';
    };

    // 新增：列表增强配置
    listEnhancement: {
        enabled: boolean;
        enableClickEnhancement: boolean; // 启用点击增强（左键直接打开，右键后台打开）
        enableVideoPreview: boolean; // 启用视频预览
        enableScrollPaging: boolean; // 启用滚动翻页
        enableListOptimization: boolean; // 启用列表优化
        previewDelay: number; // 预览延迟时间（毫秒）
        previewVolume: number; // 预览音量（0-1）
        enableRightClickBackground: boolean; // 启用右键后台打开
        preferredPreviewSource?: 'auto' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl'; // 预览来源优先
    };

    // 新增：演员页增强配置
    actorEnhancement: {
        enabled: boolean; // 启用演员页增强功能
        autoApplyTags: boolean; // 自动应用保存的tag过滤器
        defaultTags: string[]; // 默认应用的tags (如 ['s', 'd'])
        defaultSortType: number; // 默认排序类型
    };

    // 新增：Emby增强配置
    emby: {
        enabled: boolean; // 启用Emby增强功能
        matchUrls: string[]; // 匹配的网址模式，支持通配符
        videoCodePatterns: string[]; // 番号识别正则表达式模式
        linkBehavior: 'javdb-direct' | 'javdb-search'; // 链接行为：直接跳转或搜索
        enableAutoDetection: boolean; // 启用自动检测番号
        highlightStyle: {
            backgroundColor: string; // 高亮背景色
            color: string; // 文字颜色
            borderRadius: string; // 圆角
            padding: string; // 内边距
        };
    };

    // 新增：AI功能配置
    ai: AISettings;

    version: string;
    recordsPerPage?: number;
}

// 新增：关键字过滤规则接口
export interface KeywordFilterRule {
    id: string;
    name: string;
    keyword: string;
    isRegex: boolean;
    caseSensitive: boolean;
    action: 'hide' | 'highlight' | 'blur' | 'mark';
    enabled: boolean;
    fields: ('title' | 'actor' | 'studio' | 'genre' | 'tag' | 'video-id')[];
    style?: {
        backgroundColor?: string;
        color?: string;
        border?: string;
        opacity?: number;
        filter?: string;
    };
    message?: string;
    createdAt?: number;
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
  // 本地偏好：是否拉黑
  blacklisted?: boolean;

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

// 新作品功能相关类型定义已移动到 services/newWorks/types.ts
// 为了保持向后兼容，这里重新导出新作品相关类型
export type {
  ActorSubscription,
  NewWorksGlobalConfig,
  NewWorkRecord,
  NewWorksStats,
  NewWorksSearchResult
} from '../services/newWorks/types';