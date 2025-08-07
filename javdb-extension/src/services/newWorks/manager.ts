// src/services/newWorks/manager.ts
// 新作品管理服务

import { getValue, setValue } from '../../utils/storage';
import { STORAGE_KEYS, DEFAULT_NEW_WORKS_CONFIG } from '../../utils/config';
import type {
    ActorSubscription,
    NewWorksGlobalConfig,
    NewWorkRecord,
    NewWorksStats,
    NewWorksSearchResult
} from './types';
import type { ActorRecord } from '../../types';
import { actorManager } from '../actorManager';

export class NewWorksManager {
    private subscriptions: Map<string, ActorSubscription> = new Map();
    private newWorks: Map<string, NewWorkRecord> = new Map();
    private globalConfig: NewWorksGlobalConfig = DEFAULT_NEW_WORKS_CONFIG;
    private isLoaded = false;

    /**
     * 初始化新作品管理器
     */
    async initialize(): Promise<void> {
        if (this.isLoaded) return;
        
        try {
            // 加载全局配置
            this.globalConfig = await getValue<NewWorksGlobalConfig>(
                STORAGE_KEYS.NEW_WORKS_CONFIG, 
                DEFAULT_NEW_WORKS_CONFIG
            );

            // 加载订阅数据
            const subscriptionsData = await getValue<Record<string, ActorSubscription>>(
                STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS,
                {}
            );
            console.log('NewWorksManager: 从存储加载的订阅数据:', subscriptionsData);
            this.subscriptions.clear();
            Object.values(subscriptionsData).forEach(sub => {
                // 确保 enabled 字段存在，如果不存在则默认为 true
                if (sub.enabled === undefined) {
                    sub.enabled = true;
                    console.log(`NewWorksManager: 订阅 ${sub.actorName} 缺少 enabled 字段，设置为 true`);
                }
                this.subscriptions.set(sub.actorId, sub);
            });

            // 加载新作品数据
            const newWorksData = await getValue<Record<string, NewWorkRecord>>(
                STORAGE_KEYS.NEW_WORKS_RECORDS, 
                {}
            );
            this.newWorks.clear();
            Object.values(newWorksData).forEach(work => {
                this.newWorks.set(work.id, work);
            });

            this.isLoaded = true;
            console.log(`NewWorksManager: Loaded ${this.subscriptions.size} subscriptions, ${this.newWorks.size} works`);
        } catch (error) {
            console.error('NewWorksManager: Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * 获取全局配置
     */
    async getGlobalConfig(): Promise<NewWorksGlobalConfig> {
        await this.initialize();
        return { ...this.globalConfig };
    }

    /**
     * 更新全局配置
     */
    async updateGlobalConfig(config: Partial<NewWorksGlobalConfig>): Promise<void> {
        await this.initialize();
        
        this.globalConfig = { ...this.globalConfig, ...config };
        await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, this.globalConfig);
    }

    /**
     * 添加演员订阅
     */
    async addSubscription(actorId: string): Promise<void> {
        await this.initialize();
        
        // 检查演员是否存在
        const actor = await actorManager.getActorById(actorId);
        if (!actor) {
            throw new Error(`演员 ${actorId} 不存在`);
        }

        // 检查是否已订阅
        if (this.subscriptions.has(actorId)) {
            throw new Error(`演员 ${actor.name} 已经订阅`);
        }

        const subscription: ActorSubscription = {
            actorId,
            actorName: actor.name,
            avatarUrl: actor.avatarUrl,
            subscribedAt: Date.now(),
            enabled: true
        };

        this.subscriptions.set(actorId, subscription);
        await this.saveSubscriptions();
    }

    /**
     * 移除演员订阅
     */
    async removeSubscription(actorId: string): Promise<void> {
        await this.initialize();
        
        if (this.subscriptions.has(actorId)) {
            this.subscriptions.delete(actorId);
            await this.saveSubscriptions();
        }
    }

    /**
     * 获取所有订阅
     */
    async getSubscriptions(): Promise<ActorSubscription[]> {
        await this.initialize();
        const subscriptions = Array.from(this.subscriptions.values());
        console.log(`NewWorksManager: 获取订阅列表，共 ${subscriptions.length} 个订阅`);
        subscriptions.forEach(sub => {
            console.log(`  - ${sub.actorName} (${sub.actorId}): enabled=${sub.enabled}`);
        });
        return subscriptions;
    }

    /**
     * 切换订阅状态
     */
    async toggleSubscription(actorId: string, enabled: boolean): Promise<void> {
        await this.initialize();

        const subscription = this.subscriptions.get(actorId);
        if (subscription) {
            console.log(`NewWorksManager: 切换订阅状态 - 演员: ${subscription.actorName}, 从 ${subscription.enabled} 切换到 ${enabled}`);
            subscription.enabled = enabled;
            this.subscriptions.set(actorId, subscription);
            await this.saveSubscriptions();
            console.log(`NewWorksManager: 订阅状态已保存`);
        } else {
            console.warn(`NewWorksManager: 未找到演员订阅 ${actorId}`);
        }
    }

    /**
     * 获取新作品列表
     */
    async getNewWorks(filters?: {
        search?: string;
        filter?: 'all' | 'unread' | 'today' | 'week';
        sort?: string;
        page?: number;
        pageSize?: number;
    }): Promise<NewWorksSearchResult> {
        await this.initialize();

        const {
            search = '',
            filter = 'all',
            sort = 'discoveredAt_desc',
            page = 1,
            pageSize = 20
        } = filters || {};

        let works = Array.from(this.newWorks.values());

        // 搜索过滤
        if (search.trim()) {
            const lowerSearch = search.toLowerCase();
            works = works.filter(work => 
                work.title.toLowerCase().includes(lowerSearch) ||
                work.actorName.toLowerCase().includes(lowerSearch) ||
                work.id.toLowerCase().includes(lowerSearch)
            );
        }

        // 状态过滤
        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const weekStart = now - 7 * 24 * 60 * 60 * 1000;

        switch (filter) {
            case 'unread':
                works = works.filter(work => !work.isRead);
                break;
            case 'today':
                works = works.filter(work => work.discoveredAt >= todayStart);
                break;
            case 'week':
                works = works.filter(work => work.discoveredAt >= weekStart);
                break;
        }

        // 排序
        works.sort((a, b) => {
            const [field, order] = sort.split('_');
            let aValue: any, bValue: any;

            switch (field) {
                case 'discoveredAt':
                    aValue = a.discoveredAt;
                    bValue = b.discoveredAt;
                    break;
                case 'releaseDate':
                    aValue = a.releaseDate || '';
                    bValue = b.releaseDate || '';
                    break;
                case 'actorName':
                    aValue = a.actorName.toLowerCase();
                    bValue = b.actorName.toLowerCase();
                    break;
                default:
                    aValue = a.discoveredAt;
                    bValue = b.discoveredAt;
            }

            if (order === 'desc') {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
        });

        // 分页
        const total = works.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageWorks = works.slice(startIndex, endIndex);

        // 获取统计信息
        const stats = await this.getStats();

        return {
            works: pageWorks,
            total,
            page,
            pageSize,
            hasMore: endIndex < total,
            stats
        };
    }

    /**
     * 标记为已读
     */
    async markAsRead(workIds: string[]): Promise<void> {
        await this.initialize();
        
        let hasChanges = false;
        workIds.forEach(id => {
            const work = this.newWorks.get(id);
            if (work && !work.isRead) {
                work.isRead = true;
                this.newWorks.set(id, work);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            await this.saveNewWorks();
        }
    }

    /**
     * 删除作品
     */
    async deleteWorks(workIds: string[]): Promise<void> {
        await this.initialize();
        
        let hasChanges = false;
        workIds.forEach(id => {
            if (this.newWorks.has(id)) {
                this.newWorks.delete(id);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            await this.saveNewWorks();
        }
    }

    /**
     * 清理旧作品
     */
    async cleanupOldWorks(): Promise<number> {
        await this.initialize();
        
        if (!this.globalConfig.autoCleanup) {
            return 0;
        }

        const cutoffTime = Date.now() - this.globalConfig.cleanupDays * 24 * 60 * 60 * 1000;
        const worksToDelete: string[] = [];

        this.newWorks.forEach((work, id) => {
            if (work.discoveredAt < cutoffTime && work.isRead) {
                worksToDelete.push(id);
            }
        });

        if (worksToDelete.length > 0) {
            await this.deleteWorks(worksToDelete);
        }

        return worksToDelete.length;
    }

    /**
     * 获取统计信息
     */
    async getStats(): Promise<NewWorksStats> {
        await this.initialize();

        const subscriptions = Array.from(this.subscriptions.values());
        const works = Array.from(this.newWorks.values());

        console.log(`NewWorksManager: 统计信息 - 订阅数: ${subscriptions.length}, 新作品数: ${works.length}`);

        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);

        const stats = {
            totalSubscriptions: subscriptions.length,
            activeSubscriptions: subscriptions.filter(sub => sub.enabled).length,
            totalNewWorks: works.length,
            unreadWorks: works.filter(work => !work.isRead).length,
            todayDiscovered: works.filter(work => work.discoveredAt >= todayStart).length,
            lastCheckTime: this.globalConfig.lastGlobalCheck
        };

        console.log('NewWorksManager: 返回统计信息:', stats);
        return stats;
    }

    /**
     * 保存订阅数据
     */
    private async saveSubscriptions(): Promise<void> {
        const subscriptionsObject: Record<string, ActorSubscription> = {};
        this.subscriptions.forEach((sub, id) => {
            subscriptionsObject[id] = sub;
        });
        
        await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, subscriptionsObject);
    }

    /**
     * 保存新作品数据
     */
    private async saveNewWorks(): Promise<void> {
        const newWorksObject: Record<string, NewWorkRecord> = {};
        this.newWorks.forEach((work, id) => {
            newWorksObject[id] = work;
        });
        
        await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, newWorksObject);
    }

    /**
     * 添加新作品记录
     */
    async addNewWork(work: NewWorkRecord): Promise<void> {
        await this.initialize();
        
        // 检查是否已存在
        if (!this.newWorks.has(work.id)) {
            this.newWorks.set(work.id, work);
            await this.saveNewWorks();
        }
    }

    /**
     * 批量添加新作品记录
     */
    async addNewWorks(works: NewWorkRecord[]): Promise<void> {
        await this.initialize();
        
        let hasChanges = false;
        works.forEach(work => {
            if (!this.newWorks.has(work.id)) {
                this.newWorks.set(work.id, work);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            await this.saveNewWorks();
        }
    }
}
