import { ExtensionSettings, FilterRule, ActorSyncConfig } from '../types';
import { DEFAULT_DRIVE115_SETTINGS } from '../services/drive115/config';

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
    ACTOR_RECORDS: 'actor_records'
} as const;

export const VIDEO_STATUS = {
    VIEWED: 'viewed', // 已观看
    WANT: 'want',     // 我想看
    BROWSED: 'browsed' // 已浏览
} as const;

// 演员同步默认配置
export const DEFAULT_ACTOR_SYNC_CONFIG: ActorSyncConfig = {
    enabled: false, // 默认关闭，需要用户手动启用
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
    },
    webdav: {
        enabled: true,
        url: '',
        username: '',
        password: '',
        autoSync: false,
        syncInterval: 1440, // 24 hours in minutes
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
            icon: 'assets/favicon-32x32.png',
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
    },
    drive115: DEFAULT_DRIVE115_SETTINGS,

    // 新增：数据增强默认配置
    dataEnhancement: {
        enableMultiSource: false, // 默认关闭，避免影响现有用户
        enableImageCache: true,
        enableVideoPreview: false,
        enableTranslation: false,
        enableRatingAggregation: false,
        enableActorInfo: false,
        cacheExpiration: 24, // 24小时
    },

    // 新增：用户体验默认配置
    userExperience: {
        enableQuickCopy: false,
        enableContentFilter: false,
        enableKeyboardShortcuts: false,
        enableMagnetSearch: false,
        showEnhancedTooltips: true,
    },

    // 新增：内容过滤默认配置
    contentFilter: {
        enabled: false,
        rules: [] as FilterRule[],
        highlightRules: [] as FilterRule[],
    },

    // 新增：演员同步配置
    actorSync: DEFAULT_ACTOR_SYNC_CONFIG,

    version: '0.0.0'
};