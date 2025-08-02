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
        onProgress?: (progress: ActorSyncProgress) => void,
        forceUpdate: boolean = false
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
                throw new Error('演员同步功能未启用，请在设置中启用演员同步功能');
            }

            // 使用优化的方法：逐页解析并保存演员信息
            onProgress?.({
                stage: 'pages',
                current: 0,
                total: 0, // 未知总量
                percentage: 0,
                message: '正在获取收藏演员列表...',
                stats: {
                    currentPage: 0,
                    totalProcessed: 0,
                    newActors: 0,
                    updatedActors: 0,
                    skippedActors: 0
                }
            });

            const syncResults = await this.fetchAndSaveActorsPaginated(config, type, onProgress, forceUpdate);

            if (syncResults.synced === 0 && syncResults.newActors === 0 && syncResults.updatedActors === 0) {
                onProgress?.({
                    stage: 'complete',
                    current: 0,
                    total: 0,
                    percentage: 100,
                    message: '未找到收藏演员',
                    stats: {
                        currentPage: 0,
                        totalProcessed: 0,
                        newActors: 0,
                        updatedActors: 0,
                        skippedActors: 0
                    }
                });

                result.success = true;
                result.duration = Date.now() - startTime;
                return result;
            }

            result.syncedCount = syncResults.synced;
            result.skippedCount = syncResults.skipped;
            result.errorCount = syncResults.errors.length;
            result.newActors = syncResults.newActors;
            result.updatedActors = syncResults.updatedActors;
            result.errors = syncResults.errors;
            result.success = true;
            result.duration = Date.now() - startTime;

            onProgress?.({
                stage: 'complete',
                current: result.syncedCount,
                total: result.syncedCount,
                percentage: 100,
                message: `演员同步完成：新增 ${result.newActors}，更新 ${result.updatedActors}`,
                stats: {
                    currentPage: 0,
                    totalProcessed: result.syncedCount,
                    newActors: result.newActors,
                    updatedActors: result.updatedActors,
                    skippedActors: result.skippedCount
                }
            });

            console.log('演员同步完成:', result);
            return result;

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

                console.log(`第 ${page} 页解析到 ${pageActorIds.length} 个演员ID:`, pageActorIds);

                if (pageActorIds.length === 0) {
                    console.log(`第 ${page} 页没有找到演员，停止获取`);
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
     * 分页获取并保存演员信息
     * 逐页解析并立即保存，支持未知总量的进度显示
     */
    private async fetchAndSaveActorsPaginated(
        config: ActorSyncConfig,
        syncType: 'full' | 'incremental',
        onProgress?: (progress: ActorSyncProgress) => void,
        forceUpdate: boolean = false
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

        let totalProcessed = 0;
        const seenActorIds = new Set<string>(); // 用于检测重复

        // 定义所有需要同步的分类URL（包含性别和分类信息）
        const actorCategories = [
            { g: 0, t: 0, gender: 'female', category: 'censored', displayName: '有码女优' },
            { g: 1, t: 0, gender: 'male', category: 'censored', displayName: '有码男优' },
            { g: 0, t: 1, gender: 'female', category: 'uncensored', displayName: '无码女优' },
            { g: 1, t: 1, gender: 'male', category: 'uncensored', displayName: '无码男优' },
            { g: 0, t: 2, gender: 'female', category: 'western', displayName: '欧美女优' },
            { g: 1, t: 2, gender: 'male', category: 'western', displayName: '欧美男优' }
        ];

        // 遍历所有分类
        for (const category of actorCategories) {
            if (this.abortController?.signal.aborted) break;

            console.log(`开始同步 ${category.displayName}...`);

            let categoryPage = 1;
            let categoryHasMore = true;

            while (categoryHasMore && !this.abortController?.signal.aborted) {
                try {
                    // 构建带分类参数的URL
                    const baseUrl = config.urls.collectionActors;
                    const params = new URLSearchParams();
                    params.set('g', category.g.toString());
                    params.set('t', category.t.toString());
                    if (categoryPage > 1) {
                        params.set('page', categoryPage.toString());
                    }
                    const url = `${baseUrl}?${params.toString()}`;

                    onProgress?.({
                        stage: 'pages',
                        current: totalProcessed,
                        total: 0, // 未知总量
                        percentage: 0, // 不使用百分比
                        message: `正在获取 ${category.displayName} 第 ${categoryPage} 页...`,
                        stats: {
                            currentPage: categoryPage,
                            totalProcessed: totalProcessed,
                            newActors: result.newActors,
                            updatedActors: result.updatedActors,
                            skippedActors: result.skipped
                        }
                    });

                    console.log(`正在获取第 ${categoryPage} 页: ${url}`);

                    const response = await fetch(url, {
                        signal: this.abortController?.signal
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const html = await response.text();
                    const pageActors = this.parseActorsFromCollectionHtml(html);

                    console.log(`${category.displayName} 第 ${categoryPage} 页解析到 ${pageActors.length} 个演员`);

                    if (pageActors.length === 0) {
                        console.log(`${category.displayName} 第 ${categoryPage} 页没有找到演员，停止获取此分类`);
                        categoryHasMore = false;
                        break;
                    }

                    // 为演员设置正确的性别和分类信息
                    const pageActorsWithCategory = pageActors.map(actor => ({
                        ...actor,
                        gender: category.gender as 'male' | 'female',
                        category: category.category as 'censored' | 'uncensored' | 'western'
                    }));

                    // 检查是否有重复的演员ID（说明到了最后一页或循环）
                    let newActorsInPage = 0;
                    const pageActorsToSave: ActorRecord[] = [];

                    for (const actor of pageActorsWithCategory) {
                        if (!seenActorIds.has(actor.id)) {
                            seenActorIds.add(actor.id);
                            pageActorsToSave.push(actor);
                            newActorsInPage++;
                        }
                    }

                    if (newActorsInPage === 0) {
                        console.log(`${category.displayName} 第 ${categoryPage} 页所有演员都已处理过，停止获取此分类`);
                        categoryHasMore = false;
                        break;
                    }

                    // 立即保存这一页的演员
                    onProgress?.({
                        stage: 'details',
                        current: totalProcessed,
                        total: 0, // 未知总量
                        percentage: 0, // 不使用百分比
                        message: `正在保存 ${category.displayName} 第 ${categoryPage} 页的 ${pageActorsToSave.length} 个演员...`,
                        stats: {
                            currentPage: categoryPage,
                            totalProcessed: totalProcessed,
                            newActors: result.newActors,
                            updatedActors: result.updatedActors,
                            skippedActors: result.skipped,
                            currentPageActors: pageActorsToSave.length
                        }
                    });

                    const pageResult = await this.saveActorsToDatabase(
                        pageActorsToSave,
                        syncType,
                        (progress) => {
                            // 转发保存进度，但调整消息和统计
                            onProgress?.({
                                ...progress,
                                percentage: 0, // 不使用百分比
                                message: `${category.displayName} 第 ${categoryPage} 页：${progress.message}`,
                                stats: {
                                    currentPage: categoryPage,
                                    totalProcessed: totalProcessed + (progress.current || 0),
                                    newActors: result.newActors,
                                    updatedActors: result.updatedActors,
                                    skippedActors: result.skipped,
                                    currentPageActors: pageActorsToSave.length,
                                    currentPageProgress: progress.current || 0,
                                    currentPageTotal: progress.total || pageActorsToSave.length
                                }
                            });
                        },
                        forceUpdate
                    );

                    // 累计结果
                    result.synced += pageResult.synced;
                    result.skipped += pageResult.skipped;
                    result.newActors += pageResult.newActors;
                    result.updatedActors += pageResult.updatedActors;
                    result.errors.push(...pageResult.errors);

                    totalProcessed += pageActorsToSave.length;

                    console.log(`${category.displayName} 第 ${categoryPage} 页保存完成：新增 ${pageResult.newActors}，更新 ${pageResult.updatedActors}`);

                    // 如果这一页的新演员数量少于预期，可能是最后一页
                    if (newActorsInPage < pageActorsWithCategory.length * 0.8) {
                        console.log(`${category.displayName} 第 ${categoryPage} 页新演员比例较低，可能接近结束`);
                    }

                    categoryPage++;

                    // 请求间隔
                    if (categoryHasMore) {
                        await this.delay(config.requestInterval * 1000);
                    }

                } catch (error) {
                    if (error instanceof Error && error.name === 'AbortError') {
                        throw new Error('同步已取消');
                    }

                    const errorMsg = `获取 ${category.displayName} 第 ${categoryPage} 页失败：${error instanceof Error ? error.message : '未知错误'}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg);

                    // 如果连续失败，停止同步
                    if (result.errors.length >= config.maxRetries) {
                        throw new Error('连续失败次数过多，停止同步');
                    }

                    // 继续下一页
                    categoryPage++;
                }
            }

            console.log(`${category.displayName} 同步完成`);
        }

        return result;
    }

    /**
     * 获取演员列表页面并直接解析演员信息
     * 这是一个优化版本，可以直接从收藏列表页面提取基本演员信息
     */
    private async fetchActorListPagesWithDetails(
        config: ActorSyncConfig,
        onProgress?: (progress: ActorSyncProgress) => void
    ): Promise<ActorRecord[]> {
        const actors: ActorRecord[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && !this.abortController?.signal.aborted) {
            try {
                const url = page === 1
                    ? config.urls.collectionActors
                    : `${config.urls.collectionActors}?page=${page}`;

                onProgress?.({
                    stage: 'pages',
                    current: page,
                    total: page + 1,
                    percentage: Math.min(90, page * 10),
                    message: `正在获取第 ${page} 页演员列表并解析信息...`
                });

                console.log(`正在获取第 ${page} 页: ${url}`);

                const response = await fetch(url, {
                    signal: this.abortController?.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                const pageActors = this.parseActorsFromCollectionHtml(html);

                console.log(`第 ${page} 页解析到 ${pageActors.length} 个演员`);

                if (pageActors.length === 0) {
                    console.log(`第 ${page} 页没有找到演员，停止获取`);
                    hasMore = false;
                } else {
                    actors.push(...pageActors);
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

        // 注意：不再自动获取性别信息，性别信息通过单独的方法更新

        return actors;
    }

    /**
     * 保存演员数据到数据库
     */
    private async saveActorsToDatabase(
        actors: ActorRecord[],
        syncType: 'full' | 'incremental',
        onProgress?: (progress: ActorSyncProgress) => void,
        forceUpdate: boolean = false
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

        for (let i = 0; i < actors.length; i++) {
            if (this.abortController?.signal.aborted) {
                throw new Error('同步已取消');
            }

            const actor = actors[i];

            onProgress?.({
                stage: 'details',
                current: i + 1,
                total: actors.length,
                percentage: Math.round((i + 1) / actors.length * 100),
                message: `正在保存演员 ${i + 1}/${actors.length}: ${actor.name}...`
            });

            try {
                // 检查是否需要跳过（增量同步）
                if (syncType === 'incremental') {
                    const existingActor = await actorManager.getActorById(actor.id);
                    if (existingActor && this.shouldSkipActor(existingActor)) {
                        result.skipped++;
                        continue;
                    }
                }

                const existingActor = await actorManager.getActorById(actor.id);

                if (existingActor) {
                    // 根据forceUpdate参数决定更新策略
                    const oldGender = existingActor.gender;
                    const oldCategory = existingActor.category;

                    const updatedActor: ActorRecord = {
                        ...actor,
                        // 根据forceUpdate决定是否强制更新性别和分类
                        gender: forceUpdate ? actor.gender : (existingActor.gender !== 'unknown' ? existingActor.gender : actor.gender),
                        category: forceUpdate ? actor.category : (existingActor.category !== 'unknown' ? existingActor.category : actor.category),
                        // 合并别名，去重
                        aliases: [...new Set([...existingActor.aliases, ...actor.aliases])],
                        // 保留创建时间
                        createdAt: existingActor.createdAt,
                        // 更新修改时间
                        updatedAt: Date.now(),
                        // 保留其他详细信息
                        details: existingActor.details || actor.details
                    };

                    await actorManager.saveActor(updatedActor);
                    result.updatedActors++;

                    // 记录性别和分类的更新情况
                    const genderChanged = oldGender !== updatedActor.gender;
                    const categoryChanged = oldCategory !== updatedActor.category;

                    if (forceUpdate && (genderChanged || categoryChanged)) {
                        console.log(`强制更新演员 ${actor.name} (${actor.id}): 性别 ${oldGender} → ${updatedActor.gender}, 分类 ${oldCategory} → ${updatedActor.category}`);
                    } else if (genderChanged || categoryChanged) {
                        console.log(`更新演员 ${actor.name} (${actor.id}): 性别 ${oldGender} → ${updatedActor.gender}, 分类 ${oldCategory} → ${updatedActor.category}`);
                    } else {
                        console.log(`更新演员 ${actor.name} (${actor.id}): 性别和分类无变化`);
                    }
                } else {
                    // 新演员直接保存
                    await actorManager.saveActor(actor);
                    result.newActors++;

                    console.log(`新增演员成功: ${actor.name} (${actor.id})`);
                }
                result.synced++;

                console.log(`保存演员成功: ${actor.name} (${actor.id})`);

            } catch (error) {
                const errorMsg = `演员 ${actor.name} (${actor.id}): ${error instanceof Error ? error.message : '未知错误'}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }

            // 批量处理间隔
            if ((i + 1) % 10 === 0) {
                await this.delay(100); // 每10个演员暂停100ms
            }
        }

        return result;
    }



    // updateActorsGender 方法已移除，性别信息现在直接从分类页面获取

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

        console.log('开始解析演员ID，HTML长度:', html.length);
        console.log('HTML片段预览:', html.substring(0, 500));

        while ((match = actorLinkRegex.exec(html)) !== null) {
            const actorId = match[1];
            if (actorId && !actorIds.includes(actorId)) {
                actorIds.push(actorId);
            }
        }

        console.log('解析完成，找到演员ID:', actorIds);
        return actorIds;
    }

    /**
     * 从收藏演员列表HTML直接解析演员信息
     * 这样可以避免为每个演员单独请求详情页面，提高同步效率
     */
    private parseActorsFromCollectionHtml(html: string): ActorRecord[] {
        const actors: ActorRecord[] = [];
        const now = Date.now();

        console.log('开始解析收藏演员列表，HTML长度:', html.length);

        // 匹配演员卡片的正则表达式
        const actorBoxRegex = /<div[^>]*class="[^"]*actor-box[^"]*"[^>]*id="actor-([^"]+)"[^>]*>([\s\S]*?)<\/div>/g;
        let match;

        while ((match = actorBoxRegex.exec(html)) !== null) {
            const actorId = match[1];
            const actorHtml = match[2];

            try {
                // 解析演员链接和基本信息
                const linkMatch = actorHtml.match(/<a[^>]*href="\/actors\/[^"]*"[^>]*title="([^"]*)"[^>]*>/);
                if (!linkMatch) continue;

                const titleContent = linkMatch[1];

                // 解析名称和别名
                // title可能包含多个名称，用逗号分隔，如："夏目未來, 夏目みらい, 武田エレナ, 明石恵, 武田艾莉娜"
                const names = titleContent.split(',').map(name => name.trim()).filter(name => name);
                if (names.length === 0) continue;

                const primaryName = names[0];
                const aliases = names.slice(1);

                // 解析头像URL - 支持多种属性顺序
                let avatarUrl: string | undefined;

                // 尝试多种匹配模式，支持不同的属性顺序
                const avatarPatterns = [
                    // class在前，src在后
                    /<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/,
                    // src在前，class在后
                    /<img[^>]*src="([^"]+)"[^>]*class="[^"]*avatar[^"]*"/,
                    // 只匹配包含avatar类的img标签
                    /<img[^>]*class="[^"]*avatar[^"]*"[^>]*>/,
                ];

                for (const pattern of avatarPatterns) {
                    const match = actorHtml.match(pattern);
                    if (match) {
                        if (match[1]) {
                            // 直接获取到src属性值
                            avatarUrl = match[1];
                            break;
                        } else {
                            // 匹配到img标签，但需要单独提取src
                            const imgTag = match[0];
                            const srcMatch = imgTag.match(/src="([^"]+)"/);
                            if (srcMatch) {
                                avatarUrl = srcMatch[1];
                                break;
                            }
                        }
                    }
                }

                console.log(`演员 ${actorId} 头像URL解析结果: ${avatarUrl}`);

                // 解析显示名称（从strong标签）
                const strongMatch = actorHtml.match(/<strong[^>]*>([^<]+)<\/strong>/);
                const displayName = strongMatch ? strongMatch[1].trim() : primaryName;

                // 创建演员记录
                const actor: ActorRecord = {
                    id: actorId,
                    name: displayName || primaryName,
                    aliases: aliases,
                    gender: 'unknown', // 从收藏列表无法确定性别，需要后续从详情页获取
                    category: 'unknown', // 从收藏列表无法确定分类，需要后续从分类页面获取
                    avatarUrl: this.isValidAvatarUrl(avatarUrl) ? avatarUrl : undefined,
                    profileUrl: `https://javdb.com/actors/${actorId}`,
                    createdAt: now,
                    updatedAt: now,
                    syncInfo: {
                        source: 'javdb',
                        lastSyncAt: now,
                        syncStatus: 'success'
                    }
                };

                actors.push(actor);
                console.log(`解析演员: ${actor.name} (${actor.id}), 别名: ${aliases.join(', ')}`);

            } catch (error) {
                console.error(`解析演员 ${actorId} 失败:`, error);
            }
        }

        console.log(`从收藏列表解析完成，找到 ${actors.length} 个演员`);
        return actors;
    }

    /**
     * 从演员详情页面HTML中提取性别信息
     */
    private parseGenderFromHtml(html: string): 'female' | 'male' | 'unknown' {
        // 查找包含"男優"的文本来判断性别
        if (html.includes('男優')) {
            console.log(`检测到"男優"，性别判定为: 男性`);
            return 'male';
        } else if (html.includes('女優')) {
            console.log(`检测到"女優"，性别判定为: 女性`);
            return 'female';
        } else {
            // 如果没有明确的"男優"或"女優"标识，尝试其他模式
            const genderIndicators = [
                { pattern: /男优|男演员|male/i, gender: 'male' as const },
                { pattern: /女优|女演员|actress|female/i, gender: 'female' as const }
            ];

            for (const indicator of genderIndicators) {
                if (indicator.pattern.test(html)) {
                    console.log(`通过模式匹配判定性别为: ${indicator.gender}`);
                    return indicator.gender;
                }
            }

            console.log(`未找到明确性别标识，默认判定为: 女性`);
            return 'female'; // 默认为女性
        }
    }

    /**
     * 从HTML解析演员信息
     */
    private parseActorFromHtml(actorId: string, html: string): ActorRecord | null {
        try {
            console.log(`开始解析演员 ${actorId} 的详情页面`);

            // 解析演员名称 - 从 .actor-section-name 或 .title 中获取
            let name = actorId;
            let aliases: string[] = [];

            // 尝试从 .actor-section-name 获取主要名称
            const actorSectionMatch = html.match(/<span[^>]*class="[^"]*actor-section-name[^"]*"[^>]*>([^<]+)<\/span>/i);
            if (actorSectionMatch) {
                name = actorSectionMatch[1].trim();
                console.log(`从 actor-section-name 解析到主要名称: ${name}`);
            } else {
                // 备用方案：从 h2.title 获取
                const titleMatch = html.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*actor-section-name[^"]*"[^>]*>([^<]+)<\/span>/i);
                if (titleMatch) {
                    name = titleMatch[1].trim();
                    console.log(`从 title 中解析到主要名称: ${name}`);
                }
            }

            // 解析别名 - 从 .section-meta 中获取（第一个通常是别名）
            const sectionMetaMatches = html.matchAll(/<span[^>]*class="[^"]*section-meta[^"]*"[^>]*>([^<]+)<\/span>/gi);
            let metaIndex = 0;
            for (const match of sectionMetaMatches) {
                const metaText = match[1].trim();

                // 第一个 section-meta 通常是别名，跳过包含"優"或"部影片"的文本
                if (metaIndex === 0 && !metaText.includes('優') && !metaText.includes('部影片')) {
                    if (metaText && metaText !== name) {
                        aliases.push(metaText);
                        console.log(`解析到别名: ${metaText}`);
                    }
                }
                metaIndex++;
            }

            // 解析性别
            const gender = this.parseGenderFromHtml(html);

            // 解析头像URL
            let avatarUrl: string | undefined;

            // 尝试多种头像选择器
            const avatarSelectors = [
                /<img[^>]*class="[^"]*actor-avatar[^"]*"[^>]*src="([^"]+)"/i,
                /<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/i,
                /<img[^>]*src="([^"]*)"[^>]*class="[^"]*avatar[^"]*"/i,
                /<div[^>]*class="[^"]*actor-avatar[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i
            ];

            for (const selector of avatarSelectors) {
                const avatarMatch = html.match(selector);
                if (avatarMatch && avatarMatch[1]) {
                    avatarUrl = avatarMatch[1];
                    console.log(`解析到头像URL: ${avatarUrl}`);
                    break;
                }
            }

            // 验证头像URL
            if (avatarUrl && !this.isValidAvatarUrl(avatarUrl)) {
                console.log(`头像URL无效，忽略: ${avatarUrl}`);
                avatarUrl = undefined;
            }

            const now = Date.now();

            const actor: ActorRecord = {
                id: actorId,
                name,
                aliases,
                gender,
                category: 'unknown', // 从详情页无法确定分类，需要从分类页面获取
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

            console.log(`演员解析完成:`, {
                id: actor.id,
                name: actor.name,
                aliases: actor.aliases,
                gender: actor.gender,
                hasAvatar: !!actor.avatarUrl
            });

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
     * 检查头像URL是否有效（不是默认头像）
     */
    private isValidAvatarUrl(avatarUrl: string | undefined): boolean {
        if (!avatarUrl) return false;

        // 检查是否为默认头像的各种变体
        const defaultAvatarPatterns = [
            'actor_unknow.jpg',      // 原始默认头像
            'actor_unknown.jpg',     // 可能的拼写变体
            'actor_default.jpg',     // 可能的默认头像
            'default_avatar.jpg',    // 通用默认头像
            'no_avatar.jpg',         // 无头像标识
            'placeholder.jpg',       // 占位符图片
            '/images/actor_unknow',  // 路径匹配
            '/images/default',       // 默认图片路径
            'data:image/svg+xml',    // SVG占位符
        ];

        // 检查URL是否包含任何默认头像模式
        const lowerUrl = avatarUrl.toLowerCase();
        for (const pattern of defaultAvatarPatterns) {
            if (lowerUrl.includes(pattern.toLowerCase())) {
                return false;
            }
        }

        // 检查是否为有效的图片URL
        try {
            const url = new URL(avatarUrl);
            // 检查是否为图片文件扩展名
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            const pathname = url.pathname.toLowerCase();
            const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));

            // 如果没有明确的图片扩展名，但URL看起来像图片服务，也认为有效
            const imageServicePatterns = [
                'jdbstatic.com/avatars/',
                'images.javdb.com/',
                'cdn.javdb.com/',
                '/avatars/',
                '/images/actors/'
            ];

            const hasImageService = imageServicePatterns.some(pattern =>
                avatarUrl.toLowerCase().includes(pattern)
            );

            return hasImageExtension || hasImageService;

        } catch (error) {
            // 如果URL解析失败，认为无效
            return false;
        }
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
