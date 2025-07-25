export const STORAGE_KEYS = {
    // A single key for all viewed records, which is an object
    // where keys are video IDs and values are objects with { title, status, timestamp }.
    VIEWED_RECORDS: 'viewed',

    // Stores all settings, including display and WebDAV configurations.
    SETTINGS: 'settings',

    // Key for storing persistent logs.
    LOGS: 'persistent_logs'
} as const;

export const VIDEO_STATUS = {
    VIEWED: 'viewed', // 已观看
    WANT: 'want',     // 我想看
    BROWSED: 'browsed' // 已浏览
} as const;

export const DEFAULT_SETTINGS = {
    display: {
        hideViewed: false, // Corresponds to VIEWED status
        hideBrowsed: false, // Corresponds to BROWSED status
        hideVR: false,
    },
    webdav: {
        enabled: false,
        url: '',
        username: '',
        password: '',
        autoSync: false,
        syncInterval: 1440, // 24 hours in minutes
        lastSync: null,
    },
    searchEngines: [
        { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all', icon: 'https://javdb.com/favicon-32x32.png' },
        { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q={{ID}}', icon: 'https://www.google.com/favicon.ico' },
    ],
    logging: {
        maxLogEntries: 1500,
    },
}; 