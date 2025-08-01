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
import { getSettings, getValue, setValue } from '../../utils/storage';
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
        localData: VideoRecord[],
        userProfile: UserProfile,
        config: SyncConfig,
        onProgress?: (progress: any) => void,
        abortSignal?: AbortSignal
    ): Promise<SyncResponseData> {
        // 对于想看和已观看类型，使用真实API同步
        if (type === 'want' || type === 'viewed') {
            return await this.syncUserVideos(type, userProfile, config, onProgress, abortSignal);
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
        logAsync('INFO', `开始同步${syncConfig.displayName}视频列表`, {
            userEmail: userProfile.email,
            type,
            url: syncConfig.url
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

            // 3. 获取所有视频的ID列表
            logAsync('INFO', `开始获取${syncConfig.displayName}视频ID列表...`);
            const videoIds = await this.fetchAllVideoIds(
                type,
                totalPages,
                config,
                (current, total, stage) => onProgress?.({
                    current,
                    total,
                    percentage: Math.round((current / total) * 100), // 页面获取阶段独立计算100%
                    message: stage === 'pages' ? `获取${syncConfig.displayName}列表 (${current}/${total}页)...` : `同步${syncConfig.displayName}视频 (${current}/${total})...`,
                    stage
                }),
                abortSignal
            );

            if (videoIds.length === 0) {
                logAsync('WARN', `没有获取到任何${syncConfig.displayName}视频ID`);
                return {
                    success: true,
                    syncedCount: 0,
                    skippedCount: 0,
                    errorCount: 0,
                    newRecords: 0,
                    updatedRecords: 0,
                    message: `没有获取到${syncConfig.displayName}视频ID`
                };
            }

            // 4. 获取详情页数据并保存
            const settings = await getSettings();
            const requestInterval = settings.dataSync.requestInterval * 1000; // 转换为毫秒

            let syncedCount = 0;
            let errorCount = 0;
            let newRecords = 0;
            let updatedRecords = 0;

            for (let i = 0; i < videoIds.length; i++) {
                // 检查是否已取消
                if (abortSignal?.aborted) {
                    throw new SyncCancelledError('用户取消了同步操作');
                }

                const urlVideoId = videoIds[i];

                try {
                    // 获取详情页数据
                    const videoData = await this.fetchVideoDetail(urlVideoId);

                    if (videoData) {
                        // 使用从详情页提取的真正ID，如果没有则使用URL ID
                        const realVideoId = videoData.id || urlVideoId;

                        // 检查是否为新记录
                        const existingRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                        const isNewRecord = !existingRecords[realVideoId];

                        // 保存到本地存储
                        await this.saveVideoRecord(realVideoId, videoData, syncConfig.status);
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

                // 更新进度（详情获取阶段独立计算100%）
                const detailProgress = Math.round(((i + 1) / videoIds.length) * 100);
                onProgress?.({
                    current: i + 1,
                    total: videoIds.length,
                    percentage: detailProgress,
                    message: `同步${syncConfig.displayName}视频 (${i + 1}/${videoIds.length})...`,
                    stage: 'details'
                });

                // 请求间隔
                if (i < videoIds.length - 1) {
                    await this.delay(requestInterval);
                }
            }

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
            all: {
                url: dataSyncUrls.wantWatch || 'https://javdb.com/users/want_watch_videos',
                status: 'viewed',
                displayName: '全部',
                countField: 'watchedCount'
            }
        };

        const config = configs[type];
        logAsync('INFO', `获取同步配置: ${type}`, {
            url: config.url,
            displayName: config.displayName,
            isCustomUrl: config.url !== configs[type].url
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
     * 获取所有视频的ID列表
     */
    private async fetchAllVideoIds(
        type: 'want' | 'viewed',
        totalPages: number,
        config: SyncConfig,
        onProgress?: (current: number, total: number, stage?: 'pages' | 'details') => void,
        abortSignal?: AbortSignal
    ): Promise<string[]> {
        const allVideoIds: string[] = [];
        const syncConfig = await this.getSyncTypeConfig(type);
        logAsync('INFO', `开始获取${syncConfig.displayName}视频ID，总共${totalPages}页`);

        // 增量同步相关变量
        const isIncrementalMode = config.mode === 'incremental';
        let existingRecordsCount = 0;
        let shouldStopIncremental = false;
        const incrementalTolerance = config.incrementalTolerance || 20;

        // 如果是增量同步，先获取本地已存在的记录
        let localRecords: Record<string, any> = {};
        if (isIncrementalMode) {
            try {
                localRecords = await getValue<Record<string, any>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                logAsync('INFO', `增量同步模式：本地已有${Object.keys(localRecords).length}条记录`);
            } catch (error: any) {
                logAsync('WARN', '获取本地记录失败，将使用全量同步模式', { error: error.message });
            }
        }

        for (let page = 1; page <= totalPages; page++) {
            try {
                // 检查是否已取消
                if (abortSignal?.aborted) {
                    logAsync('INFO', `同步在第${page}页被取消`);
                    throw new SyncCancelledError('用户取消了同步操作');
                }

                logAsync('INFO', `正在获取第${page}页${syncConfig.displayName}视频...`);
                const videoIds = await this.fetchVideoIdsFromPage(type, page);

                // 增量同步逻辑：检查当前页面的视频是否已存在
                if (isIncrementalMode && !shouldStopIncremental) {
                    // 使用URL ID与javdbUrl末尾进行比对
                    const existingInCurrentPage: string[] = [];

                    for (const urlId of videoIds) {
                        // 检查本地记录中是否有javdbUrl以这个urlId结尾的记录
                        const existingRecord = Object.values(localRecords).find((record: any) => {
                            if (record.javdbUrl) {
                                // 提取javdbUrl的最后部分，例如从 "https://javdb.com/v/kKy9zY" 提取 "kKy9zY"
                                const urlParts = record.javdbUrl.split('/');
                                const lastPart = urlParts[urlParts.length - 1];
                                return lastPart === urlId;
                            }
                            return false;
                        });

                        if (existingRecord) {
                            existingInCurrentPage.push(urlId);
                        }
                    }

                    existingRecordsCount += existingInCurrentPage.length;

                    logAsync('INFO', `第${page}页中有${existingInCurrentPage.length}个已存在的视频`, {
                        page,
                        existingInCurrentPage: existingInCurrentPage.slice(0, 5),
                        totalExistingCount: existingRecordsCount,
                        checkedUrlIds: videoIds.slice(0, 5)
                    });

                    // 添加当前页面的所有视频URL ID（用于后续详情获取）
                    allVideoIds.push(...videoIds);

                    // 如果当前页面有已存在的记录，检查是否应该停止
                    if (existingInCurrentPage.length > 0) {
                        // 检查是否达到容忍度
                        if (existingRecordsCount >= incrementalTolerance) {
                            shouldStopIncremental = true;
                            logAsync('INFO', `增量同步：已遇到${existingRecordsCount}个已存在记录，达到容忍度${incrementalTolerance}，停止获取更多页面`);

                            // 发送容忍中断的进度消息
                            if (progressCallback) {
                                progressCallback({
                                    stage: 'pages',
                                    current: page,
                                    total: totalPages,
                                    percentage: Math.round((page / totalPages) * 100),
                                    message: `已遇到${existingRecordsCount}个已存在记录，达到容忍度${incrementalTolerance}，停止获取更多页面`
                                });
                            }
                        }
                    }
                } else {
                    // 全量同步或已决定停止增量同步
                    allVideoIds.push(...videoIds);
                }

                // 更新进度（页面获取进度）
                onProgress?.(page, totalPages, 'pages');

                logAsync('INFO', `获取第${page}页${syncConfig.displayName}视频完成`, {
                    page,
                    totalPages,
                    currentPageCount: videoIds.length,
                    totalCount: allVideoIds.length,
                    videoIds: videoIds.slice(0, 5) // 显示前5个ID作为示例
                });

                // 如果是增量同步且应该停止，则跳出循环
                if (isIncrementalMode && shouldStopIncremental) {
                    logAsync('INFO', `增量同步提前结束，已获取${page}页，共${allVideoIds.length}个视频ID`);
                    break;
                }

                // 页面间隔
                if (page < totalPages) {
                    logAsync('INFO', `等待1秒后获取下一页...`);
                    await this.delay(1000); // 页面间隔1秒
                }
            } catch (error: any) {
                logAsync('ERROR', `获取第${page}页${syncConfig.displayName}视频失败`, {
                    page,
                    totalPages,
                    error: error.message
                });
                // 继续处理下一页
            }
        }

        logAsync('INFO', `${syncConfig.displayName}视频ID获取完成`, {
            totalPages,
            totalVideoIds: allVideoIds.length,
            isIncrementalMode,
            stoppedEarly: isIncrementalMode && shouldStopIncremental
        });

        return allVideoIds;
    }

    /**
     * 从指定页面获取视频URL ID列表
     */
    private async fetchVideoIdsFromPage(type: 'want' | 'viewed', page: number): Promise<string[]> {
        // 获取同步类型配置
        const syncConfig = await this.getSyncTypeConfig(type);
        const url = `${syncConfig.url}?page=${page}`;
        logAsync('INFO', `请求${syncConfig.displayName}视频页面`, { page, url, baseUrl: syncConfig.url });

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'priority': 'u=0, i',
                    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1'
                },
                mode: 'cors',
                credentials: 'include'
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

            const videoIds = this.parseVideoIdsFromHTML(html);
            logAsync('INFO', `${syncConfig.displayName}视频页面解析完成`, {
                page,
                videoCount: videoIds.length,
                videoIds: videoIds.slice(0, 3) // 显示前3个作为示例
            });

            return videoIds;

        } catch (error: any) {
            logAsync('ERROR', `获取${syncConfig.displayName}视频页面失败`, { page, url, error: error.message });
            throw error;
        }
    }

    /**
     * 从页面HTML中解析视频URL ID列表
     */
    private parseVideoIdsFromHTML(html: string): string[] {
        const videoIds: string[] = [];

        try {
            logAsync('INFO', '开始解析视频页面HTML', {
                htmlLength: html.length,
                hasVideoLinks: html.includes('/v/'),
                hasMovieList: html.includes('movie-list'),
                hasVideoItems: html.includes('class="item"')
            });

            // 使用简单的方法：只匹配href链接获取URL ID
            const hrefRegex = /href="\/v\/([a-zA-Z0-9\-_]+)"(?![^>]*reviews)/g;
            let hrefMatch;
            while ((hrefMatch = hrefRegex.exec(html)) !== null) {
                const urlId = hrefMatch[1];
                if (urlId && urlId.length >= 2 && !videoIds.includes(urlId)) {
                    videoIds.push(urlId);
                    logAsync('INFO', `找到URL ID: ${urlId}`);
                }
            }

            logAsync('INFO', `HTML解析完成`, {
                totalMatches: videoIds.length,
                uniqueVideoIds: videoIds.length,
                videoIds: videoIds.slice(0, 5) // 显示前5个
            });

            return videoIds;

        } catch (error: any) {
            logAsync('ERROR', '解析视频页面HTML失败', { error: error.message });
            return [];
        }
    }



    /**
     * 获取视频详情
     */
    private async fetchVideoDetail(urlVideoId: string): Promise<Partial<VideoRecord> | null> {
        const detailUrl = `https://javdb.com/v/${urlVideoId}`;
        logAsync('INFO', `获取视频详情: ${urlVideoId}`, { detailUrl });

        try {
            const response = await fetch(detailUrl, {
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

            const videoData: Partial<VideoRecord> = {
                id: videoId, // 返回真正的视频ID
                title,
                tags,
                releaseDate,
                javdbUrl: `https://javdb.com/v/${urlVideoId}`,
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
        status: 'want' | 'viewed' | 'browsed'
    ): Promise<void> {
        try {
            // 获取现有记录
            const existingRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});

            // 创建新记录
            const now = Date.now();

            // 构建javdbUrl，优先使用videoData中的URL信息
            let javdbUrl = `https://javdb.com/v/${videoId}`;
            if (videoData.javdbUrl) {
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
