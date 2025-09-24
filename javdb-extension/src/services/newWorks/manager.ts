// src/services/newWorks/manager.ts
// 新作品管理服务

import { getValue, setValue } from '../../utils/storage';
import { STORAGE_KEYS, DEFAULT_NEW_WORKS_CONFIG } from '../../utils/config';
import { log } from '../../utils/logController';
import type {
    ActorSubscription,
    NewWorksGlobalConfig,
    NewWorkRecord,
    NewWorksStats,
    NewWorksSearchResult
} from './types';
import type { VideoRecord } from '../../types';
import { actorManager } from '../actorManager';
import { dbNewWorksQuery, dbNewWorksStats, dbNewWorksGet, dbNewWorksPut, dbNewWorksBulkPut, dbNewWorksDelete, dbNewWorksGetAll } from '../../dashboard/dbClient';
import { dbViewedPage } from '../../dashboard/dbClient';

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
            log.verbose('NewWorksManager: 从存储加载的订阅数据:', subscriptionsData);
            this.subscriptions.clear();
            Object.values(subscriptionsData).forEach(sub => {
                // 确保 enabled 字段存在，如果不存在则默认为 true
                if (sub.enabled === undefined) {
                    sub.enabled = true;
                    log.verbose(`NewWorksManager: 订阅 ${sub.actorName} 缺少 enabled 字段，设置为 true`);
                }
                this.subscriptions.set(sub.actorId, sub);
            });

            // 加载新作品数据（用于兼容与回退）
            const newWorksData = await getValue<Record<string, NewWorkRecord>>(STORAGE_KEYS.NEW_WORKS_RECORDS, {});
            this.newWorks.clear();
            Object.values(newWorksData).forEach(work => { this.newWorks.set(work.id, work); });

            this.isLoaded = true;
            log.verbose(`NewWorksManager: Loaded ${this.subscriptions.size} subscriptions, ${this.newWorks.size} works`);
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
     * 删除作品
     */
    async deleteWorks(workIds: string[]): Promise<void> {
        await this.initialize();
        let changed = false;
        for (const id of workIds) {
            if (this.newWorks.has(id)) { this.newWorks.delete(id); changed = true; }
            try { await dbNewWorksDelete(id); } catch {}
        }
        if (changed) await this.saveNewWorks();
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
        log.verbose(`NewWorksManager: 获取订阅列表，共 ${subscriptions.length} 个订阅`);
        subscriptions.forEach(sub => {
            log.verbose(`  - ${sub.actorName} (${sub.actorId}): enabled=${sub.enabled}`);
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
            log.verbose(`NewWorksManager: 切换订阅状态 - 演员: ${subscription.actorName}, 从 ${subscription.enabled} 切换到 ${enabled}`);
            subscription.enabled = enabled;
            this.subscriptions.set(actorId, subscription);
            await this.saveSubscriptions();
            log.verbose(`NewWorksManager: 订阅状态已保存`);
        } else {
            log.warn(`NewWorksManager: 未找到演员订阅 ${actorId}`);
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

        const { search = '', filter = 'all', sort = 'discoveredAt_desc', page = 1, pageSize = 20 } = filters || {};

        // 优先使用 IDB 查询
        try {
            const sortField = (sort.split('_')[0] as 'discoveredAt' | 'releaseDate' | 'actorName');
            const sortOrder = (sort.split('_')[1] === 'asc' ? 'asc' : 'desc');
            const { items, total } = await dbNewWorksQuery({
                search,
                filter,
                sort: sortField,
                order: sortOrder,
                offset: (page - 1) * pageSize,
                limit: pageSize,
            });
            const statsLite = await dbNewWorksStats();
            const stats = {
                totalSubscriptions: (await this.getSubscriptions()).length,
                activeSubscriptions: (await this.getSubscriptions()).filter(s => s.enabled).length,
                totalNewWorks: statsLite.total,
                unreadWorks: statsLite.unread,
                todayDiscovered: statsLite.today,
                lastCheckTime: this.globalConfig.lastGlobalCheck,
            } as NewWorksStats;

            return {
                works: items,
                total,
                page,
                pageSize,
                hasMore: page * pageSize < total,
                stats,
            };
        } catch (e) {
            log.warn('NewWorksManager: 使用 IDB 查询失败，回退到本地缓存', e);
        }

        // 回退：使用缓存
        let works = Array.from(this.newWorks.values());
        const lowerSearch = search.trim().toLowerCase();
        if (lowerSearch) {
            works = works.filter(w => w.title.toLowerCase().includes(lowerSearch) || w.actorName.toLowerCase().includes(lowerSearch) || w.id.toLowerCase().includes(lowerSearch));
        }
        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const weekStart = now - 7 * 24 * 60 * 60 * 1000;
        if (filter === 'unread') works = works.filter(w => !w.isRead);
        else if (filter === 'today') works = works.filter(w => w.discoveredAt >= todayStart);
        else if (filter === 'week') works = works.filter(w => w.discoveredAt >= weekStart);
        const [field, order] = sort.split('_');
        works.sort((a, b) => {
            let av: any; let bv: any;
            switch (field) {
                case 'releaseDate': av = a.releaseDate || ''; bv = b.releaseDate || ''; break;
                case 'actorName': av = a.actorName.toLowerCase(); bv = b.actorName.toLowerCase(); break;
                case 'discoveredAt':
                default: av = a.discoveredAt; bv = b.discoveredAt;
            }
            if (typeof av === 'string' && typeof bv === 'string') {
                const cmp = av.localeCompare(bv);
                return order === 'asc' ? cmp : -cmp;
            }
            return order === 'asc' ? (av - bv) : (bv - av);
        });
        const total = works.length;
        const pageWorks = works.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        const stats = await this.getStats();
        return { works: pageWorks, total, page, pageSize, hasMore: page * pageSize < total, stats };
    }

    /**
     * 标记为已读
     */
    async markAsRead(workIds: string[]): Promise<void> {
        await this.initialize();
        let pending: NewWorkRecord[] = [];
        for (const id of workIds) {
            try {
                const cur = await dbNewWorksGet(id);
                if (cur && !cur.isRead) {
                    cur.isRead = true;
                    pending.push(cur);
                    this.newWorks.set(id, cur);
                } else if (!cur) {
                    const backup = this.newWorks.get(id);
                    if (backup && !backup.isRead) {
                        backup.isRead = true;
                        pending.push(backup);
                        this.newWorks.set(id, backup);
                    }
                }
            } catch (e) {
                // 回退：只更新缓存
                const backup = this.newWorks.get(id);
                if (backup && !backup.isRead) {
                    backup.isRead = true;
                    this.newWorks.set(id, backup);
                    pending.push(backup);
                }
            }
        }
        if (pending.length > 0) {
            try { await dbNewWorksBulkPut(pending); } catch {}
            await this.saveNewWorks();
        }
    }


    /**
     * 清理所有已读作品
     * 返回删除的数量
     */
    async cleanupReadWorks(): Promise<number> {
        await this.initialize();
        try {
            const all = await dbNewWorksGetAll();
            const toDelete = all.filter(w => w.isRead).map(w => w.id);
            await this.deleteWorks(toDelete);
            return toDelete.length;
        } catch {
            const worksToDelete: string[] = [];
            this.newWorks.forEach((work, id) => { if (work.isRead) worksToDelete.push(id); });
            if (worksToDelete.length > 0) await this.deleteWorks(worksToDelete);
            return worksToDelete.length;
        }
    }

    /**
     * 清理旧作品
     */
    async cleanupOldWorks(): Promise<number> {
        await this.initialize();
        if (!this.globalConfig.autoCleanup) return 0;
        const cutoffTime = Date.now() - this.globalConfig.cleanupDays * 24 * 60 * 60 * 1000;
        try {
            const all = await dbNewWorksGetAll();
            const toDelete = all.filter(w => (w.discoveredAt || 0) < cutoffTime && w.isRead).map(w => w.id);
            await this.deleteWorks(toDelete);
            return toDelete.length;
        } catch {
            const worksToDelete: string[] = [];
            this.newWorks.forEach((work, id) => { if ((work.discoveredAt || 0) < cutoffTime && work.isRead) worksToDelete.push(id); });
            if (worksToDelete.length > 0) await this.deleteWorks(worksToDelete);
            return worksToDelete.length;
        }
    }

    /**
     * 同步新作品状态与番号库记录
     * 检查番号库中是否有对应记录，如果有则更新新作品的状态
     */
    async syncWithVideoRecords(): Promise<{ updated: number; details: Array<{ id: string; oldStatus: string; newStatus: string }> }> {
        await this.initialize();

        // 优先从 IDB 分页获取所有 viewed 记录，构建 Map
        const viewedMap: Record<string, VideoRecord> = {} as any;
        try {
            let offset = 0;
            const limit = 1000;
            // 先获取总数
            let page = await dbViewedPage({ offset, limit, orderBy: 'updatedAt', order: 'desc' });
            let total = page.total;
            while (true) {
                page.items.forEach(v => { if (v?.id) viewedMap[v.id] = v; });
                offset += limit;
                if (offset >= total) break;
                page = await dbViewedPage({ offset, limit, orderBy: 'updatedAt', order: 'desc' });
            }
        } catch (e) {
            const fallback = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
            Object.assign(viewedMap, fallback);
        }

        // 从 IDB 获取全部新作品
        let works = [] as NewWorkRecord[];
        try {
            works = await dbNewWorksGetAll();
        } catch {
            works = Array.from(this.newWorks.values());
        }

        let updatedCount = 0;
        const updateDetails: Array<{ id: string; oldStatus: string; newStatus: string }> = [];
        const toUpdate: NewWorkRecord[] = [];

        for (const work of works) {
            const id = work.id;
            const videoRecord = viewedMap[id];
            if (!videoRecord) continue;
            const oldStatus = work.isRead ? 'read' : 'unread';
            let newIsRead = false;
            let newStatus: NewWorkRecord['status'] = 'new';
            switch (videoRecord.status) {
                case 'viewed': newIsRead = true; newStatus = 'viewed'; break;
                case 'browsed': newIsRead = true; newStatus = 'browsed'; break;
                case 'want': newIsRead = false; newStatus = 'want'; break;
            }
            if (work.isRead !== newIsRead || work.status !== newStatus) {
                const updated = { ...work, isRead: newIsRead, status: newStatus } as NewWorkRecord;
                toUpdate.push(updated);
                this.newWorks.set(id, updated);
                updatedCount++;
                updateDetails.push({ id, oldStatus, newStatus: newIsRead ? `read (${newStatus})` : `unread (${newStatus})` });
            }
        }

        if (toUpdate.length > 0) {
            try { await dbNewWorksBulkPut(toUpdate); } catch {}
            await this.saveNewWorks();
        }

        return { updated: updatedCount, details: updateDetails };
    }

    /**
     * 获取统计信息
     */
    async getStats(): Promise<NewWorksStats> {
        await this.initialize();

        const subscriptions = Array.from(this.subscriptions.values());
        const todayStart = new Date().setHours(0, 0, 0, 0);

        try {
            // 优先使用 IndexedDB 统计，更快更准确
            const lite = await dbNewWorksStats();
            const stats = {
                totalSubscriptions: subscriptions.length,
                activeSubscriptions: subscriptions.filter(sub => sub.enabled).length,
                totalNewWorks: lite.total,
                unreadWorks: lite.unread,
                todayDiscovered: lite.today,
                lastCheckTime: this.globalConfig.lastGlobalCheck,
            } as NewWorksStats;
            log.verbose('NewWorksManager: 返回统计信息(IDB):', stats);
            return stats;
        } catch (e) {
            // 回退：使用内存缓存统计
            const works = Array.from(this.newWorks.values());
            const stats = {
                totalSubscriptions: subscriptions.length,
                activeSubscriptions: subscriptions.filter(sub => sub.enabled).length,
                totalNewWorks: works.length,
                unreadWorks: works.filter(work => !work.isRead).length,
                todayDiscovered: works.filter(work => (work.discoveredAt || 0) >= todayStart).length,
                lastCheckTime: this.globalConfig.lastGlobalCheck
            } as NewWorksStats;
            log.verbose('NewWorksManager: 返回统计信息(内存回退):', stats);
            return stats;
        }
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
        this.newWorks.forEach((work, id) => { newWorksObject[id] = work; });
        // 先保存到本地存储，保持兼容
        await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, newWorksObject);
        // 再尝试批量写入 IDB
        try { await dbNewWorksBulkPut(Object.values(newWorksObject)); } catch {}
    }

    /**
     * 添加新作品记录
     */
    async addNewWork(work: NewWorkRecord): Promise<void> {
        await this.initialize();
        if (!this.newWorks.has(work.id)) {
            this.newWorks.set(work.id, work);
            await this.saveNewWorks();
        }
        try { await dbNewWorksPut(work); } catch {}
    }

    /**
     * 批量添加新作品记录
     */
    async addNewWorks(works: NewWorkRecord[]): Promise<void> {
        await this.initialize();
        let hasChanges = false;
        works.forEach(work => { if (!this.newWorks.has(work.id)) { this.newWorks.set(work.id, work); hasChanges = true; } });
        if (hasChanges) {
            await this.saveNewWorks();
            try { await dbNewWorksBulkPut(works); } catch {}
        }
    }
}
