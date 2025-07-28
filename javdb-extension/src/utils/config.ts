import { ExtensionSettings } from '../types';

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
    USER_PROFILE: 'user_profile'
} as const;

export const VIDEO_STATUS = {
    VIEWED: 'viewed', // 已观看
    WANT: 'want',     // 我想看
    BROWSED: 'browsed' // 已浏览
} as const;

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
    version: '0.0.0'
};