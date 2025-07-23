export const STORAGE_KEYS = {
    // A single key for all viewed records, which is an object
    // where keys are video IDs and values are objects with { title, status, timestamp }.
    VIEWED_RECORDS: 'viewed',

    // Stores all settings, including display and WebDAV configurations.
    SETTINGS: 'settings',

    // Key for storing persistent logs.
    LOGS: 'persistent_logs'
};

export const DEFAULT_SETTINGS = {
    display: {
        hideWatched: false,
        hideViewed: false,
        hideVR: false,
    },
    webdav: {
        enabled: false,
        url: '',
        username: '',
        password: '',
        autoSync: false,
    },
    version: '1.0.1', // Default version
}; 