// src/services/newWorks/collector.ts
// 新作品采集服务

import type {
    ActorSubscription,
    NewWorksGlobalConfig,
    NewWorkRecord
} from './types';
import type { VideoRecord } from '../../types';
import { viewedGetAll, newWorksGet } from '../../background/db';

export class NewWorksCollector {
    private readonly BASE_DELAY = 3000; // 基础延迟3秒

    /**
     * 检查单个演员的新作品
     */
    async checkActorNewWorks(
        subscription: ActorSubscription,
        globalConfig: NewWorksGlobalConfig
    ): Promise<NewWorkRecord[]> {
        try {
            console.log(`开始检查演员 ${subscription.actorName} 的新作品`);
            
            // 构建演员作品页面URL
            const actorWorksUrl = `https://javdb.com/actors/${subscription.actorId}`;
            
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
            const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
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

                                        works.push({
                                            id: videoId,
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
     * 检查多个演员的新作品
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
        
        for (const subscription of activeSubscriptions) {
            try {
                const works = await this.checkActorNewWorks(subscription, globalConfig);
                results.newWorks.push(...works);
                results.discovered += works.length;
                
                // 更新订阅的最后检查时间
                subscription.lastCheckTime = Date.now();
                
            } catch (error) {
                const errorMsg = `检查演员 ${subscription.actorName} 失败: ${error}`;
                console.error(errorMsg);
                results.errors.push(errorMsg);
            }
            
            // 在每个演员之间添加延迟
            if (globalConfig.requestInterval > 0) {
                await this.delay(globalConfig.requestInterval * 1000);
            }
        }

        return results;
    }
}
