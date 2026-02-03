/**
 * 同步想看视频功能模块
 */

import { logAsync } from '../../logger';
import { userService } from '../../services/userService';
import { log } from '../../../utils/logController';
import { getApiClient } from '../api';
import { getSyncConfig } from '../../config/syncConfig';
import type { SyncProgress, SyncResult } from '../types';
import type { SyncMode } from '../../config/syncConfig';

export interface WantSyncOptions {
    mode?: SyncMode;
    onProgress?: (progress: SyncProgress) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
    abortSignal?: AbortSignal;
}

export class WantSyncManager {
    private isRunning = false;
    private abortController: AbortController | null = null;

    /**
     * 检查是否正在同步
     */
    public isSyncing(): boolean {
        return this.isRunning;
    }

    /**
     * 开始同步想看视频
     */
    public async sync(options: WantSyncOptions = {}): Promise<SyncResult> {
        if (this.isRunning) {
            throw new Error('想看同步正在进行中，请等待完成');
        }

        this.isRunning = true;
        this.abortController = new AbortController();
        
        const startTime = Date.now();
        let result: SyncResult = {
            success: false,
            message: '同步失败',
            syncedCount: 0,
            skippedCount: 0,
            errorCount: 0
        };

        try {
            logAsync('INFO', '开始同步想看视频', { mode: options.mode });

            // 检查用户登录状态
            const userProfile = await userService.getUserProfile();
            if (!userProfile || !userProfile.isLoggedIn) {
                throw new Error('用户未登录，请先登录 JavDB 账号');
            }

            // 更新进度：准备阶段
            options.onProgress?.({
                percentage: 0,
                message: '准备同步想看列表...',
                stage: 'preparing'
            });

            // 调用API进行同步
            const apiClient = getApiClient();
            const syncResponse = await apiClient.syncData(
                'want',
                [], // 想看同步不需要本地数据
                userProfile,
                getSyncConfig({ 
                    mode: options.mode || 'full',
                    resumeFromProgress: options.resumeFromProgress || false
                }),
                (progress) => {
                    const { current, total, stage, percentage, message } = progress;
                    
                    let displayMessage = message;
                    if (stage === 'pages') {
                        displayMessage = `获取想看列表 (${current}/${total}页)...`;
                    } else if (stage === 'details') {
                        displayMessage = `同步想看视频 (${current}/${total})...`;
                    }

                    options.onProgress?.({
                        percentage: percentage || Math.round((current / total) * 100),
                        message: displayMessage,
                        current,
                        total,
                        stage
                    });
                },
                this.abortController.signal
            );

            // 完成
            result = {
                success: true,
                message: `想看同步完成：同步 ${syncResponse.syncedCount} 个视频`,
                syncedCount: syncResponse.syncedCount,
                skippedCount: syncResponse.skippedCount,
                errorCount: syncResponse.errorCount,
                details: `新增: ${syncResponse.newRecords || 0}, 更新: ${syncResponse.updatedRecords || 0}`
            };

            options.onProgress?.({
                percentage: 100,
                message: '想看同步完成',
                current: syncResponse.syncedCount,
                total: syncResponse.syncedCount,
                stage: 'complete'
            });

            logAsync('INFO', '想看同步完成', result);
            options.onComplete?.(result);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            
            if (errorMessage.includes('取消') || errorMessage.includes('abort')) {
                result = {
                    success: false,
                    message: '想看同步已取消',
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 0
                };
                logAsync('INFO', '想看同步被用户取消');
            } else {
                result = {
                    success: false,
                    message: `想看同步失败：${errorMessage}`,
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 1
                };
                logAsync('ERROR', '想看同步失败', { error: errorMessage });
            }

            options.onError?.(error instanceof Error ? error : new Error(errorMessage));

        } finally {
            const duration = Date.now() - startTime;
            result.duration = duration;
            this.isRunning = false;
            this.abortController = null;
        }

        return result;
    }

    /**
     * 取消同步
     */
    public cancel(): void {
        if (this.abortController) {
            this.abortController.abort();
            log.verbose('想看同步取消请求已发送');
        }
    }
}

// 单例实例
export const wantSyncManager = new WantSyncManager();
