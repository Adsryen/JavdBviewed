import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";

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
    searchEngines: {
        id: string;
        name: string;
        urlTemplate: string;
        icon: string;
    }[];
    logging: {
        maxLogEntries: number;
    };
}

export type VideoStatus = 'viewed' | 'browsed' | 'want';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export interface VideoRecord {
    id: string;
    title: string;
    status: VideoStatus;
    timestamp: number;
} 