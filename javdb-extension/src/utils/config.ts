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
    LAST_IMPORT_STATS: 'last_import_stats'
} as const;

export const VIDEO_STATUS = {
    VIEWED: 'viewed', // 已观看
    WANT: 'want',     // 我想看
    BROWSED: 'browsed' // 已浏览
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