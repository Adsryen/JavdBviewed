import type { DEFAULT_SETTINGS, VIDEO_STATUS } from "../utils/config";

export type ExtensionSettings = typeof DEFAULT_SETTINGS;

export type VideoStatus = typeof VIDEO_STATUS[keyof typeof VIDEO_STATUS];

export interface VideoRecord {
    id: string;
    title: string;
    status: VideoStatus;
    timestamp: number;
} 