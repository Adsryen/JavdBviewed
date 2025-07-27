/**
 * 数据同步核心逻辑模块
 */

import { getValue } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/config';
import { logAsync } from '../logger';
import { showMessage } from '../ui/toast';
import { getUserProfile } from '../userProfile';
import type { VideoRecord, UserProfile } from '../../types';
import type { 
    SyncType, 
    SyncStatus, 
    SyncContext, 
    SyncProgress, 
    SyncResult,
    SyncConfig
} from './types';
import { 
    filterDataByType, 
    getSyncStats, 
    getSyncTypeDisplayName,
    validateSyncData,
    sanitizeSyncData,
    formatSyncResultMessage,
    getSyncConfig,
    isSyncTypeSupported,
    validateUserPermissions,
    generateSyncRequestId
} from './utils';
import { getApiClient } from './api';

/**
 * 同步管理器类
 */
export class SyncManager {
    private static instance: SyncManager;
    private currentStatus: SyncStatus = SyncStatus.IDLE;
    private currentContext: SyncContext | null = null;
    private abortController: AbortController | null = null;

    private constructor() {}

    public static getInstance(): SyncManager {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }
        return SyncManager.instance;
    }

    /**
     * 执行同步操作
     */
    public async sync(
        type: SyncType,
        config?: Partial<SyncConfig>,
        onProgress?: (progress: SyncProgress) => void,
        onComplete?: (result: SyncResult) => void,
        onError?: (error: Error) => void
    ): Promise<SyncResult> {
        // 检查是否已在同步中
        if (this.currentStatus === SyncStatus.SYNCING) {
            const error = new Error('正在同步中，请稍候...');
            onError?.(error);
            throw error;
        }

        // 检查同步类型是否支持
        if (!isSyncTypeSupported(type)) {
            const error = new Error(`${getSyncTypeDisplayName(type)}功能即将推出`);
            onError?.(error);
            throw error;
        }

        const requestId = generateSyncRequestId();
        logAsync('INFO', `开始同步操作`, { type, requestId });

        try {
            // 设置同步状态
            this.currentStatus = SyncStatus.SYNCING;
            this.abortController = new AbortController();

            // 验证用户登录状态
            const userProfile = await this.validateUser();

            // 获取本地数据
            const localRecords = await this.getLocalData();
            const dataToSync = filterDataByType(localRecords, type);

            // 验证数据
            if (!validateSyncData(dataToSync)) {
                throw new Error('本地数据格式错误，无法进行同步');
            }

            // 获取同步统计
            const stats = await getSyncStats();

            // 创建同步上下文
            const syncConfig = getSyncConfig(config);
            this.currentContext = {
                type,
                config: syncConfig,
                data: dataToSync,
                stats,
                onProgress,
                onComplete,
                onError
            };

            // 执行同步
            const result = await this.performSync(this.currentContext);

            // 更新状态
            this.currentStatus = result.success ? SyncStatus.SUCCESS : SyncStatus.ERROR;
            
            // 调用完成回调
            onComplete?.(result);
            
            logAsync('INFO', '同步操作完成', { type, result, requestId });
            return result;

        } catch (error: any) {
            this.currentStatus = SyncStatus.ERROR;
            logAsync('ERROR', '同步操作失败', { type, error: error.message, requestId });
            
            const result: SyncResult = {
                success: false,
                message: error.message
            };
            
            onError?.(error);
            return result;
        } finally {
            // 清理状态
            this.cleanup();
        }
    }

    /**
     * 执行具体的同步逻辑
     */
    private async performSync(context: SyncContext): Promise<SyncResult> {
        const { type, data, config, onProgress } = context;
        const dataArray = sanitizeSyncData(data);
        const totalCount = dataArray.length;

        // 检查是否有数据需要同步
        if (totalCount === 0) {
            const message = `没有需要同步的${getSyncTypeDisplayName(type)}`;
            return {
                success: true,
                message,
                syncedCount: 0
            };
        }

        // 更新进度：准备阶段
        onProgress?.({
            percentage: 0,
            message: '准备同步...',
            current: 0,
            total: totalCount
        });

        try {
            // 获取用户信息
            const userProfile = await getUserProfile();
            if (!userProfile) {
                throw new Error('无法获取用户信息');
            }

            // 更新进度：开始同步
            onProgress?.({
                percentage: 10,
                message: '开始同步...',
                current: 0,
                total: totalCount
            });

            // 调用API进行同步
            const apiClient = getApiClient();
            const syncResponse = await apiClient.syncData(
                type,
                dataArray,
                userProfile,
                config,
                (current, total) => {
                    // API进度回调，映射到40%-90%的进度范围
                    const percentage = 40 + (current / total) * 50;
                    onProgress?.({
                        percentage,
                        message: '同步中...',
                        current,
                        total
                    });
                }
            );

            // 更新进度：完成
            onProgress?.({
                percentage: 100,
                message: '同步完成',
                current: totalCount,
                total: totalCount
            });

            // 格式化结果消息
            const message = formatSyncResultMessage(
                type,
                syncResponse.syncedCount,
                syncResponse.skippedCount,
                syncResponse.errorCount
            );

            return {
                success: true,
                message,
                syncedCount: syncResponse.syncedCount,
                skippedCount: syncResponse.skippedCount,
                errorCount: syncResponse.errorCount,
                details: syncResponse.errors ? 
                    `错误详情：${syncResponse.errors.map(e => e.error).join(', ')}` : 
                    undefined
            };

        } catch (error: any) {
            throw new Error(`同步失败: ${error.message}`);
        }
    }

    /**
     * 验证用户登录状态
     */
    private async validateUser(): Promise<UserProfile> {
        const userProfile = await getUserProfile();
        
        if (!validateUserPermissions(userProfile)) {
            throw new Error('请先登录 JavDB 账号');
        }
        
        return userProfile!;
    }

    /**
     * 获取本地数据
     */
    private async getLocalData(): Promise<Record<string, VideoRecord>> {
        try {
            const records = await getValue<Record<string, VideoRecord>>(
                STORAGE_KEYS.VIEWED_RECORDS, 
                {}
            );
            return records;
        } catch (error: any) {
            throw new Error(`获取本地数据失败: ${error.message}`);
        }
    }

    /**
     * 取消当前同步操作
     */
    public async cancelSync(): Promise<boolean> {
        if (this.currentStatus !== SyncStatus.SYNCING) {
            return false;
        }

        try {
            // 取消网络请求
            this.abortController?.abort();
            
            // 重置状态
            this.currentStatus = SyncStatus.IDLE;
            this.cleanup();
            
            logAsync('INFO', '同步操作已取消');
            showMessage('同步操作已取消', 'info');
            return true;
        } catch (error: any) {
            logAsync('ERROR', '取消同步失败', { error: error.message });
            return false;
        }
    }

    /**
     * 获取当前同步状态
     */
    public getCurrentStatus(): SyncStatus {
        return this.currentStatus;
    }

    /**
     * 获取当前同步上下文
     */
    public getCurrentContext(): SyncContext | null {
        return this.currentContext;
    }

    /**
     * 检查是否正在同步
     */
    public isSyncing(): boolean {
        return this.currentStatus === SyncStatus.SYNCING;
    }

    /**
     * 重置同步状态
     */
    public reset(): void {
        this.currentStatus = SyncStatus.IDLE;
        this.cleanup();
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        this.currentContext = null;
        this.abortController = null;
    }

    /**
     * 获取同步统计信息
     */
    public async getStats() {
        return await getSyncStats();
    }
}

/**
 * 获取同步管理器实例
 */
export function getSyncManager(): SyncManager {
    return SyncManager.getInstance();
}
