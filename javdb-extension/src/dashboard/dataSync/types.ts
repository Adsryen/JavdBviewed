/**
 * 数据同步模块的类型定义
 */

import type { VideoRecord } from '../../types';

// 同步状态枚举
export enum SyncStatus {
    IDLE = 'idle',
    SYNCING = 'syncing',
    SUCCESS = 'success',
    ERROR = 'error'
}

// 同步类型
export type SyncType = 'all' | 'viewed' | 'want' | 'actors';

// 同步选项配置
export interface SyncOption {
    id: string;
    type: SyncType;
    title: string;
    description: string;
    icon: string;
    color: string;
    enabled: boolean;
    comingSoon?: boolean;
}

// 同步进度信息
export interface SyncProgress {
    percentage: number;
    message: string;
    current?: number;
    total?: number;
}

// 同步结果
export interface SyncResult {
    success: boolean;
    message: string;
    syncedCount?: number;
    skippedCount?: number;
    errorCount?: number;
    details?: string;
}

// 同步统计信息
export interface SyncStats {
    totalRecords: number;
    viewedRecords: number;
    wantRecords: number;
    actorsRecords: number;
}

// 同步配置
export interface SyncConfig {
    batchSize: number; // 批量同步大小
    retryCount: number; // 重试次数
    retryDelay: number; // 重试延迟（毫秒）
    timeout: number; // 超时时间（毫秒）
}

// 同步上下文
export interface SyncContext {
    type: SyncType;
    config: SyncConfig;
    data: Record<string, VideoRecord>;
    stats: SyncStats;
    onProgress?: (progress: SyncProgress) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
}

// API响应类型
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// 同步请求数据
export interface SyncRequestData {
    type: SyncType;
    records: VideoRecord[];
    userProfile: {
        email: string;
        username: string;
    };
}

// 同步响应数据
export interface SyncResponseData {
    syncedCount: number;
    skippedCount: number;
    errorCount: number;
    errors?: Array<{
        recordId: string;
        error: string;
    }>;
}

// 默认同步配置
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    batchSize: 50,
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000
};

// 同步选项配置
export const SYNC_OPTIONS: SyncOption[] = [
    {
        id: 'syncAllData',
        type: 'all',
        title: '同步全部',
        description: '已观看 + 想看',
        icon: 'fas fa-sync-alt',
        color: '#28a745',
        enabled: true
    },
    {
        id: 'syncViewedData',
        type: 'viewed',
        title: '同步已观看',
        description: '已观看视频',
        icon: 'fas fa-check',
        color: '#28a745',
        enabled: true
    },
    {
        id: 'syncWantData',
        type: 'want',
        title: '同步想看',
        description: '想看视频',
        icon: 'fas fa-star',
        color: '#ffc107',
        enabled: true
    },
    {
        id: 'syncActorsData',
        type: 'actors',
        title: '同步演员',
        description: '收藏演员',
        icon: 'fas fa-users',
        color: '#6f42c1',
        enabled: false,
        comingSoon: true
    }
];
