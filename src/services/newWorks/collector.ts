// src/services/newWorks/collector.ts
// 新作品采集服务

import type {
    ActorSubscription,
    NewWorksGlobalConfig,
    NewWorkRecord
} from './types';
import type { VideoRecord } from '../../types';
import { viewedGetAll, newWorksGet } from '../../background/db';
import { buildJavDBUrl } from '../../utils/routeManager';

export class NewWorksCollector {
    private readonly BASE_DELAY = 3000; // 基础延迟3秒

    /**
     * 构建演员作品页面URL，应用类别筛选
     */
    private async buildActorWorksUrl(actorId: string, categoryFilters?: string[]): Promise<string> {
        let url = await buildJavDBUrl(`/actors/${actorId}`);
        
        // 如果有类别筛选，添加到URL参数
        // JavDB格式: ?t=s,d&sort_type=0 (用逗号分隔)
        if (categoryFilters && categoryFilters.length > 0) {
            const filterParam = categoryFilters.join(',');
            url += `?t=${filterParam}&sort_type=0`;
            console.log(`应用类别筛选: t=${filterParam}`);
        } else {
            console.log(`未应用类别筛选（显示所有类别）`);
        }
        
        return url;
    }

    /**
     * 检查单个演员的新作品
     */
    async checkActorNewWorks(
        subscription: ActorSubscription,
        globalConfig: NewWorksGlobalConfig
    ): Promise<NewWorkRecord[]> {
        try {
            console.log(`开始检查演员 ${subscription.actorName} 的新作品`);
            
            // 构建演员作品页面URL，应用类别筛选
            const actorWorksUrl = await this.buildActorWorksUrl(subscription.actorId, globalConfig.filters.categoryFilters);
            
            // 获取演员作品页面数据
            const works = await this.parseActorWorksPage(actorWorksUrl, globalConfig);
            
            // 应用全局过滤条件
            const filteredWorks = await this.applyGlobalFilters(works, globalConfig.filters);
            
            // 转换为NewWorkRecord格式
            const newWorks: NewWorkRecord[] = [];
            const now = Date.now();
            
            for (const work of filteredWorks.slice(0, globalConfig.maxWorksPerCheck)) {
                // 检查是否已存在
                const exists = await this.checkWorkExists(work.id);
                if (!exists) {
                    const newWork: NewWorkRecord = {
                        id: work.id,
                        actorId: subscription.actorId,
                        actorName: subscription.actorName,
                        title: work.title,
                        releaseDate: work.releaseDate,
                        javdbUrl: work.url,
                        coverImage: work.coverImage,
                        tags: work.tags || [],
                        discoveredAt: now,
                        isRead: false,
                        status: 'new'
                    };
                    newWorks.push(newWork);
                }
            }
            
            console.log(`演员 ${subscription.actorName} 发现 ${newWorks.length} 个新作品`);
            return newWorks;
            
        } catch (error) {
            console.error(`检查演员 ${subscription.actorName} 新作品失败:`, error);
            return [];
        }
    }

    /**
     * 解析演员作品页面
     */
    private async parseActorWorksPage(actorUrl: string, globalConfig: NewWorksGlobalConfig): Promise<any[]> {
        try {
            console.log(`正在请求演员作品页面: ${actorUrl}`);

            // 添加延迟以避免频繁请求
            await this.delay(this.BASE_DELAY);

            // 使用传入的全局配置确定时间过滤范围
            const dateThreshold = this.calculateDateThreshold(globalConfig.filters.dateRange);

            // 分页解析作品，遇到超出时间范围的作品时停止
            const works = await this.parseActorWorksWithPagination(actorUrl, dateThreshold);
            console.log(`解析到 ${works.length} 个作品`);

            return works;
            
        } catch (error) {
            console.error('解析演员作品页面失败:', error);

            // 提供更详细的错误信息
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.error('网络请求失败，可能的原因:');
                console.error('1. 网络连接问题');
                console.error('2. CORS 跨域限制');
                console.error('3. JavDB 网站访问限制');
                console.error('4. 扩展权限不足');

                // 检查扩展是否有访问 JavDB 的权限
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
                    const manifest = chrome.runtime.getManifest();
                    const permissions = manifest.permissions || [];
                    const hostPermissions = manifest.host_permissions || [];
                    console.log('扩展权限:', permissions);
                    console.log('主机权限:', hostPermissions);
                }
            }

            return [];
        }
    }

    /**
     * 应用全局过滤条件
     */
    private async applyGlobalFilters(
        works: any[],
        filters: NewWorksGlobalConfig['filters']
    ): Promise<any[]> {
        console.log(`开始应用过滤条件，原始作品数量: ${works.length}`);
        console.log('过滤设置:', filters);

        const filteredWorks: any[] = [];
        let filteredCount = {
            dateRange: 0,
            viewed: 0,
            browsed: 0,
            want: 0
        };

        // 使用 IndexedDB 番号库做状态检查（更准确）
        let recordMap = new Map<string, VideoRecord>();
        try {
            const all = await viewedGetAll();
            for (const r of all) { if (r?.id) recordMap.set(r.id, r); }
            console.log(`IDB 番号库记录数量: ${recordMap.size}`);
        } catch (e) {
            console.warn('读取 IDB 番号库失败，过滤将退化为不过滤已看/已浏览/想看', e);
            // 留空 recordMap 相当于不触发状态过滤
        }

        // 计算日期范围
        let dateThreshold: Date | null = null;
        if (filters.dateRange > 0) {
            dateThreshold = new Date();
            dateThreshold.setMonth(dateThreshold.getMonth() - filters.dateRange);
            console.log(`日期过滤阈值: ${dateThreshold.toISOString()}`);
        }

        for (const work of works) {
            let shouldExclude = false;
            let excludeReason = '';

            // 检查日期范围
            if (dateThreshold && work.releaseDate) {
                const releaseDate = new Date(work.releaseDate);
                if (releaseDate < dateThreshold) {
                    shouldExclude = true;
                    excludeReason = 'dateRange';
                    filteredCount.dateRange++;
                }
            }

            // 检查番号库状态
            if (!shouldExclude) {
                const localRecord = recordMap.get(work.id);
                if (localRecord) {
                    if (filters.excludeViewed && localRecord.status === 'viewed') {
                        shouldExclude = true;
                        excludeReason = 'viewed';
                        filteredCount.viewed++;
                    } else if (filters.excludeBrowsed && localRecord.status === 'browsed') {
                        shouldExclude = true;
                        excludeReason = 'browsed';
                        filteredCount.browsed++;
                    } else if (filters.excludeWant && localRecord.status === 'want') {
                        shouldExclude = true;
                        excludeReason = 'want';
                        filteredCount.want++;
                    }
                }
            }

            if (!shouldExclude) {
                filteredWorks.push(work);
            } else {
                console.log(`过滤掉作品 ${work.id} (${work.title})，原因: ${excludeReason}`);
            }
        }

        console.log('过滤统计:', filteredCount);
        console.log(`过滤后作品数量: ${filteredWorks.length}`);

        return filteredWorks;
    }

    /**
     * 应用全局过滤条件（返回过滤统计）
     */
    private async applyGlobalFiltersWithStats(
        works: any[],
        filters: NewWorksGlobalConfig['filters']
    ): Promise<{ filteredWorks: any[]; filteredCount: { dateRange: number; viewed: number; browsed: number; want: number } }> {
        console.log(`开始应用过滤条件(带统计)，原始作品数量: ${works.length}`);
        console.log('过滤设置:', filters);

        const filteredWorks: any[] = [];
        const filteredCount = {
            dateRange: 0,
            viewed: 0,
            browsed: 0,
            want: 0
        };

        // 使用 IndexedDB 番号库做状态检查（更准确）
        let recordMap = new Map<string, VideoRecord>();
        try {
            const all = await viewedGetAll();
            for (const r of all) { if (r?.id) recordMap.set(r.id, r); }
            console.log(`IDB 番号库记录数量: ${recordMap.size}`);
        } catch (e) {
            console.warn('读取 IDB 番号库失败，过滤将退化为不过滤已看/已浏览/想看', e);
            // 留空 recordMap 相当于不触发状态过滤
        }

        // 计算日期范围
        let dateThreshold: Date | null = null;
        if (filters.dateRange > 0) {
            dateThreshold = new Date();
            dateThreshold.setMonth(dateThreshold.getMonth() - filters.dateRange);
            console.log(`日期过滤阈值: ${dateThreshold.toISOString()}`);
        }

        for (const work of works) {
            let shouldExclude = false;
            let excludeReason: keyof typeof filteredCount | '' = '';

            // 检查日期范围
            if (dateThreshold && work.releaseDate) {
                const releaseDate = new Date(work.releaseDate);
                if (releaseDate < dateThreshold) {
                    shouldExclude = true;
                    excludeReason = 'dateRange';
                }
            }

            // 检查番号库状态
            if (!shouldExclude) {
                const localRecord = recordMap.get(work.id);
                if (localRecord) {
                    console.log(`作品 ${work.id} 在番号库中找到，状态: ${localRecord.status}，过滤设置: viewed=${filters.excludeViewed}, browsed=${filters.excludeBrowsed}, want=${filters.excludeWant}`);
                    
                    if (filters.excludeViewed && localRecord.status === 'viewed') {
                        shouldExclude = true;
                        excludeReason = 'viewed';
                        console.log(`  -> 排除原因: 已看过`);
                    } else if (filters.excludeBrowsed && localRecord.status === 'browsed') {
                        shouldExclude = true;
                        excludeReason = 'browsed';
                        console.log(`  -> 排除原因: 已浏览`);
                    } else if (filters.excludeWant && localRecord.status === 'want') {
                        shouldExclude = true;
                        excludeReason = 'want';
                        console.log(`  -> 排除原因: 想看`);
                    } else {
                        console.log(`  -> 不排除（状态不匹配或未启用对应过滤）`);
                    }
                } else {
                    console.log(`作品 ${work.id} 不在番号库中，不过滤`);
                }
            }

            if (!shouldExclude) {
                filteredWorks.push(work);
            } else {
                if (excludeReason) (filteredCount as any)[excludeReason]++;
            }
        }

        console.log('过滤统计(带统计):', filteredCount);
        console.log(`过滤后作品数量: ${filteredWorks.length}`);

        return { filteredWorks, filteredCount };
    }

    /**
     * 检查单个演员的新作品（返回详细统计）
     */
    async checkActorNewWorksDetailed(
        subscription: ActorSubscription,
        globalConfig: NewWorksGlobalConfig
    ): Promise<{ works: NewWorkRecord[]; identified: number; effective: number }> {
        try {
            console.log(`开始(详细)检查演员 ${subscription.actorName} 的新作品`);

            // 构建演员作品页面URL，应用类别筛选
            const actorWorksUrl = await this.buildActorWorksUrl(subscription.actorId, globalConfig.filters.categoryFilters);
            const worksRaw = await this.parseActorWorksPage(actorWorksUrl, globalConfig);
            const identified = worksRaw.length;

            const { filteredWorks } = await this.applyGlobalFiltersWithStats(worksRaw, globalConfig.filters);
            const effective = filteredWorks.length;

            const newWorks: NewWorkRecord[] = [];
            const now = Date.now();
            console.log(`开始检查 ${filteredWorks.length} 个过滤后的作品是否已存在`);
            for (const work of filteredWorks.slice(0, globalConfig.maxWorksPerCheck)) {
                const exists = await this.checkWorkExists(work.id);
                console.log(`作品 ${work.id} (${work.title}) 存在性检查: ${exists ? '已存在' : '新作品'}`);
                if (!exists) {
                    newWorks.push({
                        id: work.id,
                        actorId: subscription.actorId,
                        actorName: subscription.actorName,
                        title: work.title,
                        releaseDate: work.releaseDate,
                        javdbUrl: work.url,
                        coverImage: work.coverImage,
                        tags: work.tags || [],
                        discoveredAt: now,
                        isRead: false,
                        status: 'new'
                    });
                }
            }
            console.log(`检查完成，发现 ${newWorks.length} 个新作品`);


            return { works: newWorks, identified, effective };
        } catch (error) {
            console.error(`(详细)检查演员 ${subscription.actorName} 新作品失败:`, error);
            return { works: [], identified: 0, effective: 0 };
        }
    }

    /**
     * 检查作品是否已存在于新作品记录中
     */
    private async checkWorkExists(workId: string): Promise<boolean> {
        try {
            const existing = await newWorksGet(workId);
            return !!existing;
        } catch (error) {
            console.error('检查作品存在性失败:', error);
            return false;
        }
    }

    

    /**
     * 分页解析演员作品，遇到超出时间范围的作品时停止
     */
    private async parseActorWorksWithPagination(baseUrl: string, dateThreshold: Date | null): Promise<any[]> {
        const allWorks: any[] = [];
        let currentPage = 1;
        let shouldContinue = true;

        console.log(`开始分页解析演员作品，时间阈值: ${dateThreshold?.toISOString() || '无限制'}`);

        while (shouldContinue) {
            // 构建分页URL，保留已有的查询参数
            let pageUrl: string;
            if (currentPage === 1) {
                pageUrl = baseUrl;
            } else {
                // 检查baseUrl是否已有查询参数
                const separator = baseUrl.includes('?') ? '&' : '?';
                pageUrl = `${baseUrl}${separator}page=${currentPage}`;
            }
            
            console.log(`解析第 ${currentPage} 页: ${pageUrl}`);

            try {
                const pageWorks = await this.parseActorWorksInTab(pageUrl);

                if (pageWorks.length === 0) {
                    console.log(`第 ${currentPage} 页没有作品，停止解析`);
                    break;
                }

                // 检查是否有超出时间范围的作品
                let hasOldWorks = false;
                for (const work of pageWorks) {
                    if (dateThreshold && work.releaseDate) {
                        const releaseDate = new Date(work.releaseDate);
                        if (releaseDate < dateThreshold) {
                            console.log(`发现超出时间范围的作品: ${work.id} (${work.releaseDate})，停止解析后续页面`);
                            hasOldWorks = true;
                            break;
                        }
                    }
                    allWorks.push(work);
                }

                if (hasOldWorks) {
                    shouldContinue = false;
                } else {
                    currentPage++;

                    // 添加页面间延迟
                    if (shouldContinue) {
                        await this.delay(this.BASE_DELAY);
                    }
                }

            } catch (error) {
                console.error(`解析第 ${currentPage} 页失败:`, error);
                break;
            }
        }

        console.log(`分页解析完成，共获取 ${allWorks.length} 个作品，解析了 ${currentPage} 页`);
        return allWorks;
    }

    /**
     * 在标签页中解析演员作品数据
     */
    private async parseActorWorksInTab(url: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            // 创建一个隐藏的标签页
            chrome.tabs.create({
                url: url,
                active: false
            }, (tab) => {
                if (!tab || !tab.id) {
                    reject(new Error('无法创建标签页'));
                    return;
                }

                const tabId = tab.id;
                let isResolved = false;

                // 设置超时
                const timeout = setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        chrome.tabs.remove(tabId);
                        reject(new Error('解析作品数据超时'));
                    }
                }, 30000); // 30秒超时

                // 监听标签页加载完成
                const onUpdated = (updatedTabId: number, changeInfo: any) => {
                    if (updatedTabId === tabId && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(onUpdated);

                        // 注入脚本解析作品数据
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            func: () => {
                                const works: any[] = [];

                                // 查找作品列表容器
                                const movieItems = document.querySelectorAll('.movie-list .item, .grid-item .item');

                                movieItems.forEach(item => {
                                    try {
                                        // 获取作品链接和ID
                                        const linkElement = item.querySelector('a[href*="/v/"]');
                                        if (!linkElement) return;

                                        const href = linkElement.getAttribute('href');
                                        if (!href) return;

                                        // 提取视频ID
                                        const videoIdMatch = href.match(/\/v\/([^\/\?]+)/);
                                        if (!videoIdMatch) return;
                                        const videoId = videoIdMatch[1];

                                        // 获取标题
                                        const titleElement = item.querySelector('.video-title, .title');
                                        const title = titleElement?.textContent?.trim() || '';

                                        // 从标题中提取番号作为ID（用于与番号库匹配）
                                        // 标题格式通常是: "MIAB-608 【FANZA限定】..."
                                        let actualId = videoId; // 默认使用JavDB ID
                                        const codeMatch = title.match(/^([A-Z]+-\d+)/);
                                        if (codeMatch) {
                                            actualId = codeMatch[1]; // 使用番号作为ID
                                            console.log(`提取番号: ${actualId} (JavDB ID: ${videoId})`);
                                        } else {
                                            console.log(`未能从标题提取番号，使用JavDB ID: ${videoId}, 标题: ${title}`);
                                        }

                                        // 获取封面图
                                        const imgElement = item.querySelector('img');
                                        const coverImage = imgElement?.getAttribute('data-src') || imgElement?.getAttribute('src') || '';

                                        // 获取发行日期
                                        const dateElement = item.querySelector('.meta, .video-meta');
                                        const dateText = dateElement?.textContent?.trim() || '';

                                        // 简单的日期提取
                                        let releaseDate = '';
                                        const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2})/);
                                        if (dateMatch) {
                                            releaseDate = dateMatch[1];
                                        }

                                        // 获取标签
                                        const tagElements = item.querySelectorAll('.tag, .genre');
                                        const tags: string[] = [];
                                        tagElements.forEach(tag => {
                                            const tagText = tag.textContent?.trim();
                                            if (tagText) tags.push(tagText);
                                        });

                                        // 注意：URL 始终使用 javdb.com 作为持久化存储的域名
                                        // 显示时会通过 RouteManager 动态替换为当前选择的线路
                                        works.push({
                                            id: actualId, // 使用提取的番号或JavDB ID
                                            javdbId: videoId, // 保留JavDB ID用于链接
                                            title,
                                            url: `https://javdb.com${href}`,
                                            coverImage,
                                            releaseDate,
                                            tags
                                        });

                                    } catch (error) {
                                        console.warn('解析作品项失败:', error);
                                    }
                                });

                                return works;
                            }
                        }, (results) => {
                            clearTimeout(timeout);
                            chrome.tabs.remove(tabId);

                            if (!isResolved) {
                                isResolved = true;
                                if (results && results[0] && results[0].result) {
                                    resolve(results[0].result as any[]);
                                } else {
                                    resolve([]);
                                }
                            }
                        });
                    }
                };

                chrome.tabs.onUpdated.addListener(onUpdated);
            });
        });
    }

    

    /**
     * 计算日期阈值
     */
    private calculateDateThreshold(dateRangeMonths: number): Date | null {
        if (dateRangeMonths <= 0) {
            return null; // 不限制时间范围
        }

        const threshold = new Date();
        threshold.setMonth(threshold.getMonth() - dateRangeMonths);
        return threshold;
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 检查多个演员的新作品（支持并发）
     */
    async checkMultipleActors(
        subscriptions: ActorSubscription[],
        globalConfig: NewWorksGlobalConfig
    ): Promise<{
        discovered: number;
        errors: string[];
        newWorks: NewWorkRecord[];
    }> {
        const results = {
            discovered: 0,
            errors: [] as string[],
            newWorks: [] as NewWorkRecord[]
        };

        const activeSubscriptions = subscriptions.filter(sub => sub.enabled);
        const concurrency = globalConfig.concurrency || 1;
        
        console.log(`[NewWorksCollector] 开始检查 ${activeSubscriptions.length} 个演员，并发数: ${concurrency}`);
        
        // 使用并发控制
        for (let i = 0; i < activeSubscriptions.length; i += concurrency) {
            const batch = activeSubscriptions.slice(i, i + concurrency);
            console.log(`[NewWorksCollector] 处理批次 ${Math.floor(i / concurrency) + 1}，包含 ${batch.length} 个演员`);
            
            // 并发检查当前批次
            const batchPromises = batch.map(async (subscription) => {
                try {
                    const works = await this.checkActorNewWorks(subscription, globalConfig);
                    
                    // 更新订阅的最后检查时间
                    subscription.lastCheckTime = Date.now();
                    
                    return {
                        success: true,
                        works,
                        actorName: subscription.actorName
                    };
                } catch (error) {
                    const errorMsg = `检查演员 ${subscription.actorName} 失败: ${error}`;
                    console.error(errorMsg);
                    return {
                        success: false,
                        error: errorMsg,
                        actorName: subscription.actorName
                    };
                }
            });
            
            // 等待当前批次完成
            const batchResults = await Promise.all(batchPromises);
            
            // 处理批次结果
            for (const result of batchResults) {
                if (result.success && result.works) {
                    results.newWorks.push(...result.works);
                    results.discovered += result.works.length;
                    console.log(`[NewWorksCollector] 演员 ${result.actorName} 发现 ${result.works.length} 个新作品`);
                } else if (!result.success && result.error) {
                    results.errors.push(result.error);
                }
            }
            
            // 在批次之间添加延迟（如果不是最后一个批次）
            if (i + concurrency < activeSubscriptions.length && globalConfig.requestInterval > 0) {
                console.log(`[NewWorksCollector] 批次间延迟 ${globalConfig.requestInterval} 秒`);
                await this.delay(globalConfig.requestInterval * 1000);
            }
        }

        console.log(`[NewWorksCollector] 检查完成，共发现 ${results.discovered} 个新作品，${results.errors.length} 个错误`);
        return results;
    }
}
