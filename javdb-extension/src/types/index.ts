// 移除未使用的导入
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
            hideInList: boolean;
            showBadge: boolean;
        };
    };

    webdav: {
        enabled: boolean;
        url: string;
        username: string;
        password: string;
        autoSync: boolean;
        syncInterval: number;
        retentionDays?: number;
        warningDays?: number;
        lastSync: string | null;
        backupRange?: {
            coreData: boolean;      // 核心数据：观看记录、用户资料
            actorData: boolean;     // 演员数据：演员库、演员订阅
            newWorksData: boolean;  // 新作品数据：新作品订阅和记录
            systemConfig: boolean;  // 系统配置：拓展设置、域名配置、搜索引擎等
            logsData: boolean;      // 日志数据：操作日志
        };
    };
    dataSync: {
        requestInterval: number;
        batchSize: number;
        maxRetries: number;
        urls: {
            wantWatch: string;
            watchedVideos: string;
            collectionActors: string;
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
        // 日志保留策略
        retentionDays?: number; // 按天数保留（0 或未设置表示关闭按天清理）
        // 统一控制台代理设置
        consoleLevel?: 'OFF' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
        consoleFormat?: {
            showTimestamp?: boolean;
            showSource?: boolean;
            showMilliseconds?: boolean;
            color?: boolean;
            timeZone?: string;
        };
        // 新的模块化日志配置
        logModules?: Record<string, boolean>; // key: 模块名（core/orchestrator/storage/actor/magnet/sync/drive115/privacy/ai/general/debug），value: 是否启用
        // 旧的控制台分类配置（向后兼容）
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

    // 磁力资源搜索配置
    magnetSearch?: {
        sources?: {
            sukebei: boolean;
            btdig: boolean;
            btsow: boolean;
            torrentz2: boolean;
            custom?: string[];
        };
        maxResults?: number;
        /** 单次请求超时时间（毫秒） */
        timeoutMs?: number;
        concurrency?: {
            /** 内容脚本页面内的并发请求数（PerformanceOptimizer.maxConcurrentRequests） */
            pageMaxConcurrentRequests?: number;
            /** 后台全局并发上限（所有标签页合计） */
            bgGlobalMaxConcurrent?: number;
            /** 后台按域并发上限 */
            bgPerHostMaxConcurrent?: number;
            /** 后台按域速率限制（请求/分钟） */
            bgPerHostRateLimitPerMin?: number;
        };
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
        // 新增：影片页增强控制开关
        enableWantSync?: boolean; // 点击“想看”时同步到本地番号库
        autoMarkWatchedAfter115?: boolean; // 115推送成功后自动标记“已看”
        // 新增：演员备注（Wiki/xslist）
        enableActorRemarks?: boolean; // 是否启用演员备注
        actorRemarksMode?: 'panel' | 'inline'; // 展示模式
        actorRemarksTTLDays?: number; // 缓存 TTL（天），0 表示不缓存
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
        // 新增：列表页演员状态水印
        enableActorWatermark?: boolean; // 启用在封面显示演员订阅/黑名单水印
        actorWatermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // 水印位置
        actorWatermarkOpacity?: number; // 水印不透明度（0-1）
        // 新增：基于演员偏好的过滤
        hideBlacklistedActorsInList?: boolean; // 隐藏含黑名单演员的作品
        hideNonFavoritedActorsInList?: boolean; // 隐藏未收藏演员的作品（按标题识别）
        treatSubscribedAsFavorited?: boolean; // 订阅视为已收藏
    };

    // 新增：演员页增强配置
    actorEnhancement: {
        enabled: boolean; // 启用演员页增强功能
        autoApplyTags: boolean; // 自动应用保存的tag过滤器
        defaultTags: string[]; // 默认应用的tags (如 ['s', 'd'])
        defaultSortType: number; // 默认排序类型
        // 新增：影片分段显示（仅演员页）
        enableTimeSegmentationDivider?: boolean; // 启用“影片分段显示”分隔线
        timeSegmentationMonths?: number; // 阈值（月），默认 6
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
        // 新增：右侧悬浮快捷按钮显示控制
        showQuickSearchCode?: boolean; // 显示“搜番号”按钮
        showQuickSearchActor?: boolean; // 显示“搜演员”按钮
    };

    // 新增：AI功能配置
    ai: AISettings;

    // 新增：报告（Insights）配置（仅本地聚合参数；无UI时使用默认值）
    insights?: {
        topN?: number; // Top 标签数量，默认 10
        changeThresholdRatio?: number; // 显著变化阈值（占比绝对变化），默认 0.08
        minTagCount?: number; // 噪声过滤最小计数，默认 3
        risingLimit?: number; // 上升标签最多展示条数，默认 5
        fallingLimit?: number; // 下降标签最多展示条数，默认 5
        // 统计状态口径（仅影响 compare 模式）
        // 'viewed' = 仅“已看”；'viewed_browsed' = “已看+已浏览”；'viewed_browsed_want' = “已看+已浏览+想看”
        statusScope?: 'viewed' | 'viewed_browsed' | 'viewed_browsed_want';
        // 数据源模式（待接入 compare 模式）
        source?: 'views' | 'compare' | 'auto';
        // 样本量不足回退阈值（compare 模式/auto 模式），默认 10
        minMonthlySamples?: number;
        // 自动月报（后台）控制项
        autoMonthlyEnabled?: boolean; // 是否启用按月自动生成（默认 false）
        autoCompensateOnStartupEnabled?: boolean; // 浏览器启动/扩展唤醒时是否自动补偿生成（默认 false）
        autoMonthlyMinuteOfDay?: number; // 触发分钟（0-1439），默认 10 → 00:10
        // 提示词自定义（前台编辑与持久化）
        prompts?: {
            persona?: 'doctor' | 'default';
            enableCustom?: boolean;
            systemOverride?: string;
            rulesOverride?: string;
        };
    };

    version: string;
    recordsPerPage?: number;
    // Dashboard 番号库：是否在列表中显示封面
    showCoversInRecords?: boolean;
    // 更新检查相关设置（用于 Dashboard 设置面板）
    autoUpdateCheck?: boolean; // 是否自动检查更新
    updateCheckInterval?: string; // 检查间隔（小时，字符串形式以匹配下拉值）
    includePrerelease?: boolean; // 是否包含预发布版本
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

export type VideoStatus = 'viewed' | 'browsed' | 'want' | 'untracked';

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
  listIds?: string[];
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

export interface ListRecord {
  id: string;
  name: string;
  type: 'mine' | 'favorite';
  url: string;
  moviesCount?: number;
  clickedCount?: number;
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
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