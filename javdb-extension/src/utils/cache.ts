// src/utils/cache.ts
// 智能缓存管理系统

import { getValue, setValue } from './storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expireAt: number;
}

export interface CacheConfig {
  defaultTTL: number; // 默认过期时间（毫秒）
  maxEntries: number; // 最大缓存条目数
  cleanupInterval: number; // 清理间隔（毫秒）
}

export interface VideoDetail {
  id: string;
  title?: string;
  translatedTitle?: string;
  coverImage?: string;
  previewVideo?: string;
  ratings?: Rating[];
  actors?: Actor[];
  studio?: string;
  series?: string;
  genre?: string[];
  releaseDate?: string;
}

export interface Rating {
  source: string;
  score: number;
  total: number;
  count?: number;
}

export interface Actor {
  name: string;
  avatar?: string;
}

export interface ResourceData {
  images?: string[];
  videos?: string[];
  magnets?: MagnetLink[];
}

export interface MagnetLink {
  name: string;
  link: string;
  size: string;
  date: string;
  source: string;
  hasSubtitle: boolean;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
  maxEntries: 1000,
  cleanupInterval: 60 * 60 * 1000, // 1小时清理一次
};

const CACHE_KEYS = {
  VIDEO_DETAILS: 'cache_video_details',
  RESOURCES: 'cache_resources',
  TRANSLATIONS: 'cache_translations',
  CONFIG: 'cache_config',
} as const;

export class CacheManager {
  private config: CacheConfig;
  private cleanupTimer?: number;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * 获取视频详情缓存
   */
  async getVideoDetail(videoId: string): Promise<VideoDetail | null> {
    const cache = await this.getCache<VideoDetail>(CACHE_KEYS.VIDEO_DETAILS);
    const entry = cache[videoId];
    
    if (!entry) return null;
    if (this.isExpired(entry)) {
      await this.removeFromCache(CACHE_KEYS.VIDEO_DETAILS, videoId);
      return null;
    }
    
    return entry.data;
  }

  /**
   * 设置视频详情缓存
   */
  async setVideoDetail(videoId: string, data: VideoDetail, ttl?: number): Promise<void> {
    await this.setCache(CACHE_KEYS.VIDEO_DETAILS, videoId, data, ttl);
  }

  /**
   * 获取资源缓存
   */
  async getResource(key: string): Promise<ResourceData | null> {
    const cache = await this.getCache<ResourceData>(CACHE_KEYS.RESOURCES);
    const entry = cache[key];
    
    if (!entry) return null;
    if (this.isExpired(entry)) {
      await this.removeFromCache(CACHE_KEYS.RESOURCES, key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * 设置资源缓存
   */
  async setResource(key: string, data: ResourceData, ttl?: number): Promise<void> {
    await this.setCache(CACHE_KEYS.RESOURCES, key, data, ttl);
  }

  /**
   * 获取翻译缓存
   */
  async getTranslation(text: string): Promise<string | null> {
    const cache = await this.getCache<string>(CACHE_KEYS.TRANSLATIONS);
    const key = this.hashString(text);
    const entry = cache[key];
    
    if (!entry) return null;
    if (this.isExpired(entry)) {
      await this.removeFromCache(CACHE_KEYS.TRANSLATIONS, key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * 设置翻译缓存
   */
  async setTranslation(text: string, translation: string, ttl?: number): Promise<void> {
    const key = this.hashString(text);
    await this.setCache(CACHE_KEYS.TRANSLATIONS, key, translation, ttl);
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    const cacheKeys = Object.values(CACHE_KEYS);
    
    for (const cacheKey of cacheKeys) {
      const cache = await this.getCache(cacheKey);
      const cleanedCache: Record<string, CacheEntry<any>> = {};
      let removedCount = 0;
      
      for (const [key, entry] of Object.entries(cache)) {
        if (!this.isExpired(entry)) {
          cleanedCache[key] = entry;
        } else {
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        await setValue(cacheKey, cleanedCache);
        console.log(`[Cache] Cleaned ${removedCount} expired entries from ${cacheKey}`);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    const cacheKeys = Object.values(CACHE_KEYS);
    for (const cacheKey of cacheKeys) {
      await setValue(cacheKey, {});
    }
    console.log('[Cache] All caches cleared');
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<Record<string, { count: number; size: number }>> {
    const stats: Record<string, { count: number; size: number }> = {};
    
    for (const [name, cacheKey] of Object.entries(CACHE_KEYS)) {
      const cache = await this.getCache(cacheKey);
      const entries = Object.values(cache);
      stats[name] = {
        count: entries.length,
        size: JSON.stringify(cache).length,
      };
    }
    
    return stats;
  }

  /**
   * 停止清理定时器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  // 私有方法

  private async getCache<T>(cacheKey: string): Promise<Record<string, CacheEntry<T>>> {
    return await getValue<Record<string, CacheEntry<T>>>(cacheKey, {});
  }

  private async setCache<T>(cacheKey: string, key: string, data: T, ttl?: number): Promise<void> {
    const cache = await this.getCache<T>(cacheKey);
    const now = Date.now();
    const expireAt = now + (ttl || this.config.defaultTTL);
    
    cache[key] = {
      data,
      timestamp: now,
      expireAt,
    };
    
    // 检查缓存大小限制
    const entries = Object.entries(cache);
    if (entries.length > this.config.maxEntries) {
      // 删除最旧的条目
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.config.maxEntries);
      toRemove.forEach(([removeKey]) => delete cache[removeKey]);
    }
    
    await setValue(cacheKey, cache);
  }

  private async removeFromCache(cacheKey: string, key: string): Promise<void> {
    const cache = await this.getCache(cacheKey);
    delete cache[key];
    await setValue(cacheKey, cache);
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expireAt;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup().catch(console.error);
    }, this.config.cleanupInterval);
  }
}

// 全局缓存实例
export const globalCache = new CacheManager();
