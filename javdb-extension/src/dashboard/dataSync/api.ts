/**
 * 数据同步API调用模块
 */

import { logAsync } from '../logger';
import type { VideoRecord, UserProfile } from '../../types';
import type {
    SyncType,
    SyncRequestData,
    SyncResponseData,
    ApiResponse,
    SyncConfig
} from './types';
import { SyncCancelledError } from './types';
import { getSettings, getValue } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/config';

/**
 * 同步类型配置接口
 */
interface SyncTypeConfig {
    url: string;
    status: 'want' | 'viewed';
    displayName: string;
    countField: 'wantCount' | 'watchedCount';
}

/**
 * API客户端类
 */
export class ApiClient {
    private baseUrl: string;
    private timeout: number;
    private retryCount: number;
    private retryDelay: number;

    constructor(config: {
        baseUrl?: string;
        timeout?: number;
        retryCount?: number;
        retryDelay?: number;
    } = {}) {
        this.baseUrl = config.baseUrl || 'https://api.javdb.com';
        this.timeout = config.timeout || 30000;
        this.retryCount = config.retryCount || 3;
        this.retryDelay = config.retryDelay || 1000;
    }

    /**
     * 同步数据到服务器
     */
    async syncData(
        type: SyncType,
        localData: VideoRecord[],
        userProfile: UserProfile,
        config: SyncConfig,
        onProgress?: (progress: any) => void,
        abortSignal?: AbortSignal
    ): Promise<SyncResponseData> {
        const typeConfig = this.getSyncTypeConfig(type);
        
        logAsync('INFO', `开始${typeConfig.displayName}同步`, {
            type,
            localDataCount: localData.length,
            mode: config.mode
        });

        try {
            // 检查取消信号
            if (abortSignal?.aborted) {
                throw new SyncCancelledError('同步已取消');
            }

            // 模拟API调用 - 实际实现中这里会调用真实的API
            const result = await this.performSync(
                type,
                localData,
                userProfile,
                config,
                onProgress,
                abortSignal
            );

            logAsync('INFO', `${typeConfig.displayName}同步完成`, result);
            return result;

        } catch (error) {
            if (error instanceof SyncCancelledError) {
                throw error;
            }
            
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            logAsync('ERROR', `${typeConfig.displayName}同步失败`, { error: errorMessage });
            throw new Error(`${typeConfig.displayName}同步失败: ${errorMessage}`);
        }
    }

    /**
     * 执行实际的同步操作
     */
    private async performSync(
        type: SyncType,
        localData: VideoRecord[],
        userProfile: UserProfile,
        config: SyncConfig,
        onProgress?: (progress: any) => void,
        abortSignal?: AbortSignal
    ): Promise<SyncResponseData> {
        // 这里是模拟实现，实际项目中需要根据具体API进行实现
        
        const totalSteps = 100;
        let currentStep = 0;
        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // 模拟同步过程
        for (let i = 0; i < totalSteps; i++) {
            // 检查取消信号
            if (abortSignal?.aborted) {
                throw new SyncCancelledError('同步已取消');
            }

            currentStep = i + 1;
            const percentage = Math.round((currentStep / totalSteps) * 100);

            // 更新进度
            onProgress?.({
                current: currentStep,
                total: totalSteps,
                percentage,
                message: `正在同步第 ${currentStep} 项...`,
                stage: currentStep < 50 ? 'pages' : 'details'
            });

            // 模拟处理时间
            await this.delay(50);

            // 模拟同步结果
            if (Math.random() > 0.1) {
                syncedCount++;
            } else {
                skippedCount++;
            }
        }

        return {
            success: true,
            syncedCount,
            skippedCount,
            errorCount,
            newRecords: Math.floor(syncedCount * 0.7),
            updatedRecords: Math.floor(syncedCount * 0.3),
            message: `同步完成：新增 ${Math.floor(syncedCount * 0.7)}，更新 ${Math.floor(syncedCount * 0.3)}`
        };
    }

    /**
     * 获取同步类型配置
     */
    private getSyncTypeConfig(type: SyncType): SyncTypeConfig {
        const configs: Record<SyncType, SyncTypeConfig> = {
            viewed: {
                url: '/sync/viewed',
                status: 'viewed',
                displayName: '已观看',
                countField: 'watchedCount'
            },
            want: {
                url: '/sync/want',
                status: 'want',
                displayName: '想看',
                countField: 'wantCount'
            },
            actors: {
                url: '/sync/actors',
                status: 'viewed', // 演员同步使用viewed状态
                displayName: '演员',
                countField: 'watchedCount'
            },
            all: {
                url: '/sync/all',
                status: 'viewed',
                displayName: '全部',
                countField: 'watchedCount'
            }
        };

        return configs[type];
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 检查网络状态
     */
    private async checkNetworkStatus(): Promise<boolean> {
        try {
            // 使用更可靠的网络检查方式
            const response = await fetch('https://javdb.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000) // 5秒超时
            });
            return true;
        } catch {
            // 如果主站不可用，尝试其他方式
            try {
                const response = await fetch('https://www.cloudflare.com/favicon.ico', {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(3000)
                });
                return true;
            } catch {
                return false;
            }
        }
    }
}

// 单例实例
let apiClientInstance: ApiClient | null = null;

/**
 * 获取API客户端实例
 */
export function getApiClient(): ApiClient {
    if (!apiClientInstance) {
        apiClientInstance = new ApiClient();
    }
    return apiClientInstance;
}

/**
 * 重置API客户端实例
 */
export function resetApiClient(): void {
    apiClientInstance = null;
}
