// src/services/newWorksCollector.ts
// 新作品采集服务

import type { 
    ActorSubscription, 
    NewWorksGlobalConfig, 
    NewWorkRecord,
    VideoRecord 
} from '../types';
import { getValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';

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
            const works = await this.parseActorWorksPage(actorWorksUrl);
            
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
    private async parseActorWorksPage(actorUrl: string): Promise<any[]> {
        try {
            // 添加延迟以避免频繁请求
            await this.delay(this.BASE_DELAY);
            
            const response = await fetch(actorUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            // 解析HTML获取作品信息
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const works: any[] = [];
            
            // 查找作品列表容器
            const movieItems = doc.querySelectorAll('.movie-list .item, .grid-item .item');
            
            movieItems.forEach(item => {
                try {
                    // 获取作品链接和ID
                    const linkElement = item.querySelector('a[href*="/v/"]');
                    if (!linkElement) return;
                    
                    const href = linkElement.getAttribute('href');
                    if (!href) return;
                    
                    const videoId = this.extractVideoIdFromUrl(href);
                    if (!videoId) return;
                    
                    // 获取标题
                    const titleElement = item.querySelector('.video-title, .title');
                    const title = titleElement?.textContent?.trim() || '';
                    
                    // 获取封面图
                    const imgElement = item.querySelector('img');
                    const coverImage = imgElement?.getAttribute('data-src') || imgElement?.getAttribute('src') || '';
                    
                    // 获取发行日期
                    const dateElement = item.querySelector('.meta, .video-meta');
                    const dateText = dateElement?.textContent?.trim() || '';
                    const releaseDate = this.extractDateFromText(dateText);
                    
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
            
        } catch (error) {
            console.error('解析演员作品页面失败:', error);
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
        const filteredWorks: any[] = [];
        
        // 获取本地记录用于状态检查
        const localRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
        
        // 计算日期范围
        let dateThreshold: Date | null = null;
        if (filters.dateRange > 0) {
            dateThreshold = new Date();
            dateThreshold.setMonth(dateThreshold.getMonth() - filters.dateRange);
        }
        
        for (const work of works) {
            // 检查日期范围
            if (dateThreshold && work.releaseDate) {
                const releaseDate = new Date(work.releaseDate);
                if (releaseDate < dateThreshold) {
                    continue;
                }
            }
            
            // 检查本地状态
            const localRecord = localRecords[work.id];
            if (localRecord) {
                if (filters.excludeViewed && localRecord.status === 'viewed') {
                    continue;
                }
                if (filters.excludeBrowsed && localRecord.status === 'browsed') {
                    continue;
                }
                if (filters.excludeWant && localRecord.status === 'want') {
                    continue;
                }
            }
            
            filteredWorks.push(work);
        }
        
        return filteredWorks;
    }

    /**
     * 检查作品是否已存在于新作品记录中
     */
    private async checkWorkExists(workId: string): Promise<boolean> {
        try {
            const newWorksData = await getValue<Record<string, NewWorkRecord>>(
                STORAGE_KEYS.NEW_WORKS_RECORDS, 
                {}
            );
            return workId in newWorksData;
        } catch (error) {
            console.error('检查作品存在性失败:', error);
            return false;
        }
    }

    /**
     * 从URL中提取视频ID
     */
    private extractVideoIdFromUrl(url: string): string | null {
        const match = url.match(/\/v\/([^\/\?]+)/);
        return match ? match[1] : null;
    }

    /**
     * 从文本中提取日期
     */
    private extractDateFromText(text: string): string | undefined {
        // 匹配常见的日期格式：YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
        const dateMatch = text.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
        if (dateMatch) {
            const [, year, month, day] = dateMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return undefined;
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

// 单例实例
export const newWorksCollector = new NewWorksCollector();
