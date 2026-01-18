/**
 * 数据同步API调用模块
 */

import { logAsync } from '../logger';
import type { VideoRecord, UserProfile, ListRecord } from '../../types';
import type {
    SyncType,
    SyncResponseData,
    SyncConfig
} from './types';
import { SyncCancelledError } from './types';
import { getSettings, getValue, setValue } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/config';
import { VIDEO_STATUS } from '../../utils/config';
import { dbViewedPut } from '../dbClient';
import { isCloudflareChallenge, handleCloudflareVerification } from './cloudflareVerification';
import { saveSyncProgress, getSavedSyncProgress, clearSyncProgress } from './progressManager';
import type { SavedSyncProgress } from '../config/syncConfig';

/**
 * 视频数据接口
 */
interface VideoData {
    urlId: string;
    realId?: string;
}

/**
 * 同步类型配置接口
 */
interface SyncTypeConfig {
    url?: string;
    status?: 'want' | 'viewed';
    displayName: string;
    countField?: 'wantCount' | 'watchedCount';
}

interface ListPageItem {
    id: string;
    name: string;
    moviesCount?: number;
    clickedCount?: number;
}

/**
 * API客户端类
 */
export class ApiClient {
    private timeout: number;
    private retryCount: number;
    private retryDelay: number;

    constructor(config: {
        timeout?: number;
        retryCount?: number;
        retryDelay?: number;
    } = {}) {
        this.timeout = config.timeout ?? 30000;
        this.retryCount = config.retryCount ?? 3;
        this.retryDelay = config.retryDelay ?? 1000;
    }

    private getOriginFromUrl(url: string): string {
        try {
            const u = new URL(String(url));
            return u.origin;
        } catch {
            return 'https://javdb.com';
        }
    }

    private async getPreferredJavdbOrigin(): Promise<string> {
        try {
            const settings = await getSettings();
            const urls: any = settings?.dataSync?.urls || {};
            const candidate = String(urls.wantWatch || urls.watchedVideos || urls.collectionActors || '').trim();
            if (candidate) return this.getOriginFromUrl(candidate);
        } catch {
            // ignore
        }
        return 'https://javdb.com';
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
        const typeConfig = await this.getSyncTypeConfig(type);
        
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
        _localData: VideoRecord[],
        userProfile: UserProfile,
        config: SyncConfig,
        onProgress?: (progress: any) => void,
        abortSignal?: AbortSignal
    ): Promise<SyncResponseData> {
        // 对于想看和已观看类型，使用真实API同步
        if (type === 'want' || type === 'viewed') {
            return await this.syncUserVideos(type, userProfile, config, onProgress, abortSignal);
        }

        if (type === 'lists') {
            return await this.syncUserLists(userProfile, config, onProgress, abortSignal);
        }

        // 其他类型暂时返回空结果
        return {
            success: true,
            syncedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            newRecords: 0,
            updatedRecords: 0,
            message: `${type} 类型同步暂未实现`
        };
    }

    /**
     * 同步用户视频（想看/已观看）
     */
    private async syncUserVideos(
        type: 'want' | 'viewed',
        userProfile: UserProfile,
        config: SyncConfig,
        onProgress?: (progress: any) => void,
        abortSignal?: AbortSignal
    ): Promise<SyncResponseData> {
        // 获取同步类型配置
        const syncConfig = await this.getSyncTypeConfig(type);
        if (!syncConfig.url || !syncConfig.countField || !syncConfig.status) {
            throw new Error('同步配置无效');
        }
        logAsync('INFO', `开始同步${syncConfig.displayName}视频列表`, {
            userEmail: userProfile.email,
            type,
            url: syncConfig.url,
            resumeMode: config.resumeFromProgress
        });

        try {
            // 1. 刷新用户账号信息，获取视频数量
            logAsync('INFO', '正在刷新用户账号信息...');
            const refreshedProfile = await this.refreshUserProfile();

            if (!refreshedProfile || !refreshedProfile.serverStats) {
                throw new Error('无法获取用户账号信息或统计数据');
            }

            // 根据同步类型获取对应的数量
            const videoCount = refreshedProfile.serverStats[syncConfig.countField] || 0;
            logAsync('INFO', `用户${syncConfig.displayName}统计`, {
                [syncConfig.countField]: videoCount,
                wantCount: refreshedProfile.serverStats.wantCount,
                watchedCount: refreshedProfile.serverStats.watchedCount
            });

            if (videoCount === 0) {
                logAsync('INFO', `用户没有${syncConfig.displayName}的视频`);
                return {
                    success: true,
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 0,
                    newRecords: 0,
                    updatedRecords: 0,
                    message: `没有找到${syncConfig.displayName}视频`
                };
            }

            // 2. 计算页数（每页20个）
            const totalPages = Math.ceil(videoCount / 20);
            logAsync('INFO', `用户有${videoCount}个${syncConfig.displayName}视频，共${totalPages}页`);

            // 3. 初始化同步状态
            const settings = await getSettings();
            const requestInterval = settings.dataSync.requestInterval * 1000; // 转换为毫秒

            let syncedCount = 0;
            let errorCount = 0;
            let newRecords = 0;
            let updatedRecords = 0;
            let processedVideos = 0; // 已处理的视频总数
            let startPage = 1;
            let startVideoIndex = 0;

            // 检查是否有保存的进度
            let savedProgress: SavedSyncProgress | null = null;
            if (config.resumeFromProgress) {
                savedProgress = await getSavedSyncProgress(type, userProfile.email);
                if (savedProgress) {
                    // 恢复进度
                    startPage = savedProgress.currentPage;
                    startVideoIndex = savedProgress.currentVideoIndex;
                    syncedCount = savedProgress.syncedCount;
                    errorCount = savedProgress.errorCount;
                    newRecords = savedProgress.newRecords;
                    updatedRecords = savedProgress.updatedRecords;
                    processedVideos = syncedCount + errorCount;
                    
                    logAsync('INFO', `从上次进度继续同步`, {
                        startPage,
                        startVideoIndex,
                        syncedCount,
                        errorCount,
                        processedVideos
                    });
                }
            }

            // 增量同步相关变量
            const isIncrementalMode = config.mode === 'incremental';
            let existingRecordsCount = 0;
            let shouldStopIncremental = false;
            const incrementalTolerance = config.incrementalTolerance || 20;

            // 如果是增量同步，先获取本地已存在的记录
            let localRecords: Record<string, any> = {};
            if (isIncrementalMode) {
                try {
                    // 所有视频记录都存储在同一个键中，通过status字段区分
                    const allRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                    // 过滤出对应类型的记录
                    localRecords = Object.fromEntries(
                        Object.entries(allRecords).filter(([_, record]) => record.status === type)
                    );
                    logAsync('INFO', `增量同步模式：本地已有${Object.keys(localRecords).length}条${type}记录`);
                } catch (error: any) {
                    logAsync('WARN', '获取本地记录失败，将使用全量同步模式', { error: error.message });
                }
            }

            // 4. 分页处理：获取一页就立即同步这一页的视频
            logAsync('INFO', `开始分页处理${syncConfig.displayName}视频...`, {
                startPage,
                totalPages,
                startVideoIndex
            });

            for (let page = startPage; page <= totalPages; page++) {
                try {
                    // 检查是否已取消
                    if (abortSignal?.aborted) {
                        logAsync('INFO', `同步在第${page}页被取消，保存进度`);
                        // 保存当前进度
                        await saveSyncProgress({
                            type,
                            userEmail: userProfile.email,
                            currentPage: page,
                            currentVideoIndex: startVideoIndex,
                            totalPages,
                            videoCount,
                            syncedCount,
                            errorCount,
                            newRecords,
                            updatedRecords,
                            timestamp: Date.now(),
                            mode: config.mode || 'full'
                        });
                        throw new SyncCancelledError('用户取消了同步操作');
                    }

                    // 4.1 获取当前页的视频数据
                    logAsync('INFO', `正在获取第${page}页${syncConfig.displayName}视频...`);
                    const videoData = await this.fetchVideoDataFromPage(type, page);

                    // 更新页面进度
                    onProgress?.({
                        current: page,
                        total: totalPages,
                        percentage: Math.round((page / totalPages) * 100),
                        message: `获取${syncConfig.displayName}列表 (${page}/${totalPages}页)...`,
                        stage: 'pages'
                    });

                    logAsync('INFO', `获取第${page}页${syncConfig.displayName}视频完成`, {
                        page,
                        totalPages,
                        currentPageCount: videoData.length,
                        videoData: videoData.slice(0, 3) // 显示前3个作为示例
                    });

                    // 4.2 立即处理当前页的每个视频
                    // 如果是恢复的第一页，从保存的索引开始
                    const startIdx = (page === startPage) ? startVideoIndex : 0;
                    
                    for (let i = startIdx; i < videoData.length; i++) {
                        // 检查是否已取消
                        if (abortSignal?.aborted) {
                            logAsync('INFO', `同步在视频 ${i} 被取消，保存进度`);
                            // 保存当前进度
                            await saveSyncProgress({
                                type,
                                userEmail: userProfile.email,
                                currentPage: page,
                                currentVideoIndex: i,
                                totalPages,
                                videoCount,
                                syncedCount,
                                errorCount,
                                newRecords,
                                updatedRecords,
                                timestamp: Date.now(),
                                mode: config.mode || 'full'
                            });
                            throw new SyncCancelledError('用户取消了同步操作');
                        }

                        const video = videoData[i];
                        const urlVideoId = video.urlId;

                        try {
                            // 增量同步检查
                            if (isIncrementalMode && localRecords[urlVideoId]) {
                                existingRecordsCount++;
                                logAsync('INFO', `增量同步：跳过已存在的视频 ${urlVideoId}`, {
                                    existingRecordsCount,
                                    incrementalTolerance
                                });

                                // 检查是否超过容忍度
                                if (existingRecordsCount >= incrementalTolerance) {
                                    shouldStopIncremental = true;
                                    logAsync('INFO', `增量同步：达到容忍度${incrementalTolerance}，准备停止同步`);
                                    break;
                                }
                                continue;
                            }

                            // 获取视频详情页面
                            const videoDetail = await this.fetchVideoDetail(urlVideoId);

                            if (videoDetail) {
                                // 使用从详情页提取的真正ID，如果没有则使用URL ID
                                const realVideoId = videoDetail.id || urlVideoId;

                                // 检查是否为新记录
                                const existingRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                                const isNewRecord = !existingRecords[realVideoId];

                                // 保存到本地存储，传入URL ID用于构建正确的javdbUrl
                                await this.saveVideoRecord(realVideoId, videoDetail, syncConfig.status, urlVideoId);
                                syncedCount++;

                                if (isNewRecord) {
                                    newRecords++;
                                } else {
                                    updatedRecords++;
                                }

                                logAsync('INFO', `成功同步${syncConfig.displayName}视频 ${realVideoId}`);
                            } else {
                                errorCount++;
                                logAsync('ERROR', `视频详情获取失败: ${urlVideoId}`);
                            }
                        } catch (error: any) {
                            errorCount++;
                            logAsync('ERROR', `同步视频 ${urlVideoId} 失败`, { error: error.message });
                        }

                        // 更新视频处理进度
                        processedVideos++;
                        const detailProgress = Math.round((processedVideos / videoCount) * 100);
                        onProgress?.({
                            current: processedVideos,
                            total: videoCount,
                            percentage: detailProgress,
                            message: `同步${syncConfig.displayName}视频 (${processedVideos}/${videoCount})...`,
                            stage: 'details'
                        });

                        // 请求间隔
                        if (i < videoData.length - 1 || page < totalPages) {
                            await this.delay(requestInterval);
                        }
                    }

                    // 如果是增量同步且应该停止，则跳出页面循环
                    if (isIncrementalMode && shouldStopIncremental) {
                        logAsync('INFO', `增量同步提前结束，已处理${page}页，共${processedVideos}个视频`);
                        break;
                    }

                    // 页面间隔
                    if (page < totalPages) {
                        logAsync('INFO', `等待1秒后获取下一页...`);
                        await this.delay(1000); // 页面间隔1秒
                    }

                } catch (error: any) {
                    logAsync('ERROR', `处理第${page}页${syncConfig.displayName}视频失败`, {
                        page,
                        totalPages,
                        error: error.message
                    });

                    // 如果是取消错误，直接抛出
                    if (error instanceof SyncCancelledError) {
                        throw error;
                    }

                    // 如果是验证错误，保存进度后抛出
                    if (error.message && error.message.includes('Cloudflare')) {
                        logAsync('INFO', '遇到Cloudflare验证，保存进度');
                        await saveSyncProgress({
                            type,
                            userEmail: userProfile.email,
                            currentPage: page,
                            currentVideoIndex: 0,
                            totalPages,
                            videoCount,
                            syncedCount,
                            errorCount,
                            newRecords,
                            updatedRecords,
                            timestamp: Date.now(),
                            mode: config.mode || 'full'
                        });
                        throw error;
                    }

                    // 其他错误继续处理下一页
                    errorCount++;
                }
            }

            // 同步完成，清除保存的进度
            await clearSyncProgress();
            logAsync('INFO', '同步完成，已清除保存的进度');

            const result = {
                success: true,
                syncedCount,
                skippedCount: 0,
                errorCount,
                newRecords,
                updatedRecords,
                message: `同步完成：新增 ${newRecords}，更新 ${updatedRecords}`
            };

            logAsync('INFO', `${syncConfig.displayName}视频同步完成`, result);
            return result;

        } catch (error: any) {
            if (error instanceof SyncCancelledError) {
                logAsync('INFO', `${syncConfig.displayName}同步被用户取消`, { reason: error.message });
            } else {
                logAsync('ERROR', `同步${syncConfig.displayName}视频失败`, { error: error.message });
            }
            throw error;
        }
    }

    /**
     * 获取同步类型配置
     */
    private async getSyncTypeConfig(type: SyncType): Promise<SyncTypeConfig> {
        // 获取用户设置的URL
        const settings = await getValue<any>('settings', {});
        const dataSyncUrls = settings.dataSync?.urls || {};

        const configs: Record<SyncType, SyncTypeConfig> = {
            viewed: {
                url: dataSyncUrls.watchedVideos || 'https://javdb.com/users/watched_videos',
                status: 'viewed',
                displayName: '已观看',
                countField: 'watchedCount'
            },
            want: {
                url: dataSyncUrls.wantWatch || 'https://javdb.com/users/want_watch_videos',
                status: 'want',
                displayName: '想看',
                countField: 'wantCount'
            },
            actors: {
                url: dataSyncUrls.collectionActors || 'https://javdb.com/users/collection_actors',
                status: 'viewed', // 演员同步使用viewed状态
                displayName: '演员',
                countField: 'watchedCount'
            },
            'actors-gender': {
                url: dataSyncUrls.collectionActors || 'https://javdb.com/users/collection_actors',
                status: 'viewed',
                displayName: '演员性别',
                countField: 'watchedCount'
            },
            all: {
                url: dataSyncUrls.wantWatch || 'https://javdb.com/users/want_watch_videos',
                status: 'viewed',
                displayName: '全部',
                countField: 'watchedCount'
            },
            lists: {
                url: 'https://javdb.com/users/lists',
                displayName: '清单'
            }
        };

        const config = configs[type];
        const defaultUrl = (() => {
            switch (type) {
                case 'want':
                    return 'https://javdb.com/users/want_watch_videos';
                case 'viewed':
                    return 'https://javdb.com/users/watched_videos';
                case 'actors':
                    return 'https://javdb.com/users/collection_actors';
                case 'actors-gender':
                    return 'https://javdb.com/users/collection_actors';
                case 'all':
                    return 'https://javdb.com/users/want_watch_videos';
                case 'lists':
                    return 'https://javdb.com/users/lists';
                default:
                    return config?.url;
            }
        })();
        logAsync('INFO', `获取同步配置: ${type}`, {
            url: config.url,
            displayName: config.displayName,
            isCustomUrl: config.url !== defaultUrl
        });

        return config;
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 带重试与超时的请求封装（支持 Cloudflare 验证）
     */
    private async fetchWithRetry(url: string, init: RequestInit = {}): Promise<Response> {
        const maxAttempts = Math.max(1, this.retryCount);
        let lastError: any = null;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const signal = init.signal ?? AbortSignal.timeout(this.timeout);
                const res = await fetch(url, { ...init, signal });
                
                // 检查是否为 Cloudflare 验证页面
                if (res.ok || res.status === 403 || res.status === 503) {
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('text/html')) {
                        const html = await res.text();
                        
                        // 检测 Cloudflare 验证
                        if (isCloudflareChallenge(html)) {
                            logAsync('WARN', 'Cloudflare 人机验证触发', { url, attempt });
                            
                            // 显示验证窗口
                            const verificationResult = await handleCloudflareVerification(url);
                            
                            if (!verificationResult.success) {
                                throw new Error(verificationResult.error || 'Cloudflare 验证失败');
                            }
                            
                            // 验证成功，重新请求
                            logAsync('INFO', 'Cloudflare 验证成功，重新请求', { url });
                            const retryRes = await fetch(url, { ...init, signal });
                            
                            // 再次检查是否还是验证页面
                            if (retryRes.ok || retryRes.status === 403 || retryRes.status === 503) {
                                const retryContentType = retryRes.headers.get('content-type') || '';
                                if (retryContentType.includes('text/html')) {
                                    const retryHtml = await retryRes.text();
                                    if (isCloudflareChallenge(retryHtml)) {
                                        throw new Error('验证后仍然遇到 Cloudflare 挑战，请稍后重试');
                                    }
                                    // 返回包含HTML的响应（需要重新构造）
                                    return new Response(retryHtml, {
                                        status: retryRes.status,
                                        statusText: retryRes.statusText,
                                        headers: retryRes.headers
                                    });
                                }
                            }
                            
                            return retryRes;
                        }
                        
                        // 不是验证页面，返回包含HTML的响应
                        return new Response(html, {
                            status: res.status,
                            statusText: res.statusText,
                            headers: res.headers
                        });
                    }
                }
                
                // 对 5xx/429 进行重试，其余错误直接返回
                if (!res.ok && (res.status >= 500 || res.status === 429)) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                
                return res;
            } catch (err) {
                lastError = err;
                if (attempt < maxAttempts - 1) {
                    await this.delay(this.retryDelay);
                    continue;
                }
                throw err;
            }
        }
        throw lastError;
    }

    // 已移除未使用的网络连通性检查方法（checkNetworkStatus），避免 TS6133 未使用告警

    /**
     * 刷新用户账号信息
     */
    private async refreshUserProfile(): Promise<UserProfile | null> {
        try {
            logAsync('INFO', '发送用户信息刷新请求到background script');

            // 发送消息到background script获取用户信息
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'fetch-user-profile' }, (response) => {
                    logAsync('INFO', '收到background script响应', {
                        success: response?.success,
                        hasProfile: !!response?.profile,
                        error: response?.error
                    });

                    if (response?.success) {
                        logAsync('INFO', '用户信息刷新成功', {
                            email: response.profile?.email,
                            username: response.profile?.username,
                            isLoggedIn: response.profile?.isLoggedIn,
                            hasServerStats: !!response.profile?.serverStats
                        });
                        resolve(response.profile);
                    } else {
                        logAsync('ERROR', '用户信息刷新失败', { error: response?.error });
                        resolve(null);
                    }
                });
            });
        } catch (error: any) {
            logAsync('ERROR', '刷新用户账号信息异常', { error: error.message });
            return null;
        }
    }
    

    /**
     * 从指定页面获取视频数据列表（包含URL ID和真实番号）
     */
    private async fetchVideoDataFromPage(type: 'want' | 'viewed', page: number): Promise<VideoData[]> {
        // 获取同步类型配置
        const syncConfig = await this.getSyncTypeConfig(type);
        const url = `${syncConfig.url}?page=${page}`;
        logAsync('INFO', `请求${syncConfig.displayName}视频页面`, { page, url, baseUrl: syncConfig.url });

        try {
            const response = await this.fetchWithRetry(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0'
                }
            });

            logAsync('INFO', `${syncConfig.displayName}视频页面响应`, {
                page,
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            logAsync('INFO', `${syncConfig.displayName}视频页面HTML获取成功`, {
                page,
                htmlLength: html.length,
                hasVideoContent: html.includes('/v/'),
                hasMovieList: html.includes('movie-list')
            });

            const videoData = this.parseVideoDataFromHTML(html);
            logAsync('INFO', `${syncConfig.displayName}视频页面解析完成`, {
                page,
                videoCount: videoData.length,
                withRealId: videoData.filter(v => v.realId).length,
                videoData: videoData.slice(0, 3) // 显示前3个作为示例
            });

            return videoData;

        } catch (error: any) {
            logAsync('ERROR', `获取${syncConfig.displayName}视频页面失败`, { page, url, error: error.message });
            throw error;
        }
    }

    /**
     * 从页面HTML中解析视频数据（URL ID和真实番号）
     */
    private parseVideoDataFromHTML(html: string): VideoData[] {
        const videoData: VideoData[] = [];

        try {
            logAsync('INFO', '开始解析视频页面HTML', {
                htmlLength: html.length,
                hasVideoLinks: html.includes('/v/'),
                hasMovieList: html.includes('movie-list'),
                hasVideoItems: html.includes('class="item"')
            });

            // 方法1：尝试同时获取URL ID和真实番号
            const itemRegex = /<a[^>]*href="\/v\/([a-zA-Z0-9\-_]+)"[^>]*>[\s\S]*?<div class="video-title"[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>[\s\S]*?<\/a>/g;
            let itemMatch;
            const processedUrlIds = new Set<string>();

            while ((itemMatch = itemRegex.exec(html)) !== null) {
                const urlId = itemMatch[1];
                const realId = itemMatch[2]?.trim();

                if (urlId && !processedUrlIds.has(urlId)) {
                    processedUrlIds.add(urlId);
                    videoData.push({ urlId, realId });
                    logAsync('INFO', `找到视频: ${urlId} -> ${realId || '未知番号'}`);
                }
            }

            // 方法2：如果方法1没有找到足够的数据，回退到简单的URL ID匹配
            if (videoData.length === 0) {
                logAsync('INFO', '使用备用解析方法（仅URL ID）');
                const hrefRegex = /href="\/v\/([a-zA-Z0-9\-_]+)"(?![^>]*reviews)/g;
                let hrefMatch;
                while ((hrefMatch = hrefRegex.exec(html)) !== null) {
                    const urlId = hrefMatch[1];
                    if (urlId && urlId.length >= 2 && !processedUrlIds.has(urlId)) {
                        processedUrlIds.add(urlId);
                        videoData.push({ urlId });
                        logAsync('INFO', `找到URL ID: ${urlId}`);
                    }
                }
            }

            logAsync('INFO', `HTML解析完成`, {
                totalMatches: videoData.length,
                withRealId: videoData.filter(v => v.realId).length,
                onlyUrlId: videoData.filter(v => !v.realId).length,
                videoData: videoData.slice(0, 5) // 显示前5个
            });

            return videoData;

        } catch (error: any) {
            logAsync('ERROR', '解析视频页面HTML失败', { error: error.message });
            return [];
        }
    }

    /**
     * 获取视频详情
     */
    private async fetchVideoDetail(urlVideoId: string): Promise<Partial<VideoRecord> | null> {
        const origin = await this.getPreferredJavdbOrigin();
        const detailUrl = `${origin}/v/${urlVideoId}`;
        logAsync('INFO', `获取视频详情: ${urlVideoId}`, { detailUrl });

        try {
            const response = await this.fetchWithRetry(detailUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                logAsync('ERROR', `视频详情页面请求失败: ${urlVideoId}`, {
                    status: response.status,
                    statusText: response.statusText
                });
                return null;
            }

            const html = await response.text();
            logAsync('INFO', `视频详情页面HTML获取成功: ${urlVideoId}`, {
                htmlLength: html.length,
                hasTitle: html.includes('<title>'),
                hasVideoInfo: html.includes('video-meta')
            });

            // 解析视频详情
            const videoData = this.parseVideoDetailFromHTML(html, urlVideoId);

            if (videoData) {
                logAsync('INFO', `视频详情解析成功: ${urlVideoId}`, {
                    realId: videoData.id,
                    title: videoData.title?.substring(0, 50),
                    tagsCount: videoData.tags?.length || 0,
                    hasReleaseDate: !!videoData.releaseDate,
                    hasImage: !!videoData.javdbImage
                });
            } else {
                logAsync('WARN', `视频详情解析失败: ${urlVideoId}`);
            }

            return videoData;

        } catch (error: any) {
            logAsync('ERROR', `获取视频详情异常: ${urlVideoId}`, { error: error.message });
            return null;
        }
    }

    /**
     * 从HTML中解析视频详情
     */
    private parseVideoDetailFromHTML(html: string, urlVideoId: string): Partial<VideoRecord> | null {
        try {
            // 首先提取真正的视频ID
            const realVideoId = this.extractVideoIdFromDetailHTML(html);
            const videoId = realVideoId || urlVideoId; // 如果提取失败，使用URL中的ID作为备选

            logAsync('INFO', `视频ID解析结果`, {
                urlVideoId,
                realVideoId,
                finalVideoId: videoId
            });

            // 解析标题 - 优化逻辑，移除视频ID前缀
            let title = '';

            // 方法1: 从页面标题中获取并移除ID前缀
            const titleMatch = html.match(/<title>([^|]+)/);
            if (titleMatch) {
                const rawTitle = titleMatch[1].trim();
                // 移除视频ID前缀（如 "DVAJ-700 " -> ""）
                const titleWithoutId = rawTitle.replace(/^[A-Z0-9\-]+\s+/, '');
                title = titleWithoutId || rawTitle; // 如果移除后为空，使用原标题

                logAsync('INFO', `标题解析: "${rawTitle}" -> "${title}"`);
            }

            // 方法2: 如果标题为空，尝试从其他地方获取
            if (!title) {
                // 尝试从h2标题获取
                const h2TitleMatch = html.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>/);
                if (h2TitleMatch) {
                    const h2Title = h2TitleMatch[1].trim();
                    const titleWithoutId = h2Title.replace(/^[A-Z0-9\-]+\s+/, '');
                    title = titleWithoutId || h2Title;
                    logAsync('INFO', `从H2标题解析: "${h2Title}" -> "${title}"`);
                }
            }

            // 解析发布日期
            let releaseDate: string | undefined;

            // 方法1: 查找包含"日期"的panel-block
            const panelBlockRegex = /<div[^>]*class="[^"]*panel-block[^"]*"[^>]*>[\s\S]*?<strong[^>]*>[^<]*日期[^<]*<\/strong>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]+)<\/span>/g;
            let match = panelBlockRegex.exec(html);
            if (match) {
                releaseDate = match[1].trim();
            }

            // 方法2: 如果没找到，尝试其他模式
            if (!releaseDate) {
                const dateRegex = /日期[^>]*>[\s\S]*?(\d{4}-\d{2}-\d{2})/;
                const dateMatch = html.match(dateRegex);
                if (dateMatch) {
                    releaseDate = dateMatch[1];
                }
            }

            // 解析标签 - 参考刷新源数据的完善逻辑
            const tags: string[] = [];

            // 方法1：查找包含"類別:"的panel-block（最准确）
            const tagsMatch = html.match(/<div[^>]*class="[^"]*panel-block[^"]*"[^>]*>[\s\S]*?<strong>類別:<\/strong>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
            if (tagsMatch) {
                const tagsHtml = tagsMatch[1];
                logAsync('INFO', `找到标签HTML片段: ${tagsHtml.substring(0, 200)}...`);

                const tagMatches = tagsHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/g);
                for (const tagMatch of tagMatches) {
                    const tag = tagMatch[1].trim();
                    if (tag && !tags.includes(tag)) {
                        tags.push(tag);
                        logAsync('INFO', `找到标签: ${tag}`);
                    }
                }
            }

            // 方法2：如果没找到，尝试备用选择器
            if (tags.length === 0) {
                logAsync('WARN', '未找到類別panel-block，尝试备用选择器...');

                const altSelectors = [
                    /<a[^>]*href="\/genres\/[^"]*"[^>]*>([^<]+)<\/a>/g,  // 指向genres页面的链接
                    /<a[^>]*href="\/tags\/[^"]*"[^>]*>([^<]+)<\/a>/g,    // 指向tags页面的链接
                ];

                for (const regex of altSelectors) {
                    let tagMatch;
                    while ((tagMatch = regex.exec(html)) !== null) {
                        const tag = tagMatch[1].trim();
                        if (tag && !tags.includes(tag)) {
                            tags.push(tag);
                            logAsync('INFO', `备用方法找到标签: ${tag}`);
                        }
                    }

                    if (tags.length > 0) {
                        logAsync('INFO', `备用选择器成功，找到${tags.length}个标签`);
                        break;
                    }
                }
            }

            if (tags.length === 0) {
                logAsync('WARN', `未找到任何标签: ${urlVideoId}`);
            } else {
                logAsync('INFO', `标签解析完成: [${tags.join(', ')}]`);
            }

            // 解析封面图片 - 参考刷新源数据的完善逻辑
            let javdbImage: string | undefined;

            // 方法1：优先查找jdbstatic.com的封面图片（最可靠）
            const jdbstaticCoverMatch = html.match(/(?:data-fancybox="gallery"\s+href|<img[^>]*src)="(https:\/\/[^"]*\.jdbstatic\.com\/covers\/[^"]+)"/);
            if (jdbstaticCoverMatch) {
                javdbImage = jdbstaticCoverMatch[1];
                logAsync('INFO', `找到jdbstatic封面图片: ${javdbImage}`);
            }

            // 方法2：如果没找到，尝试video-cover类的img标签
            if (!javdbImage) {
                const coverImageRegex = /<img[^>]*class="[^"]*video-cover[^"]*"[^>]*src="([^"]+)"/;
                const coverMatch = html.match(coverImageRegex);
                if (coverMatch) {
                    javdbImage = coverMatch[1];
                    logAsync('INFO', `找到video-cover图片: ${javdbImage}`);
                }
            }

            // 方法3：尝试从fancybox链接获取
            if (!javdbImage) {
                const fancyboxRegex = /<a[^>]*data-fancybox="gallery"[^>]*href="([^"]+)"/;
                const fancyboxMatch = html.match(fancyboxRegex);
                if (fancyboxMatch) {
                    javdbImage = fancyboxMatch[1];
                    logAsync('INFO', `找到fancybox图片: ${javdbImage}`);
                }
            }

            // 方法4：尝试其他可能的封面图片模式
            if (!javdbImage) {
                // 尝试查找column-video-cover区域内的图片
                const columnCoverMatch = html.match(/<div[^>]*class="[^"]*column-video-cover[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/);
                if (columnCoverMatch) {
                    javdbImage = columnCoverMatch[1];
                    logAsync('INFO', `找到column-video-cover图片: ${javdbImage}`);
                }
            }

            // 方法5：最后尝试任何包含cover关键词的图片
            if (!javdbImage) {
                const anyCoverMatch = html.match(/<img[^>]*(?:class="[^"]*cover[^"]*"|alt="[^"]*cover[^"]*")[^>]*src="([^"]+)"/i);
                if (anyCoverMatch) {
                    javdbImage = anyCoverMatch[1];
                    logAsync('INFO', `找到cover关键词图片: ${javdbImage}`);
                }
            }

            if (!javdbImage) {
                logAsync('WARN', `未找到封面图片: ${urlVideoId}`);
            }

            // 从页面中推断 origin（兼容镜像站），避免写死 javdb.com
            const inferredOrigin = (() => {
                try {
                    const m1 = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
                    const m2 = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["'][^>]*>/i);
                    const url = (m1 && m1[1]) || (m2 && m2[1]) || '';
                    if (url) return this.getOriginFromUrl(url);
                } catch {}
                return 'https://javdb.com';
            })();

            const videoData: Partial<VideoRecord> = {
                id: videoId, // 返回真正的视频ID
                title,
                tags,
                releaseDate,
                javdbUrl: `${inferredOrigin}/v/${urlVideoId}`,
                javdbImage
            };

            logAsync('INFO', `视频详情解析结果: ${urlVideoId}`, {
                realId: realVideoId,
                finalVideoId: videoId,
                title: title.substring(0, 50),
                tagsCount: tags.length,
                hasReleaseDate: !!releaseDate,
                hasImage: !!javdbImage
            });

            return videoData;

        } catch (error: any) {
            logAsync('ERROR', `解析视频详情HTML失败: ${urlVideoId}`, { error: error.message });
            return null;
        }
    }

    /**
     * 智能提取视频ID，借鉴content script的逻辑
     */
    private extractVideoId(rawText: string): string | null {
        if (!rawText) return null;

        // 移除所有空格
        const trimmed = rawText.trim();

        // 常见的视频ID格式正则表达式
        const patterns = [
            // 标准格式: ABC-123, ABCD-123, etc.
            /^([A-Z]{2,6}-\d{2,6})/i,
            // 数字格式: 123456_01, 072625_01, etc.
            /^(\d{4,8}_\d{1,3})/,
            // 其他格式: FC2-PPV-123456, etc.
            /^(FC2-PPV-\d+)/i,
            // 纯数字格式: 123456789
            /^(\d{6,12})/,
            // 带字母的数字格式: 1pondo-123456_01
            /^([a-z0-9]+-\d+_\d+)/i,
        ];

        // 尝试每个模式
        for (const pattern of patterns) {
            const match = trimmed.match(pattern);
            if (match) {
                const extracted = match[1].toUpperCase();
                logAsync('INFO', `提取到视频ID: "${extracted}" 从原始文本: "${rawText}"`);
                return extracted;
            }
        }

        // 如果没有匹配到模式，尝试提取第一个单词（去掉中文字符）
        const firstWord = trimmed.split(/\s+/)[0];
        if (firstWord) {
            // 移除所有非ASCII字符（中文、日文等）
            const cleanId = firstWord.replace(/[^\x00-\x7F]/g, '').toUpperCase();
            if (cleanId.length >= 3) { // 至少3个字符才认为是有效ID
                logAsync('INFO', `备用提取视频ID: "${cleanId}" 从原始文本: "${rawText}"`);
                return cleanId;
            }
        }

        logAsync('WARN', `无法提取视频ID 从原始文本: "${rawText}"`);
        return null;
    }

    /**
     * 从详情页HTML中提取真正的视频ID
     */
    private extractVideoIdFromDetailHTML(html: string): string | null {
        let videoId: string | null = null;

        try {
            // 方法1: 从页面标题中获取 (新的页面结构)
            const titleRegex = /<h2[^>]*class="[^"]*title[^"]*is-4[^"]*"[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>/;
            const titleMatch = html.match(titleRegex);
            if (titleMatch) {
                const rawText = titleMatch[1].trim();
                if (rawText) {
                    videoId = this.extractVideoId(rawText);
                    logAsync('INFO', `从标题提取ID: "${rawText}" -> "${videoId}"`);
                }
            }

            // 方法2: 从panel-block中获取 (旧的页面结构)
            if (!videoId) {
                const panelBlockRegex = /<div[^>]*class="[^"]*panel-block[^"]*first-block[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*title[^"]*is-4[^"]*"[^>]*>([^<]+)<\/div>/;
                const panelMatch = html.match(panelBlockRegex);
                if (panelMatch) {
                    const rawText = panelMatch[1].trim();
                    if (rawText) {
                        videoId = this.extractVideoId(rawText);
                        logAsync('INFO', `从panel-block提取ID: "${rawText}" -> "${videoId}"`);
                    }
                }
            }

            // 方法3: 从URL中提取（作为最后的备选）
            if (!videoId) {
                const urlRegex = /\/v\/([^\/\?"]+)/;
                const urlMatch = html.match(urlRegex);
                if (urlMatch) {
                    const rawUrlId = urlMatch[1];
                    videoId = this.extractVideoId(rawUrlId);
                    logAsync('INFO', `从URL提取ID: "${rawUrlId}" -> "${videoId}"`);
                }
            }

            return videoId;

        } catch (error: any) {
            logAsync('ERROR', '从详情页HTML提取视频ID失败', { error: error.message });
            return null;
        }
    }

    /**
     * 保存视频记录到本地存储
     */
    private async saveVideoRecord(
        videoId: string,
        videoData: Partial<VideoRecord>,
        status: VideoRecord['status'],
        urlVideoId?: string
    ): Promise<void> {
        try {
            // 获取现有记录（在 IDB 模式下这里会从 IDB 组装，注意可能较慢）
            const existingRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});

            // 创建新记录
            const now = Date.now();

            // 构建javdbUrl，优先使用原始的URL ID
            let javdbUrl = `https://javdb.com/v/${videoId}`;
            if (urlVideoId) {
                // 如果提供了URL ID，使用URL ID构建URL
                javdbUrl = `https://javdb.com/v/${urlVideoId}`;
            } else if (videoData.javdbUrl) {
                javdbUrl = videoData.javdbUrl;
            }

            const newRecord: VideoRecord = {
                id: videoId,
                title: videoData.title || '',
                status: status,
                tags: videoData.tags || [],
                createdAt: now,
                updatedAt: now,
                releaseDate: videoData.releaseDate,
                javdbUrl: javdbUrl,
                javdbImage: videoData.javdbImage
            };

            // 主写入：IndexedDB（Dashboard 默认使用 IDB 查询/分页）
            try {
                await dbViewedPut(newRecord);
            } catch (e: any) {
                logAsync('WARN', '写入 IndexedDB 失败（将继续写入 storage 作为兜底）', { videoId, error: e?.message });
            }

            // 保存记录
            existingRecords[videoId] = newRecord;
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, existingRecords);

            logAsync('INFO', `视频记录已保存`, {
                videoId,
                status,
                title: videoData.title?.substring(0, 30),
                javdbUrl
            });

        } catch (error: any) {
            logAsync('ERROR', `保存视频记录失败`, { videoId, error: error.message });
            throw error;
        }
    }

    private async isIDBMigrated(): Promise<boolean> {
        try {
            return await new Promise<boolean>((resolve) => {
                chrome.storage.local.get([STORAGE_KEYS.IDB_MIGRATED], (r) => resolve(!!r[STORAGE_KEYS.IDB_MIGRATED]));
            });
        } catch {
            return false;
        }
    }

    private async sendDbMessage<T = any>(type: string, payload?: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({ type, payload }, (resp) => {
                    const lastErr = chrome.runtime.lastError;
                    if (lastErr) {
                        reject(new Error(lastErr.message || 'runtime error'));
                        return;
                    }
                    if (!resp || resp.success !== true) {
                        reject(new Error(resp?.error || 'db error'));
                        return;
                    }
                    resolve(resp as T);
                });
            } catch (e: any) {
                reject(e);
            }
        });
    }

    private parseListsFromHTML(html: string): ListPageItem[] {
        const items: ListPageItem[] = [];
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const nodes = Array.from(doc.querySelectorAll('#lists li.list-item, li.list-item'));
            for (const li of nodes) {
                let id = '';
                const rawId = String((li as HTMLElement).id || '').trim();
                if (rawId.startsWith('list-')) {
                    id = rawId.slice('list-'.length).trim();
                }
                if (!id) {
                    const a = li.querySelector('a[href^="/lists/"]') as HTMLAnchorElement | null;
                    const href = a?.getAttribute('href') || '';
                    const m = href.match(/^\/lists\/([^/?#]+)$/);
                    if (m) id = String(m[1] || '').trim();
                }

                const name = String(li.querySelector('.list-name')?.textContent || '').trim();
                const metaRaw = String(li.querySelector('.meta')?.textContent || '')
                    .replace(/\s+/g, ' ')
                    .replace(/，/g, ',')
                    .trim();

                let moviesCount: number | undefined;
                let clickedCount: number | undefined;

                const mc = metaRaw.match(/(\d+)\s*部影片/);
                if (mc) moviesCount = Number(mc[1]);
                const cc = metaRaw.match(/點擊了\s*(\d+)\s*次/);
                if (cc) clickedCount = Number(cc[1]);
                if (!cc) {
                    const cc2 = metaRaw.match(/(\d+)\s*次/);
                    if (cc2) clickedCount = Number(cc2[1]);
                }

                if (id && name) {
                    items.push({ id, name, moviesCount, clickedCount });
                }
            }
        } catch {
            return items;
        }
        return items;
    }

    private parseUrlVideoIdsFromListHTML(html: string): string[] {
        const ids: string[] = [];
        const seen = new Set<string>();
        const hrefRegex = /href="\/v\/([a-zA-Z0-9\-_]+)"(?![^>]*reviews)/g;
        let m: RegExpExecArray | null;
        while ((m = hrefRegex.exec(html)) !== null) {
            const urlId = m[1];
            if (urlId && !seen.has(urlId)) {
                seen.add(urlId);
                ids.push(urlId);
            }
        }
        return ids;
    }

    private async syncUserLists(
        userProfile: UserProfile,
        _config: SyncConfig,
        onProgress?: (progress: any) => void,
        abortSignal?: AbortSignal
    ): Promise<SyncResponseData> {
        const settings = await getSettings();
        const requestInterval = settings.dataSync.requestInterval * 1000;

        const origin = this.getOriginFromUrl(String(settings?.dataSync?.urls?.wantWatch || settings?.dataSync?.urls?.watchedVideos || 'https://javdb.com'));

        const now = Date.now();
        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let newRecords = 0;
        let updatedRecords = 0;

        const migrated = await this.isIDBMigrated();
        const videoToLists = new Map<string, Set<string>>();
        const seenListIds = new Set<string>();

        const listRecords: ListRecord[] = [];
        const listIndex: Array<{ id: string; moviesCount?: number }> = [];

        const fetchListIndex = async (type: 'mine' | 'favorite', baseUrl: string): Promise<void> => {
            for (let page = 1; page <= 50; page++) {
                if (abortSignal?.aborted) throw new SyncCancelledError('同步已取消');
                const url = `${baseUrl}?page=${page}`;
                const res = await this.fetchWithRetry(url, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                const html = await res.text();
                const items = this.parseListsFromHTML(html);
                if (items.length === 0) {
                    // 第 1 页就为空：很可能未登录或页面结构变化
                    if (page === 1) {
                        throw new Error('未能解析到任何清单数据，可能未登录或页面结构已变化');
                    }
                    break;
                }
                for (const it of items) {
                    if (seenListIds.has(it.id)) continue;
                    seenListIds.add(it.id);
                    listIndex.push({ id: it.id, moviesCount: it.moviesCount });
                    listRecords.push({
                        id: it.id,
                        name: it.name,
                        type,
                        url: `${origin}/lists/${it.id}`,
                        moviesCount: it.moviesCount,
                        clickedCount: it.clickedCount,
                        createdAt: now,
                        updatedAt: now
                    });
                    
                    logAsync('INFO', `解析到清单: ${it.name}`, { 
                        id: it.id, 
                        type,
                        moviesCount: it.moviesCount,
                        clickedCount: it.clickedCount
                    });
                }

                onProgress?.({
                    percentage: 0,
                    message: `获取清单列表（${type === 'mine' ? '我的' : '收藏'}）第 ${page} 页...`,
                    stage: 'pages'
                });

                await this.delay(500);
            }
        };

        logAsync('INFO', '开始同步清单列表', { user: userProfile.username });
        await fetchListIndex('mine', `${origin}/users/lists`);
        await fetchListIndex('favorite', `${origin}/users/favorite_lists`);

        // 写入 lists store（最佳努力）
        try {
            await this.sendDbMessage('DB:LISTS_BULK_PUT', { records: listRecords });
        } catch (e: any) {
            logAsync('WARN', '写入 lists 表失败（不阻断清单影片同步）', { error: e?.message });
        }

        if (listIndex.length === 0) {
            return {
                success: true,
                syncedCount: 0,
                skippedCount: 0,
                errorCount: 0,
                newRecords: 0,
                updatedRecords: 0,
                message: '没有找到任何清单'
            };
        }

        // 同步每个清单的影片
        let processedLists = 0;
        for (const li of listIndex) {
            processedLists++;
            if (abortSignal?.aborted) throw new SyncCancelledError('同步已取消');

            // 跳过空清单
            if (li.moviesCount === 0) {
                logAsync('INFO', `跳过空清单: ${li.id}`, { moviesCount: li.moviesCount });
                continue;
            }

            const approxPages = li.moviesCount ? Math.max(1, Math.ceil(li.moviesCount / 20)) : 50;
            for (let page = 1; page <= approxPages; page++) {
                if (abortSignal?.aborted) throw new SyncCancelledError('同步已取消');

                const listUrl = `${origin}/lists/${li.id}?page=${page}`;
                const res = await this.fetchWithRetry(listUrl, { method: 'GET', credentials: 'include' });
                if (!res.ok) {
                    errorCount++;
                    break;
                }
                // 防止被重定向到首页/登录页等导致误解析 /v/
                try {
                    const finalUrl = String((res as any).url || '');
                    if (finalUrl && !finalUrl.includes(`/lists/${li.id}`)) {
                        errorCount++;
                        break;
                    }
                } catch {}
                const html = await res.text();
                try {
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const hasVideos = doc.querySelectorAll('#videos .item, #videos .movie-list .item, .movie-list .item').length > 0;
                    const hasListHint = html.includes(`/lists/${li.id}`);
                    if (!hasVideos && !hasListHint) {
                        errorCount++;
                        break;
                    }
                } catch {}
                const urlIds = this.parseUrlVideoIdsFromListHTML(html);
                if (urlIds.length === 0) {
                    // 没有影片则认为到底
                    break;
                }

                onProgress?.({
                    current: processedLists,
                    total: listIndex.length,
                    percentage: Math.round((processedLists / listIndex.length) * 100),
                    message: `同步清单影片：${processedLists}/${listIndex.length}（${li.id} 第${page}页）...`,
                    stage: 'pages'
                });

                for (let i = 0; i < urlIds.length; i++) {
                    if (abortSignal?.aborted) throw new SyncCancelledError('同步已取消');
                    const urlVideoId = urlIds[i];
                    try {
                        const videoDetail = await this.fetchVideoDetail(urlVideoId);
                        if (!videoDetail) {
                            errorCount++;
                            continue;
                        }
                        const realVideoId = videoDetail.id || urlVideoId;

                        // 汇总远端归属
                        const set = videoToLists.get(realVideoId) || new Set<string>();
                        set.add(li.id);
                        videoToLists.set(realVideoId, set);

                        // 先确保影片存在于番号库
                        let existed = false;
                        let currentRecord: VideoRecord | undefined;
                        if (migrated) {
                            try {
                                const resp = await this.sendDbMessage<{ success: true; record?: VideoRecord }>('DB:VIEWED_GET', { id: realVideoId });
                                // @ts-ignore
                                currentRecord = (resp as any).record;
                                existed = !!currentRecord;
                            } catch {
                                existed = false;
                            }
                        } else {
                            const all = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                            currentRecord = all[realVideoId];
                            existed = !!currentRecord;
                        }

                        if (!existed) {
                            const record: VideoRecord = {
                                id: realVideoId,
                                title: videoDetail.title || '',
                                status: VIDEO_STATUS.UNTRACKED as any,
                                tags: videoDetail.tags || [],
                                createdAt: now,
                                updatedAt: now,
                                releaseDate: videoDetail.releaseDate,
                                javdbUrl: `${origin}/v/${urlVideoId}`,
                                javdbImage: videoDetail.javdbImage,
                                listIds: [li.id]
                            };
                            await dbViewedPut(record);
                            newRecords++;
                        } else {
                            updatedRecords++;
                        }

                        syncedCount++;

                        onProgress?.({
                            current: syncedCount,
                            total: syncedCount,
                            percentage: 0,
                            message: `已处理 ${syncedCount} 部影片...`,
                            stage: 'details'
                        });
                    } catch (e: any) {
                        errorCount++;
                        logAsync('ERROR', '同步清单影片失败', { listId: li.id, urlVideoId, error: e?.message });
                    }

                    if (i < urlIds.length - 1) {
                        await this.delay(requestInterval);
                    }
                }

                // 页面间隔
                await this.delay(500);
            }
        }

        // 归属“以远端为准”：对已同步到的影片进行覆盖写入
        for (const [videoId, set] of videoToLists.entries()) {
            if (abortSignal?.aborted) throw new SyncCancelledError('同步已取消');
            try {
                let record: VideoRecord | undefined;
                if (migrated) {
                    const resp = await this.sendDbMessage<{ success: true; record?: VideoRecord }>('DB:VIEWED_GET', { id: videoId });
                    // @ts-ignore
                    record = (resp as any).record;
                } else {
                    const all = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                    record = all[videoId];
                }
                if (!record) {
                    skippedCount++;
                    continue;
                }
                record.listIds = Array.from(set);
                record.updatedAt = Date.now();
                await dbViewedPut(record);
            } catch (e: any) {
                // 覆盖失败时不要误删，本次不阻断
                errorCount++;
            }
        }

        return {
            success: true,
            syncedCount,
            skippedCount,
            errorCount,
            newRecords,
            updatedRecords,
            message: `清单同步完成：影片 ${syncedCount}，清单 ${listIndex.length}`
        };
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
