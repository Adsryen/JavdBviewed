// src/services/actorManager.ts
// 演员数据存储和管理服务

import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { ActorRecord, ActorSearchResult } from '../types';

export class ActorManager {
    private cache: Map<string, ActorRecord> = new Map();
    private isLoaded = false;

    /**
     * 初始化演员管理器，加载本地数据
     */
    async initialize(): Promise<void> {
        if (this.isLoaded) return;
        
        try {
            const actors = await getValue<Record<string, ActorRecord>>(STORAGE_KEYS.ACTOR_RECORDS, {});
            this.cache.clear();
            
            // 将数据加载到缓存中
            Object.values(actors).forEach(actor => {
                this.cache.set(actor.id, actor);
            });
            
            this.isLoaded = true;
            console.log(`ActorManager: Loaded ${this.cache.size} actors`);
        } catch (error) {
            console.error('ActorManager: Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * 获取所有演员记录
     */
    async getAllActors(): Promise<ActorRecord[]> {
        await this.initialize();
        return Array.from(this.cache.values());
    }

    /**
     * 根据ID获取演员记录
     */
    async getActorById(id: string): Promise<ActorRecord | null> {
        await this.initialize();
        return this.cache.get(id) || null;
    }

    /**
     * 根据名称搜索演员（支持主名和别名）
     */
    async searchActorsByName(query: string): Promise<ActorRecord[]> {
        await this.initialize();
        const lowerQuery = query.toLowerCase();
        
        return Array.from(this.cache.values()).filter(actor => {
            // 搜索主名
            if (actor.name.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            // 搜索别名
            return actor.aliases.some(alias => 
                alias.toLowerCase().includes(lowerQuery)
            );
        });
    }

    /**
     * 分页搜索演员
     */
    async searchActors(
        query: string = '',
        page: number = 1,
        pageSize: number = 20,
        sortBy: 'name' | 'updatedAt' | 'worksCount' = 'name',
        sortOrder: 'asc' | 'desc' = 'asc'
    ): Promise<ActorSearchResult> {
        await this.initialize();
        
        let actors = Array.from(this.cache.values());
        
        // 过滤
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            actors = actors.filter(actor => {
                return actor.name.toLowerCase().includes(lowerQuery) ||
                       actor.aliases.some(alias => alias.toLowerCase().includes(lowerQuery));
            });
        }
        
        // 排序
        actors.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'updatedAt':
                    aValue = a.updatedAt;
                    bValue = b.updatedAt;
                    break;
                case 'worksCount':
                    aValue = a.details?.worksCount || 0;
                    bValue = b.details?.worksCount || 0;
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }
            
            if (sortOrder === 'desc') {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
        });
        
        // 分页
        const total = actors.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageActors = actors.slice(startIndex, endIndex);
        
        return {
            actors: pageActors,
            total,
            page,
            pageSize,
            hasMore: endIndex < total
        };
    }

    /**
     * 添加或更新演员记录
     */
    async saveActor(actor: ActorRecord): Promise<void> {
        await this.initialize();
        
        const now = Date.now();
        const existingActor = this.cache.get(actor.id);
        
        // 更新时间戳
        if (existingActor) {
            actor.updatedAt = now;
            actor.createdAt = existingActor.createdAt; // 保持原创建时间
        } else {
            actor.createdAt = now;
            actor.updatedAt = now;
        }
        
        // 更新缓存
        this.cache.set(actor.id, actor);
        
        // 保存到存储
        await this.saveToStorage();
    }

    /**
     * 批量保存演员记录
     */
    async saveActors(actors: ActorRecord[]): Promise<void> {
        await this.initialize();
        
        const now = Date.now();
        
        actors.forEach(actor => {
            const existingActor = this.cache.get(actor.id);
            
            if (existingActor) {
                actor.updatedAt = now;
                actor.createdAt = existingActor.createdAt;
            } else {
                actor.createdAt = now;
                actor.updatedAt = now;
            }
            
            this.cache.set(actor.id, actor);
        });
        
        await this.saveToStorage();
    }

    /**
     * 删除演员记录
     */
    async deleteActor(id: string): Promise<boolean> {
        await this.initialize();
        
        if (this.cache.has(id)) {
            this.cache.delete(id);
            await this.saveToStorage();
            return true;
        }
        
        return false;
    }

    /**
     * 清空所有演员记录
     */
    async clearAllActors(): Promise<void> {
        this.cache.clear();
        await this.saveToStorage();
    }

    /**
     * 获取统计信息
     */
    async getStats(): Promise<{
        total: number;
        byGender: Record<string, number>;
        recentlyAdded: number; // 最近7天添加的
        recentlyUpdated: number; // 最近7天更新的
    }> {
        await this.initialize();
        
        const actors = Array.from(this.cache.values());
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        
        const byGender: Record<string, number> = {};
        let recentlyAdded = 0;
        let recentlyUpdated = 0;
        
        actors.forEach(actor => {
            // 按性别统计
            byGender[actor.gender] = (byGender[actor.gender] || 0) + 1;
            
            // 最近添加
            if (actor.createdAt > weekAgo) {
                recentlyAdded++;
            }
            
            // 最近更新
            if (actor.updatedAt > weekAgo) {
                recentlyUpdated++;
            }
        });
        
        return {
            total: actors.length,
            byGender,
            recentlyAdded,
            recentlyUpdated
        };
    }

    /**
     * 保存数据到存储
     */
    private async saveToStorage(): Promise<void> {
        try {
            const actorsObject: Record<string, ActorRecord> = {};
            this.cache.forEach((actor, id) => {
                actorsObject[id] = actor;
            });
            
            await setValue(STORAGE_KEYS.ACTOR_RECORDS, actorsObject);
        } catch (error) {
            console.error('ActorManager: Failed to save to storage:', error);
            throw error;
        }
    }

    /**
     * 导出演员数据
     */
    async exportActors(): Promise<ActorRecord[]> {
        await this.initialize();
        return Array.from(this.cache.values());
    }

    /**
     * 导入演员数据
     */
    async importActors(actors: ActorRecord[], mode: 'replace' | 'merge' = 'merge'): Promise<{
        imported: number;
        updated: number;
        skipped: number;
    }> {
        await this.initialize();
        
        if (mode === 'replace') {
            this.cache.clear();
        }
        
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        
        const now = Date.now();
        
        actors.forEach(actor => {
            const existing = this.cache.get(actor.id);
            
            if (existing) {
                if (mode === 'merge' && existing.updatedAt >= actor.updatedAt) {
                    skipped++;
                    return;
                }
                updated++;
                actor.createdAt = existing.createdAt;
                actor.updatedAt = now;
            } else {
                imported++;
                actor.createdAt = actor.createdAt || now;
                actor.updatedAt = now;
            }
            
            this.cache.set(actor.id, actor);
        });
        
        await this.saveToStorage();
        
        return { imported, updated, skipped };
    }
}

// 单例实例
export const actorManager = new ActorManager();
