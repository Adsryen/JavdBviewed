/**
 * 同步清单（我的清单 + 收藏的清单）功能模块
 */

import { logAsync } from '../../logger';
import { userService } from '../../services/userService';
import { log } from '../../../utils/logController';
import { getApiClient } from '../api';
import { getSyncConfig } from '../../config/syncConfig';
import type { SyncProgress, SyncResult } from '../types';

export interface ListsSyncOptions {
    mode?: string;
    resumeFromProgress?: boolean;
    onProgress?: (progress: SyncProgress) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
    abortSignal?: AbortSignal;
}

export class ListsSyncManager {
    private isRunning = false;
    private abortController: AbortController | null = null;

    public isSyncing(): boolean {
        return this.isRunning;
    }

    public async sync(options: ListsSyncOptions = {}): Promise<SyncResult> {
        if (this.isRunning) {
            throw new Error('清单同步正在进行中，请等待完成');
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
            logAsync('INFO', '开始同步清单（我的+收藏）');

            const userProfile = await userService.getUserProfile();
            if (!userProfile || !userProfile.isLoggedIn) {
                throw new Error('用户未登录，请先登录 JavDB 账号');
            }

            options.onProgress?.({
                percentage: 0,
                message: '准备同步清单...',
                stage: 'preparing'
            });

            const apiClient = getApiClient();
            const syncResponse = await apiClient.syncData(
                'lists',
                [],
                userProfile,
                getSyncConfig({ 
                    mode: options.mode || 'full',
                    resumeFromProgress: options.resumeFromProgress
                }),
                (progress) => {
                    const { current, total, stage, percentage, message } = progress;
                    options.onProgress?.({
                        percentage: percentage ?? 0,
                        message: message || '同步清单中...',
                        current,
                        total,
                        stage
                    });
                },
                this.abortController.signal
            );

            result = {
                success: true,
                message: syncResponse.message || `清单同步完成：同步 ${syncResponse.syncedCount} 个影片`,
                syncedCount: syncResponse.syncedCount,
                skippedCount: syncResponse.skippedCount,
                errorCount: syncResponse.errorCount,
                details: `新增: ${syncResponse.newRecords || 0}, 更新: ${syncResponse.updatedRecords || 0}`
            };

            options.onProgress?.({
                percentage: 100,
                message: '清单同步完成',
                current: syncResponse.syncedCount,
                total: syncResponse.syncedCount,
                stage: 'complete'
            });

            logAsync('INFO', '清单同步完成', result);
            options.onComplete?.(result);
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';

            if (errorMessage.includes('取消') || errorMessage.includes('abort')) {
                result = {
                    success: false,
                    message: '清单同步已取消',
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 0
                };
                logAsync('INFO', '清单同步被用户取消');
            } else {
                result = {
                    success: false,
                    message: `清单同步失败：${errorMessage}`,
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 1
                };
                logAsync('ERROR', '清单同步失败', { error: errorMessage });
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

    public cancel(): void {
        if (this.abortController) {
            this.abortController.abort();
            log.verbose('清单同步取消请求已发送');
        }
    }
}

export const listsSyncManager = new ListsSyncManager();
