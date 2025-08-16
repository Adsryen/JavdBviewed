/**
 * 同步演员功能模块
 */

import { logAsync } from '../../logger';
import { userService } from '../../services/userService';
import { showMessage } from '../../ui/toast';
import { actorSyncService } from '../../../services/actorSync';
import { log } from '../../../utils/logController';
import type { SyncProgress, SyncResult } from '../types';
import type { SyncMode } from '../../config/syncConfig';

export interface ActorSyncOptions {
    mode?: SyncMode;
    onProgress?: (progress: SyncProgress) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
    abortSignal?: AbortSignal;
}

export class ActorSyncManager {
    private isRunning = false;

    /**
     * 检查是否正在同步
     */
    public isSyncing(): boolean {
        return this.isRunning || actorSyncService.isSync();
    }

    /**
     * 开始同步演员
     */
    public async sync(options: ActorSyncOptions = {}): Promise<SyncResult> {
        if (this.isSyncing()) {
            throw new Error('演员同步正在进行中，请等待完成');
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        let result: SyncResult = {
            success: false,
            message: '同步失败',
            syncedCount: 0,
            skippedCount: 0,
            errorCount: 0
        };

        try {
            logAsync('INFO', '开始同步演员', { mode: options.mode });

            // 检查用户登录状态
            const userProfile = await userService.getUserProfile();
            if (!userProfile || !userProfile.isLoggedIn) {
                throw new Error('用户未登录，请先登录 JavDB 账号');
            }

            // 更新进度：准备阶段
            options.onProgress?.({
                percentage: 0,
                message: '准备同步收藏演员...',
                stage: 'preparing'
            });

            // 调用演员同步服务
            const syncResult = await actorSyncService.syncActors(
                options.mode === 'incremental' ? 'incremental' : 'full',
                (progress) => {
                    // 直接传递演员同步进度，保留stats信息
                    options.onProgress?.({
                        percentage: progress.percentage,
                        message: progress.message,
                        current: progress.current,
                        total: progress.total,
                        stage: progress.stage as any,
                        stats: progress.stats // 保留统计信息
                    });
                },
                false // 普通同步不强制更新
            );

            // 转换结果格式
            if (syncResult.success) {
                result = {
                    success: true,
                    message: `演员同步完成：新增 ${syncResult.newActors}，更新 ${syncResult.updatedActors}`,
                    syncedCount: syncResult.syncedCount,
                    skippedCount: syncResult.skippedCount,
                    errorCount: syncResult.errorCount,
                    details: `新增演员: ${syncResult.newActors}, 更新演员: ${syncResult.updatedActors}`
                };

                options.onProgress?.({
                    percentage: 100,
                    message: '演员同步完成',
                    current: syncResult.syncedCount,
                    total: syncResult.syncedCount,
                    stage: 'complete'
                });

                logAsync('INFO', '演员同步完成', result);
                options.onComplete?.(result);

                // 触发演员库刷新事件
                const refreshEvent = new CustomEvent('actors-data-updated');
                document.dispatchEvent(refreshEvent);

            } else {
                throw new Error(syncResult.errors.join(', ') || '演员同步失败');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            
            if (errorMessage.includes('取消') || errorMessage.includes('abort')) {
                result = {
                    success: false,
                    message: '演员同步已取消',
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 0
                };
                logAsync('INFO', '演员同步被用户取消');
            } else {
                result = {
                    success: false,
                    message: `演员同步失败：${errorMessage}`,
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 1
                };
                logAsync('ERROR', '演员同步失败', { error: errorMessage });
            }

            options.onError?.(error instanceof Error ? error : new Error(errorMessage));

        } finally {
            const duration = Date.now() - startTime;
            result.duration = duration;
            this.isRunning = false;
        }

        return result;
    }

    /**
     * 强制更新演员信息（包括性别和分类）
     */
    public async forceUpdate(options: ActorSyncOptions = {}): Promise<SyncResult> {
        if (this.isSyncing()) {
            throw new Error('演员同步正在进行中，请等待完成');
        }

        this.isRunning = true;
        const startTime = Date.now();

        let result: SyncResult = {
            success: false,
            message: '强制更新失败',
            syncedCount: 0,
            skippedCount: 0,
            errorCount: 0
        };

        try {
            logAsync('INFO', '开始强制更新演员');

            // 检查用户登录状态
            const userProfile = await userService.getUserProfile();
            if (!userProfile || !userProfile.isLoggedIn) {
                throw new Error('用户未登录，请先登录 JavDB 账号');
            }

            // 更新进度：准备阶段
            options.onProgress?.({
                percentage: 0,
                message: '准备强制更新演员信息...',
                stage: 'preparing' as any
            });

            // 调用演员同步服务，启用强制更新
            const syncResult = await actorSyncService.syncActors(
                'full', // 强制更新使用全量同步
                (progress) => {
                    // 直接传递演员同步进度，保留stats信息
                    options.onProgress?.({
                        percentage: progress.percentage,
                        message: progress.message,
                        current: progress.current,
                        total: progress.total,
                        stage: progress.stage as any,
                        stats: progress.stats // 保留统计信息
                    });
                },
                true // 启用强制更新
            );

            // 转换结果格式
            if (syncResult.success) {
                result = {
                    success: true,
                    message: `演员强制更新完成：新增 ${syncResult.newActors}，更新 ${syncResult.updatedActors}`,
                    syncedCount: syncResult.syncedCount,
                    skippedCount: syncResult.skippedCount,
                    errorCount: syncResult.errorCount,
                    details: `新增演员: ${syncResult.newActors}, 更新演员: ${syncResult.updatedActors}`
                };

                options.onProgress?.({
                    percentage: 100,
                    message: '演员强制更新完成',
                    current: syncResult.syncedCount,
                    total: syncResult.syncedCount,
                    stage: 'complete' as any
                });

                logAsync('INFO', '演员强制更新完成', result);
                options.onComplete?.(result);

                // 触发演员库刷新事件
                const refreshEvent = new CustomEvent('actors-data-updated');
                document.dispatchEvent(refreshEvent);

            } else {
                throw new Error(syncResult.errors.join(', ') || '演员强制更新失败');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';

            result = {
                success: false,
                message: `演员强制更新失败: ${errorMessage}`,
                syncedCount: 0,
                skippedCount: 0,
                errorCount: 1
            };

            logAsync('ERROR', '演员强制更新失败', { error: errorMessage });
            options.onError?.(error instanceof Error ? error : new Error(errorMessage));

        } finally {
            this.isRunning = false;
        }

        return result;
    }

    // updateGender 方法已移除，性别信息现在直接从分类页面获取

    /**
     * 取消同步
     */
    public cancel(): void {
        actorSyncService.cancelSync();
        log.verbose('演员同步取消请求已发送');
    }
}

// 单例实例
export const actorSyncManager = new ActorSyncManager();
