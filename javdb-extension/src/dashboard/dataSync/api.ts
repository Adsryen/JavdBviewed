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
import { retry, delay, checkNetworkStatus } from './utils';

/**
 * API客户端类
 */
export class SyncApiClient {
    private static instance: SyncApiClient;
    private baseUrl = 'https://javdb.com';
    private timeout = 30000;

    private constructor() {}

    public static getInstance(): SyncApiClient {
        if (!SyncApiClient.instance) {
            SyncApiClient.instance = new SyncApiClient();
        }
        return SyncApiClient.instance;
    }

    /**
     * 同步数据到JavDB
     */
    public async syncData(
        type: SyncType,
        records: VideoRecord[],
        userProfile: UserProfile,
        config: SyncConfig,
        onProgress?: (current: number, total: number) => void
    ): Promise<SyncResponseData> {
        // 检查网络连接
        if (!checkNetworkStatus()) {
            throw new Error('网络连接不可用，请检查网络设置');
        }

        // 验证参数
        this.validateSyncParams(type, records, userProfile);

        logAsync('INFO', `开始同步${type}数据`, { 
            recordCount: records.length,
            userEmail: userProfile.email 
        });

        try {
            // 目前使用模拟同步，未来替换为真实API调用
            return await this.simulateSync(type, records, config, onProgress);
        } catch (error: any) {
            logAsync('ERROR', '同步数据失败', { 
                error: error.message,
                type,
                recordCount: records.length 
            });
            throw error;
        }
    }

    /**
     * 模拟同步过程（未来替换为真实API调用）
     */
    private async simulateSync(
        type: SyncType,
        records: VideoRecord[],
        config: SyncConfig,
        onProgress?: (current: number, total: number) => void
    ): Promise<SyncResponseData> {
        const totalRecords = records.length;
        
        // 检查是否支持该同步类型
        if (type === 'actors') {
            throw new Error('收藏演员功能即将推出，敬请期待');
        }
        
        if (totalRecords === 0) {
            return {
                syncedCount: 0,
                skippedCount: 0,
                errorCount: 0
            };
        }

        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const errors: Array<{ recordId: string; error: string }> = [];

        // 分批处理数据
        const batchSize = config.batchSize;
        const batches = this.createBatches(records, batchSize);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            try {
                // 模拟网络延迟
                await delay(100 + Math.random() * 200);
                
                // 模拟批量同步
                const batchResult = await this.simulateBatchSync(batch, config);
                
                syncedCount += batchResult.syncedCount;
                skippedCount += batchResult.skippedCount;
                errorCount += batchResult.errorCount;
                
                if (batchResult.errors) {
                    errors.push(...batchResult.errors);
                }
                
                // 更新进度
                const processedCount = (batchIndex + 1) * batchSize;
                const currentProgress = Math.min(processedCount, totalRecords);
                onProgress?.(currentProgress, totalRecords);
                
            } catch (error: any) {
                logAsync('ERROR', `批次${batchIndex + 1}同步失败`, { error: error.message });
                
                // 将整个批次标记为错误
                batch.forEach(record => {
                    errors.push({
                        recordId: record.id,
                        error: error.message
                    });
                });
                errorCount += batch.length;
            }
        }

        const result: SyncResponseData = {
            syncedCount,
            skippedCount,
            errorCount
        };

        if (errors.length > 0) {
            result.errors = errors;
        }

        logAsync('INFO', '同步完成', result);
        return result;
    }

    /**
     * 模拟批量同步
     */
    private async simulateBatchSync(
        batch: VideoRecord[],
        config: SyncConfig
    ): Promise<SyncResponseData> {
        // 模拟网络请求
        await delay(50 + Math.random() * 100);
        
        // 模拟一些记录同步成功，一些跳过，一些失败
        const syncedCount = Math.floor(batch.length * 0.8); // 80%成功
        const skippedCount = Math.floor(batch.length * 0.15); // 15%跳过
        const errorCount = batch.length - syncedCount - skippedCount; // 剩余失败
        
        const errors: Array<{ recordId: string; error: string }> = [];
        
        // 为失败的记录生成错误信息
        for (let i = syncedCount + skippedCount; i < batch.length; i++) {
            errors.push({
                recordId: batch[i].id,
                error: '网络超时或服务器错误'
            });
        }
        
        return {
            syncedCount,
            skippedCount,
            errorCount,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * 创建数据批次
     */
    private createBatches<T>(data: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * 验证同步参数
     */
    private validateSyncParams(
        type: SyncType,
        records: VideoRecord[],
        userProfile: UserProfile
    ): void {
        if (!type) {
            throw new Error('同步类型不能为空');
        }

        if (!Array.isArray(records)) {
            throw new Error('记录数据格式错误');
        }

        if (!userProfile || !userProfile.isLoggedIn) {
            throw new Error('用户未登录，无法进行同步');
        }

        if (!userProfile.email || !userProfile.username) {
            throw new Error('用户信息不完整，无法进行同步');
        }
    }

    /**
     * 测试API连接
     */
    public async testConnection(): Promise<boolean> {
        try {
            // 模拟连接测试
            await delay(500);
            return checkNetworkStatus();
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取同步状态
     */
    public async getSyncStatus(requestId: string): Promise<ApiResponse> {
        try {
            // 模拟获取同步状态
            await delay(100);
            return {
                success: true,
                data: {
                    status: 'completed',
                    progress: 100
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 取消同步操作
     */
    public async cancelSync(requestId: string): Promise<boolean> {
        try {
            // 模拟取消同步
            await delay(100);
            logAsync('INFO', '同步操作已取消', { requestId });
            return true;
        } catch (error: any) {
            logAsync('ERROR', '取消同步失败', { error: error.message, requestId });
            return false;
        }
    }

    /**
     * 设置API配置
     */
    public setConfig(config: { baseUrl?: string; timeout?: number }): void {
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
        if (config.timeout) {
            this.timeout = config.timeout;
        }
    }

    /**
     * 获取API配置
     */
    public getConfig(): { baseUrl: string; timeout: number } {
        return {
            baseUrl: this.baseUrl,
            timeout: this.timeout
        };
    }
}

/**
 * 获取API客户端实例
 */
export function getApiClient(): SyncApiClient {
    return SyncApiClient.getInstance();
}
