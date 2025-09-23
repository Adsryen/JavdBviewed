/**
 * 同步全部功能模块（已观看 + 想看）
 */

import { logAsync } from '../../logger';
import { userService } from '../../services/userService';
import { log } from '../../../utils/logController';
import { viewedSyncManager } from './viewedSync';
import { wantSyncManager } from './wantSync';
import type { SyncProgress, SyncResult } from '../types';
import type { SyncMode } from '../../config/syncConfig';

export interface AllSyncOptions {
    mode?: SyncMode;
    onProgress?: (progress: SyncProgress) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
    abortSignal?: AbortSignal;
}

export class AllSyncManager {
    private isRunning = false;
    private abortController: AbortController | null = null;

    /**
     * 检查是否正在同步
     */
    public isSyncing(): boolean {
        return this.isRunning || viewedSyncManager.isSyncing() || wantSyncManager.isSyncing();
    }

    /**
     * 开始同步全部（已观看 + 想看）
     */
    public async sync(options: AllSyncOptions = {}): Promise<SyncResult> {
        if (this.isSyncing()) {
            throw new Error('全部同步正在进行中，请等待完成');
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
            logAsync('INFO', '开始同步全部数据', { mode: options.mode });

            // 检查用户登录状态
            const userProfile = await userService.getUserProfile();
            if (!userProfile || !userProfile.isLoggedIn) {
                throw new Error('用户未登录，请先登录 JavDB 账号');
            }

            // 更新进度：准备阶段
            options.onProgress?.({
                percentage: 0,
                message: '准备同步全部数据...',
                stage: 'preparing'
            });

            let totalSynced = 0;
            let totalSkipped = 0;
            let totalErrors = 0;
            const details: string[] = [];

            // 第一阶段：同步已观看（独立100%）
            options.onProgress?.({
                percentage: 0,
                message: '开始同步已观看视频...',
                stage: 'preparing',
                phaseInfo: {
                    currentPhase: 1,
                    totalPhases: 2,
                    phaseName: '已观看'
                }
            });

            const viewedResult = await viewedSyncManager.sync({
                mode: options.mode,
                onProgress: (progress) => {
                    // 已观看阶段：独立计算100%
                    options.onProgress?.({
                        percentage: progress.percentage,
                        message: `${progress.message}`,
                        current: progress.current,
                        total: progress.total,
                        stage: progress.stage,
                        phaseInfo: {
                            currentPhase: 1,
                            totalPhases: 2,
                            phaseName: '已观看'
                        }
                    });
                },
                abortSignal: this.abortController.signal
            });

            if (viewedResult.success) {
                totalSynced += viewedResult.syncedCount ?? 0;
                totalSkipped += viewedResult.skippedCount ?? 0;
                totalErrors += viewedResult.errorCount ?? 0;
                details.push(`已观看: ${viewedResult.syncedCount}个`);
            } else {
                throw new Error(`已观看同步失败: ${viewedResult.message}`);
            }

            // 检查是否被取消
            if (this.abortController.signal.aborted) {
                throw new Error('同步已取消');
            }

            // 第二阶段：同步想看（独立100%）
            options.onProgress?.({
                percentage: 0,
                message: '开始同步想看视频...',
                stage: 'preparing',
                phaseInfo: {
                    currentPhase: 2,
                    totalPhases: 2,
                    phaseName: '想看'
                }
            });

            const wantResult = await wantSyncManager.sync({
                mode: options.mode,
                onProgress: (progress) => {
                    // 想看阶段：独立计算100%
                    options.onProgress?.({
                        percentage: progress.percentage,
                        message: `${progress.message}`,
                        current: progress.current,
                        total: progress.total,
                        stage: progress.stage,
                        phaseInfo: {
                            currentPhase: 2,
                            totalPhases: 2,
                            phaseName: '想看'
                        }
                    });
                },
                abortSignal: this.abortController.signal
            });

            if (wantResult.success) {
                totalSynced += wantResult.syncedCount ?? 0;
                totalSkipped += wantResult.skippedCount ?? 0;
                totalErrors += wantResult.errorCount ?? 0;
                details.push(`想看: ${wantResult.syncedCount}个`);
            } else {
                throw new Error(`想看同步失败: ${wantResult.message}`);
            }

            // 完成
            result = {
                success: true,
                message: `全部同步完成：同步 ${totalSynced} 个视频`,
                syncedCount: totalSynced,
                skippedCount: totalSkipped,
                errorCount: totalErrors,
                details: details.join(', ')
            };

            options.onProgress?.({
                percentage: 100,
                message: '全部同步完成',
                current: totalSynced,
                total: totalSynced,
                stage: 'complete'
            });

            logAsync('INFO', '全部同步完成', result);
            options.onComplete?.(result);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            
            if (errorMessage.includes('取消') || errorMessage.includes('abort')) {
                result = {
                    success: false,
                    message: '全部同步已取消',
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 0
                };
                logAsync('INFO', '全部同步被用户取消');
            } else {
                result = {
                    success: false,
                    message: `全部同步失败：${errorMessage}`,
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 1
                };
                logAsync('ERROR', '全部同步失败', { error: errorMessage });
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
        }
        
        // 同时取消子同步器
        viewedSyncManager.cancel();
        wantSyncManager.cancel();
        
        log.verbose('全部同步取消请求已发送');
    }
}

// 单例实例
export const allSyncManager = new AllSyncManager();
