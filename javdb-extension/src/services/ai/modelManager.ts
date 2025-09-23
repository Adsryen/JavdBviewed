// AI模型管理器

import type { AIModel, AISettings } from '../../types/ai';
import { NewApiClient } from './newApiClient';

/**
 * 模型缓存数据
 */
interface ModelCache {
    models: AIModel[];
    timestamp: number;
    apiUrl: string;
}

/**
 * AI模型管理器
 * 负责模型列表的获取、缓存和管理
 */
export class ModelManager {
    private client: NewApiClient;
    private cache: ModelCache | null = null;
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

    constructor(settings: AISettings) {
        this.client = new NewApiClient(settings);
        this.loadCache();
    }

    /**
     * 更新设置
     */
    updateSettings(settings: AISettings): void {
        this.client.updateSettings(settings);
        // 如果API地址变了，清除缓存
        if (this.cache && this.cache.apiUrl !== settings.apiUrl) {
            this.clearCache();
        }
    }

    /**
     * 从存储加载缓存
     */
    private async loadCache(): Promise<void> {
        try {
            const result = await chrome.storage.local.get('ai_models_cache');
            const cached = result['ai_models_cache'];

            if (cached && this.isCacheValid(cached)) {
                this.cache = cached;
            }
        } catch (error) {
            console.warn('加载模型缓存失败:', error);
        }
    }

    /**
     * 保存缓存到存储
     */
    private async saveCache(): Promise<void> {
        if (!this.cache) return;

        try {
            await chrome.storage.local.set({
                'ai_models_cache': this.cache
            });
        } catch (error) {
            console.warn('保存模型缓存失败:', error);
        }
    }

    /**
     * 检查缓存是否有效
     */
    private isCacheValid(cache: ModelCache): boolean {
        const now = Date.now();
        return (now - cache.timestamp) < this.CACHE_DURATION;
    }

    /**
     * 清除缓存
     */
    async clearCache(): Promise<void> {
        this.cache = null;
        try {
            await chrome.storage.local.remove('ai_models_cache');
        } catch (error) {
            console.warn('清除模型缓存失败:', error);
        }
    }

    /**
     * 获取模型列表（优先使用缓存）
     */
    async getModels(forceRefresh = false): Promise<AIModel[]> {
        // 如果有有效缓存且不强制刷新，直接返回缓存
        if (!forceRefresh && this.cache && this.isCacheValid(this.cache)) {
            return this.cache.models;
        }

        try {
            // 从API获取最新模型列表
            const response = await this.client.getModels();
            const models = this.processModels(response.data);

            // 更新缓存
            this.cache = {
                models,
                timestamp: Date.now(),
                apiUrl: this.client['settings'].apiUrl
            };

            await this.saveCache();
            return models;
        } catch (error) {
            // 如果API请求失败，尝试使用过期缓存
            if (this.cache) {
                console.warn('获取模型列表失败，使用缓存数据:', error);
                return this.cache.models;
            }
            throw error;
        }
    }

    /**
     * 处理模型数据
     */
    private processModels(models: AIModel[]): AIModel[] {
        return models
            .filter(model => model.id && model.object === 'model')
            .map(model => ({
                ...model,
                name: model.name || model.id,
                available: true
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * 根据ID查找模型
     */
    async findModel(modelId: string): Promise<AIModel | null> {
        const models = await this.getModels();
        return models.find(model => model.id === modelId) || null;
    }

    /**
     * 获取推荐模型
     */
    async getRecommendedModels(): Promise<AIModel[]> {
        const models = await this.getModels();
        
        // 优先推荐常见的聊天模型
        const preferredModels = [
            'gpt-3.5-turbo',
            'gpt-4',
            'gpt-4-turbo',
            'claude-3',
            'gemini-pro'
        ];

        const recommended: AIModel[] = [];
        const others: AIModel[] = [];

        for (const model of models) {
            const isPreferred = preferredModels.some(preferred => 
                model.id.toLowerCase().includes(preferred.toLowerCase())
            );
            
            if (isPreferred) {
                recommended.push(model);
            } else {
                others.push(model);
            }
        }

        return [...recommended, ...others];
    }

    /**
     * 验证模型是否可用
     */
    async validateModel(modelId: string): Promise<boolean> {
        try {
            const model = await this.findModel(modelId);
            return model !== null && model.available !== false;
        } catch {
            return false;
        }
    }

    /**
     * 获取缓存状态
     */
    getCacheStatus(): { cached: boolean; timestamp?: number; count?: number } {
        if (!this.cache) {
            return { cached: false };
        }

        return {
            cached: true,
            timestamp: this.cache.timestamp,
            count: this.cache.models.length
        };
    }

    /**
     * 搜索模型
     */
    async searchModels(query: string): Promise<AIModel[]> {
        const models = await this.getModels();
        const lowerQuery = query.toLowerCase();

        return models.filter(model => 
            model.id.toLowerCase().includes(lowerQuery) ||
            model.name.toLowerCase().includes(lowerQuery) ||
            (model.description && model.description.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * 获取模型统计信息
     */
    async getModelStats(): Promise<{
        total: number;
        byOwner: Record<string, number>;
        byType: Record<string, number>;
        cacheAge?: number;
        lastUpdate?: number;
    }> {
        const models = await this.getModels();
        const byOwner: Record<string, number> = {};
        const byType: Record<string, number> = {};

        for (const model of models) {
            const owner = model.owned_by || 'unknown';
            byOwner[owner] = (byOwner[owner] || 0) + 1;

            // 根据模型ID推断类型
            const modelType = this.inferModelType(model.id);
            byType[modelType] = (byType[modelType] || 0) + 1;
        }

        const stats = {
            total: models.length,
            byOwner,
            byType
        };

        if (this.cache) {
            return {
                ...stats,
                cacheAge: Date.now() - this.cache.timestamp,
                lastUpdate: this.cache.timestamp
            };
        }

        return stats;
    }

    /**
     * 推断模型类型
     */
    private inferModelType(modelId: string): string {
        const id = modelId.toLowerCase();

        if (id.includes('gpt')) return 'GPT';
        if (id.includes('claude')) return 'Claude';
        if (id.includes('gemini')) return 'Gemini';
        if (id.includes('llama')) return 'LLaMA';
        if (id.includes('mistral')) return 'Mistral';
        if (id.includes('qwen')) return 'Qwen';
        if (id.includes('baichuan')) return 'Baichuan';
        if (id.includes('chatglm')) return 'ChatGLM';

        return 'Other';
    }

    /**
     * 获取模型能力信息
     */
    getModelCapabilities(modelId: string): {
        maxTokens?: number;
        supportsFunctions?: boolean;
        supportsVision?: boolean;
        costTier?: 'low' | 'medium' | 'high';
    } {
        const id = modelId.toLowerCase();

        // 基于模型ID推断能力
        const capabilities: any = {};

        if (id.includes('gpt-4')) {
            capabilities.maxTokens = 8192;
            capabilities.supportsFunctions = true;
            capabilities.costTier = 'high';
            if (id.includes('vision')) {
                capabilities.supportsVision = true;
            }
        } else if (id.includes('gpt-3.5')) {
            capabilities.maxTokens = 4096;
            capabilities.supportsFunctions = true;
            capabilities.costTier = 'medium';
        } else if (id.includes('claude')) {
            capabilities.maxTokens = 100000;
            capabilities.costTier = 'high';
        } else if (id.includes('gemini')) {
            capabilities.maxTokens = 32768;
            capabilities.costTier = 'medium';
        }

        return capabilities;
    }

    /**
     * 按类型分组模型
     */
    async getModelsByType(): Promise<Record<string, AIModel[]>> {
        const models = await this.getModels();
        const grouped: Record<string, AIModel[]> = {};

        for (const model of models) {
            const type = this.inferModelType(model.id);
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(model);
        }

        return grouped;
    }

    /**
     * 获取最适合的模型推荐
     */
    async getBestModelForTask(task: 'chat' | 'code' | 'creative' | 'analysis'): Promise<AIModel | null> {
        const models = await this.getModels();

        // 根据任务类型推荐模型
        const preferences: Record<string, string[]> = {
            chat: ['gpt-3.5-turbo', 'gpt-4', 'claude'],
            code: ['gpt-4', 'claude', 'gpt-3.5-turbo'],
            creative: ['gpt-4', 'claude', 'gemini'],
            analysis: ['gpt-4', 'claude', 'gemini']
        };

        const preferred = preferences[task] || preferences.chat;

        for (const preference of preferred) {
            const model = models.find(m =>
                m.id.toLowerCase().includes(preference.toLowerCase())
            );
            if (model) {
                return model;
            }
        }

        // 如果没有找到推荐模型，返回第一个可用模型
        return models.length > 0 ? models[0] : null;
    }
}
