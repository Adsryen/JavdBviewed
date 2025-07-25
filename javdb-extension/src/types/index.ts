import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";

export type ExtensionSettings = typeof DEFAULT_SETTINGS;

export type VideoStatus = 'viewed' | 'want' | 'browsed';

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