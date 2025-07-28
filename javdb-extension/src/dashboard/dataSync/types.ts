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

// 同步类型（从配置模块导入）
export type { SyncType } from '../config/syncConfig';

// 同步进度信息
export interface SyncProgress {
    percentage: number;
    message: string;
    current?: number;
    total?: number;
    stage?: 'pages' | 'details';
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

// 同步配置（从配置模块导入）
export type { SyncConfig } from '../config/syncConfig';

// 同步上下文
export interface SyncContext {
    type: import('../config/syncConfig').SyncType;
    config: import('../config/syncConfig').SyncConfig;
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
    type: import('../config/syncConfig').SyncType;
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

// 默认同步配置（从配置模块导入）
export { DEFAULT_SYNC_CONFIG } from '../config/syncConfig';

/**
 * 同步取消异常类 - 用于区分用户主动取消和真正的错误
 */
export class SyncCancelledError extends Error {
    constructor(message: string = '同步已取消') {
        super(message);
        this.name = 'SyncCancelledError';
    }
}
