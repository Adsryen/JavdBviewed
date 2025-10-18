import { ExtensionSettings, KeywordFilterRule, ActorSyncConfig, NewWorksGlobalConfig } from '../types';
import { PrivacyConfig } from '../types/privacy';
import { DEFAULT_DRIVE115_SETTINGS } from '../services/drive115/config';
import { DEFAULT_AI_SETTINGS } from '../types/ai';

export const STORAGE_KEYS = {
    // A single key for all viewed records, which is an object
    // where keys are video IDs and values are objects with { title, status, timestamp }.
    VIEWED_RECORDS: 'viewed',

    // Stores all settings, including display and WebDAV configurations.
    SETTINGS: 'settings',

    // Key for storing persistent logs.
    LOGS: 'persistent_logs',

    // Key for storing last import statistics.
    LAST_IMPORT_STATS: 'last_import_stats',

    // Key for storing user profile information.
    USER_PROFILE: 'user_profile',

    // Key for storing actor records.
    ACTOR_RECORDS: 'actor_records',

    // Key for storing restore backups.
    RESTORE_BACKUP: 'restore_backup',

    // WebDAV 恢复：记忆上次选择的备份文件（完整路径或 URL）
    WEBDAV_LAST_SELECTED_BACKUP: 'webdav_last_selected_backup',

    // 隐私保护相关存储键
    PRIVACY_STATE: 'privacy_state',
    PRIVACY_SESSION: 'privacy_session',

    // 新作品功能相关存储键
    NEW_WORKS_SUBSCRIPTIONS: 'new_works_subscriptions',
    NEW_WORKS_RECORDS: 'new_works_records',
    NEW_WORKS_CONFIG: 'new_works_config',
    
    // 高级搜索方案存储键
    ADV_SEARCH_PRESETS: 'adv_search_presets',

    // IndexedDB 迁移状态标记
    IDB_MIGRATED: 'idb_migrated',
    // IndexedDB 日志迁移状态标记（将旧的 STORAGE_KEYS.LOGS 迁移到 IDB logs 表）
    IDB_LOGS_MIGRATED: 'idb_logs_migrated',
    // IndexedDB 演员数据迁移状态标记（将旧的 STORAGE_KEYS.ACTOR_RECORDS 迁移到 IDB actors 表）
    IDB_ACTORS_MIGRATED: 'idb_actors_migrated'
} as const;

export const VIDEO_STATUS = {
    VIEWED: 'viewed', // 已观看
    WANT: 'want',     // 我想看
    BROWSED: 'browsed' // 已浏览
} as const;

// 演员同步默认配置
export const DEFAULT_ACTOR_SYNC_CONFIG: ActorSyncConfig = {
    enabled: true, // 默认启用演员同步
    autoSync: false, // 默认不自动同步
    syncInterval: 1440, // 24小时同步一次
    batchSize: 20, // 每批处理20个演员
    maxRetries: 3, // 最大重试3次
    requestInterval: 3, // 请求间隔3秒
    urls: {
        collectionActors: 'https://javdb.com/users/collection_actors', // 收藏演员列表URL
        actorDetail: 'https://javdb.com/actors/{{ACTOR_ID}}', // 演员详情页URL模板
    },
};

// 新作品功能默认配置
export const DEFAULT_NEW_WORKS_CONFIG: NewWorksGlobalConfig = {
    checkInterval: 24, // 24小时检查一次
    requestInterval: 3, // 请求间隔3秒
    autoCheckEnabled: false, // 默认不开启自动检查
    filters: {
        excludeViewed: true, // 默认排除已看
        excludeBrowsed: true, // 默认排除已浏览
        excludeWant: false, // 默认不排除想看
        dateRange: 3, // 默认近3个月
    },
    maxWorksPerCheck: 50, // 每次检查最多50个作品
    autoCleanup: true, // 默认启用自动清理
    cleanupDays: 30, // 30天后清理
};

// 隐私保护默认配置
export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
    screenshotMode: {
        enabled: false,
        autoBlurTrigger: 'manual',
        blurIntensity: 5,
        protectedElements: [
            // Dashboard 布局级保护 - 只模糊最外层容器，避免嵌套模糊
            '.video-list-container',          // 番号库整个容器
            '.actor-list-container',          // 演员库整个容器
            '.new-works-list-section',        // 新作品显示容器

            // JavDB网站内容 - 视频相关
            '.video-cover',
            '.movie-list .item',
            '.movie-list .cover',
            '.movie-list .title',
            '.movie-list .meta',
            '.video-meta-panel',
            '.video-detail',
            '.preview-images',
            '.sample-waterfall',

            // JavDB网站内容 - 演员相关
            '.actor-name',
            '.actor-list .item',
            '.actor-list .avatar',
            '.actor-list .name',
            '.actor-section',
            '.performer-list',
            '.performer-avatar',

            // 页面背景和封面
            '.hero-banner',
            '.cover-container',
            '.backdrop',
            '.poster',
            '.thumbnail',

            // 用户相关
            '.user-profile',
            '.user-avatar',
            '.viewed-records',
            '.collection-list',
            '.watch-history',
            '.favorite-list',

            // 搜索和标签
            '.search-result',
            '.tag-list',
            '.genre-list',
            '.category-list',

            // 通用敏感内容
            '[data-sensitive]',
            '[data-private]',
            '.sensitive-content'
        ],
        showEyeIcon: true,
        eyeIconPosition: 'top-right',
        temporaryViewDuration: 10
    },
    privateMode: {
        enabled: false,
        requirePassword: false,
        passwordHash: '',
        passwordSalt: '',
        sessionTimeout: 30,
        lastVerified: 0,
        lockOnTabLeave: false,
        lockOnExtensionClose: false,
        restrictedFeatures: [
            'data-sync',
            'data-export',
            'data-import',
            'webdav-sync',
            'actor-sync',
            'advanced-settings'
        ]
    },
    passwordRecovery: {
        securityQuestions: [],
        recoveryEmail: '',
        backupCode: '',
        backupCodeUsed: false,
        lastRecoveryAttempt: 0,
        recoveryAttemptCount: 0
    }
};

// 状态优先级定义：数字越大优先级越高
// 已看 > 想看 > 已浏览
export const STATUS_PRIORITY = {
    [VIDEO_STATUS.BROWSED]: 1, // 已浏览 - 最低优先级
    [VIDEO_STATUS.WANT]: 2,    // 我想看 - 中等优先级
    [VIDEO_STATUS.VIEWED]: 3   // 已观看 - 最高优先级
} as const;

export const DEFAULT_SETTINGS: ExtensionSettings = {
    display: {
        hideViewed: false, // Corresponds to VIEWED status
        hideBrowsed: false, // Corresponds to BROWSED status
        hideVR: false,
        hideWant: false,
    },
    // 演员库配置默认值
    actorLibrary: {
        blacklist: {
            hideInList: true,
            showBadge: true,
        }
    },
    webdav: {
        enabled: true,
        url: '',
        username: '',
        password: '',
        autoSync: false,
        syncInterval: 1440, // 24 hours in minutes
        // 默认保留天数：7 天
        retentionDays: 7,
        lastSync: ''
    },
    dataSync: {
        requestInterval: 3, // 请求间隔3秒，缓解服务器压力
        batchSize: 20, // 每批处理20个视频
        maxRetries: 3, // 最大重试3次
        urls: {
            wantWatch: 'https://javdb.com/users/want_watch_videos', // 想看视频列表URL
            watchedVideos: 'https://javdb.com/users/watched_videos', // 已看视频列表URL
            collectionActors: 'https://javdb.com/users/collection_actors', // 收藏演员列表URL
        },
    },
    searchEngines: [
        {
            id: 'javdb',
            icon: 'assets/javdb.ico',
            name: 'JavDB',
            urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all'
        },
        {
            id: 'javbus',
            icon: 'assets/javbus.ico',
            name: 'Javbus',
            urlTemplate: 'https://www.javbus.com/search/{{ID}}&type=&parent=ce'
        }
    ],
    logging: {
        maxLogEntries: 1500,
        verboseMode: false, // 详细日志模式（默认关闭以减少噪音）
        showPrivacyLogs: false, // 显示隐私相关日志（默认关闭）
        showStorageLogs: false, // 显示存储相关日志（默认关闭）
        // 统一控制台代理默认配置
        consoleLevel: 'DEBUG',
        consoleFormat: {
            showTimestamp: true,
            showSource: true,
            color: true,
            timeZone: 'Asia/Shanghai',
        },
        consoleCategories: {
            core: true,
            orchestrator: true,
            drive115: true,
            privacy: true,
            magnet: true,
            actor: true,
            storage: true,
            general: true,
        },
    },

    drive115: DEFAULT_DRIVE115_SETTINGS,

    // 新增：数据增强默认配置
    dataEnhancement: {
        enableMultiSource: false, // 仍未启用
        enableImageCache: false,  // 仍未启用
        enableVideoPreview: true, // 启用：视频预览增强
        enableTranslation: false,
        enableRatingAggregation: false, // 开发中，暂时关闭
        enableActorInfo: false, // 开发中，暂时关闭
        cacheExpiration: 24, // 24小时
    },

    // 新增：翻译服务默认配置
    translation: {
        provider: 'traditional' as const, // 默认使用传统翻译服务
        traditional: {
            service: 'google' as const, // 默认使用Google翻译
            sourceLanguage: 'ja', // 日语
            targetLanguage: 'zh-CN', // 简体中文
        },
        ai: {
            useGlobalModel: true, // 默认使用全局AI模型
        },
    },

    // 新增：用户体验默认配置
    userExperience: {
        enableQuickCopy: false,
        enableContentFilter: false,
        enableKeyboardShortcuts: false, // 开发中，暂时关闭
        enableMagnetSearch: false,
        enableAnchorOptimization: false,
        enableListEnhancement: true, // 默认启用列表增强
        enableActorEnhancement: false,
        showEnhancedTooltips: false, // 开发中，暂时关闭
    },

    // 磁力资源搜索默认配置
    magnetSearch: {
        sources: {
            sukebei: true,
            btdig: true,
            btsow: true,
            torrentz2: false,
            custom: [],
        },
        maxResults: 15,
        timeoutMs: 6000,
        concurrency: {
            pageMaxConcurrentRequests: 2,
            bgGlobalMaxConcurrent: 4,
            bgPerHostMaxConcurrent: 1,
            bgPerHostRateLimitPerMin: 12,
        },
    },

    // 新增：影片页增强默认配置
    videoEnhancement: {
        enabled: false,
        enableCoverImage: true,
        enableTranslation: true,
        enableRating: true,
        enableActorInfo: true,
        showLoadingIndicator: true,
        enableReviewBreaker: false,
        enableFC2Breaker: false,
        // 新增：默认开启“想看同步”和“115推送后自动已看”（保持旧行为）
        enableWantSync: true,
        autoMarkWatchedAfter115: true,
    },

    // 新增：内容过滤默认配置
    contentFilter: {
        enabled: false,
        keywordRules: [] as KeywordFilterRule[],
    },

    // 新增：锚点优化默认配置（仅在详情页生效）
    anchorOptimization: {
        enabled: false,
        showPreviewButton: true,
        buttonPosition: 'right-center' as const,
    },

    // 新增：列表增强默认配置
    listEnhancement: {
        enabled: true, // 默认启用
        enableClickEnhancement: true,
        enableVideoPreview: true,
        enableScrollPaging: false, // 默认关闭滚动翻页
        enableListOptimization: true,
        previewDelay: 1000,
        previewVolume: 0.2,
        enableRightClickBackground: true,
        // 新增：演员水印默认配置
        enableActorWatermark: false,
        actorWatermarkPosition: 'top-right',
        actorWatermarkOpacity: 0.4,
        // 新增：基于演员偏好的过滤默认配置
        hideBlacklistedActorsInList: false,
        hideNonFavoritedActorsInList: false,
        treatSubscribedAsFavorited: true,
    },

    // 新增：Emby增强默认配置
    emby: {
        enabled: false, // 默认关闭，需要用户手动配置
        matchUrls: [
            '*.emby.com/*',
            '*.jellyfin.org/*',
            'localhost:8096/*',
            '192.168.*.*:8096/*'
        ], // 默认匹配常见的Emby/Jellyfin地址
        videoCodePatterns: [
            '[A-Z]{2,6}-\\d{2,6}', // 标准格式: ABC-123, ABCD-123
            '\\d{4,8}_\\d{1,3}', // 数字格式: 123456_01
            'FC2-PPV-\\d+', // FC2格式
            '\\d{6,12}', // 纯数字格式
            '[a-z0-9]+-\\d+_\\d+' // 带字母的数字格式
        ],
        linkBehavior: 'javdb-search' as const, // 默认使用搜索
        enableAutoDetection: true, // 默认启用自动检测
        highlightStyle: {
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            borderRadius: '4px',
            padding: '2px 4px'
        }
    },

    // 新增：演员同步配置
    actorSync: DEFAULT_ACTOR_SYNC_CONFIG,

    // 新增：演员页增强默认配置
    actorEnhancement: {
        enabled: false,
        autoApplyTags: false,
        defaultTags: [],
        defaultSortType: 0,
        // 新增：演员页“影片分段显示”默认配置
        enableTimeSegmentationDivider: false,
        // 默认以 6 个月为阈值
        timeSegmentationMonths: 6,
    },

    // 新增：隐私保护配置
    privacy: DEFAULT_PRIVACY_CONFIG,

    // 新增：AI功能配置
    ai: DEFAULT_AI_SETTINGS,

    version: '0.0.0',
    // Dashboard 番号库：是否在列表中显示封面
    showCoversInRecords: false
};

// WebDAV恢复配置
export const RESTORE_CONFIG = {
    // 数据加载策略
    loading: {
        enableProgressiveLoading: true,
        chunkSize: 1000,
        maxConcurrentAnalysis: 3,
        timeoutMs: 60000
    },

    // 用户界面配置
    ui: {
        defaultMode: 'quick' as 'quick' | 'wizard' | 'expert',
        showAdvancedByDefault: false,
        enableAnimations: true,
        stepTransitionMs: 300
    },

    // 错误处理配置
    errorHandling: {
        maxRetries: 3,
        enableFallback: true,
        logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
        showDetailedErrors: false
    },

    // 默认策略配置
    defaults: {
        strategy: 'smart' as 'smart' | 'local' | 'cloud' | 'manual',
        autoSelectContent: true,
        enableConflictResolution: true
    }
};