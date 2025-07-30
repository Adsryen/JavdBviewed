// src/services/actorSync.ts
// 演员数据同步服务

import type { 
    ActorRecord, 
    ActorSyncConfig, 
    ActorSyncProgress, 
    ActorSyncResult,
    ExtensionSettings 
} from '../types';
import { actorManager } from './actorManager';
import { getSettings } from '../utils/storage';

export class ActorSyncService {
    private abortController: AbortController | null = null;
    private isRunning = false;

    /**
     * 开始同步演员数据
     */
    async syncActors(
        type: 'full' | 'incremental' = 'full',
        onProgress?: (progress: ActorSyncProgress) => void
    ): Promise<ActorSyncResult> {
        if (this.isRunning) {
            throw new Error('演员同步正在进行中，请等待完成');
        }

        this.isRunning = true;
        this.abortController = new AbortController();
        
        const startTime = Date.now();
        const result: ActorSyncResult = {
            success: false,
            syncedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            newActors: 0,
            updatedActors: 0,
            errors: [],
            duration: 0
        };

        try {
            const settings = await getSettings();
            const config = settings.actorSync;

            if (!config.enabled) {
                throw new Error('演员同步功能未启用');
            }

            // 第一阶段：获取演员列表页面
            onProgress?.({
                stage: 'pages',
                current: 0,
                total: 1,
                percentage: 0,
                message: '正在获取收藏演员列表...'
            });

            const actorIds = await this.fetchActorListPages(config, onProgress);
            
            if (actorIds.length === 0) {
                onProgress?.({
                    stage: 'complete',
                    current: 0,
                    total: 0,
                    percentage: 100,
                    message: '未找到收藏演员'
                });
                
                result.success = true;
                result.duration = Date.now() - startTime;
                return result;
            }

            // 第二阶段：获取演员详情
            onProgress?.({
                stage: 'details',
                current: 0,
                total: actorIds.length,
                percentage: 0,
                message: '正在同步演员详情...'
            });

            const syncResults = await this.fetchActorDetails(
                actorIds, 
                config, 
                type,
                onProgress
            );

            result.syncedCount = syncResults.synced;
            result.skippedCount = syncResults.skipped;
            result.errorCount = syncResults.errors.length;
            result.newActors = syncResults.newActors;
            result.updatedActors = syncResults.updatedActors;
            result.errors = syncResults.errors;
            result.success = true;

            onProgress?.({
                stage: 'complete',
                current: actorIds.length,
                total: actorIds.length,
                percentage: 100,
                message: `同步完成：新增 ${result.newActors}，更新 ${result.updatedActors}`
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            result.errors.push(errorMessage);
            result.success = false;

            onProgress?.({
                stage: 'error',
                current: 0,
                total: 0,
                percentage: 0,
                message: `同步失败：${errorMessage}`,
                errors: result.errors
            });
        } finally {
            result.duration = Date.now() - startTime;
            this.isRunning = false;
            this.abortController = null;
        }

        return result;
    }

    /**
     * 取消正在进行的同步
     */
    cancelSync(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.isRunning = false;
    }

    /**
     * 检查是否正在同步
     */
    isSync(): boolean {
        return this.isRunning;
    }

    /**
     * 获取演员列表页面
     */
    private async fetchActorListPages(
        config: ActorSyncConfig,
        onProgress?: (progress: ActorSyncProgress) => void
    ): Promise<string[]> {
        const actorIds: string[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && !this.abortController?.signal.aborted) {
            try {
                const url = `${config.urls.collectionActors}?page=${page}`;
                
                onProgress?.({
                    stage: 'pages',
                    current: page,
                    total: page + 1, // 估算总页数
                    percentage: Math.min(90, page * 10), // 最多到90%
                    message: `正在获取第 ${page} 页演员列表...`
                });

                const response = await fetch(url, {
                    signal: this.abortController?.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                const pageActorIds = this.parseActorIdsFromHtml(html);
                
                if (pageActorIds.length === 0) {
                    hasMore = false;
                } else {
                    actorIds.push(...pageActorIds);
                    page++;
                    
                    // 请求间隔
                    if (hasMore) {
                        await this.delay(config.requestInterval * 1000);
                    }
                }

            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    throw new Error('同步已取消');
                }
                throw new Error(`获取演员列表失败：${error instanceof Error ? error.message : '未知错误'}`);
            }
        }

        return actorIds;
    }

    /**
     * 获取演员详情
     */
    private async fetchActorDetails(
        actorIds: string[],
        config: ActorSyncConfig,
        syncType: 'full' | 'incremental',
        onProgress?: (progress: ActorSyncProgress) => void
    ): Promise<{
        synced: number;
        skipped: number;
        newActors: number;
        updatedActors: number;
        errors: string[];
    }> {
        const result = {
            synced: 0,
            skipped: 0,
            newActors: 0,
            updatedActors: 0,
            errors: [] as string[]
        };

        for (let i = 0; i < actorIds.length; i++) {
            if (this.abortController?.signal.aborted) {
                throw new Error('同步已取消');
            }

            const actorId = actorIds[i];
            const progress = Math.round((i / actorIds.length) * 100);

            onProgress?.({
                stage: 'details',
                current: i + 1,
                total: actorIds.length,
                percentage: progress,
                message: `正在同步演员 ${i + 1}/${actorIds.length}...`
            });

            try {
                // 检查是否需要跳过（增量同步）
                if (syncType === 'incremental') {
                    const existingActor = await actorManager.getActorById(actorId);
                    if (existingActor && this.shouldSkipActor(existingActor)) {
                        result.skipped++;
                        continue;
                    }
                }

                const actorData = await this.fetchActorDetail(actorId, config);
                if (actorData) {
                    const existingActor = await actorManager.getActorById(actorId);
                    await actorManager.saveActor(actorData);
                    
                    if (existingActor) {
                        result.updatedActors++;
                    } else {
                        result.newActors++;
                    }
                    result.synced++;
                } else {
                    result.skipped++;
                }

            } catch (error) {
                const errorMsg = `演员 ${actorId}: ${error instanceof Error ? error.message : '未知错误'}`;
                result.errors.push(errorMsg);
                
                // 如果错误太多，停止同步
                if (result.errors.length >= config.maxRetries * 3) {
                    throw new Error('错误过多，停止同步');
                }
            }

            // 请求间隔
            if (i < actorIds.length - 1) {
                await this.delay(config.requestInterval * 1000);
            }
        }

        return result;
    }

    /**
     * 获取单个演员详情
     */
    private async fetchActorDetail(
        actorId: string,
        config: ActorSyncConfig
    ): Promise<ActorRecord | null> {
        const url = config.urls.actorDetail.replace('{{ACTOR_ID}}', actorId);
        
        let lastError: Error;
        for (let attempt = 0; attempt < config.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    signal: this.abortController?.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                return this.parseActorFromHtml(actorId, html);

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('未知错误');
                
                if (error instanceof Error && error.name === 'AbortError') {
                    throw error;
                }
                
                // 重试前等待
                if (attempt < config.maxRetries - 1) {
                    await this.delay(1000 * (attempt + 1));
                }
            }
        }

        throw lastError!;
    }

    /**
     * 从HTML解析演员ID列表
     */
    private parseActorIdsFromHtml(html: string): string[] {
        const actorIds: string[] = [];
        
        // 匹配演员链接的正则表达式
        const actorLinkRegex = /href="\/actors\/([^"]+)"/g;
        let match;
        
        while ((match = actorLinkRegex.exec(html)) !== null) {
            const actorId = match[1];
            if (actorId && !actorIds.includes(actorId)) {
                actorIds.push(actorId);
            }
        }
        
        return actorIds;
    }

    /**
     * 从HTML解析演员信息
     */
    private parseActorFromHtml(actorId: string, html: string): ActorRecord | null {
        try {
            // 这里需要根据JavDB的实际HTML结构来解析
            // 以下是示例解析逻辑，需要根据实际情况调整
            
            const nameMatch = html.match(/<h2[^>]*class="[^"]*actor-name[^"]*"[^>]*>([^<]+)</i);
            const name = nameMatch ? nameMatch[1].trim() : actorId;
            
            const avatarMatch = html.match(/<img[^>]*class="[^"]*actor-avatar[^"]*"[^>]*src="([^"]+)"/i);
            const avatarUrl = avatarMatch ? avatarMatch[1] : undefined;
            
            // 解析别名
            const aliases: string[] = [];
            const aliasMatches = html.matchAll(/<span[^>]*class="[^"]*alias[^"]*"[^>]*>([^<]+)</g);
            for (const match of aliasMatches) {
                aliases.push(match[1].trim());
            }
            
            // 解析性别（通常需要从页面内容推断）
            let gender: 'female' | 'male' | 'unknown' = 'unknown';
            if (html.includes('女优') || html.includes('actress')) {
                gender = 'female';
            } else if (html.includes('男优') || html.includes('actor')) {
                gender = 'male';
            }
            
            const now = Date.now();
            
            const actor: ActorRecord = {
                id: actorId,
                name,
                aliases,
                gender,
                avatarUrl,
                profileUrl: `https://javdb.com/actors/${actorId}`,
                createdAt: now,
                updatedAt: now,
                syncInfo: {
                    source: 'javdb',
                    lastSyncAt: now,
                    syncStatus: 'success'
                }
            };
            
            return actor;
            
        } catch (error) {
            console.error(`Failed to parse actor ${actorId}:`, error);
            return null;
        }
    }

    /**
     * 判断是否应该跳过演员（增量同步）
     */
    private shouldSkipActor(actor: ActorRecord): boolean {
        // 如果最近24小时内已同步，则跳过
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return actor.syncInfo?.lastSyncAt ? actor.syncInfo.lastSyncAt > dayAgo : false;
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 单例实例
export const actorSyncService = new ActorSyncService();
