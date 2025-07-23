export const STORAGE_KEYS = {
    // Data
    VIEWED_RECORDS: 'viewed',

    // Settings
    SETTINGS: 'settings',

    // For popup.js legacy keys - can be removed after migration
    HIDE_WATCHED_VIDEOS: 'hideWatchedVideos',
    HIDE_VIEWED_VIDEOS: 'hideViewedVideos',
    HIDE_VR_VIDEOS: 'hideVRVideos',
    STORED_IDS: 'myIds',
    BROWSE_HISTORY: 'videoBrowseHistory',
    LAST_UPLOAD_TIME: 'lastUploadTime',
    LAST_EXPORT_TIME: 'lastExportTime',
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