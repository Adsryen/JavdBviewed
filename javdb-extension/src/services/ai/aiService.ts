// AI服务核心类

import type {
    AISettings,
    ChatMessage,
    ChatCompletionRequest,
    ChatCompletionResponse,
    AIModel,
    ConnectionTestResult,
    AIServiceStatus
} from '../../types/ai';
import { DEFAULT_AI_SETTINGS } from '../../types/ai';
import { NewApiClient, StreamParser } from './newApiClient';
import { ModelManager } from './modelManager';
import { getSettings, saveSettings as saveMainSettings } from '../../utils/storage';

/**
 * AI服务核心类
 * 提供统一的AI功能接口
 */
export class AIService {
    private settings: AISettings = { ...DEFAULT_AI_SETTINGS };
    private client: NewApiClient;
    private modelManager: ModelManager;
    private status: AIServiceStatus;

    constructor() {
        this.client = new NewApiClient(this.settings);
        this.modelManager = new ModelManager(this.settings);
        this.status = {
            connected: false,
            lastUpdate: Date.now()
        };
        
        this.loadSettings();
    }

    /**
     * 加载设置
     */
    private async loadSettings(): Promise<void> {
        try {
            const mainSettings = await getSettings();
            // 确保AI设置存在并正确合并默认值
            this.settings = {
                ...DEFAULT_AI_SETTINGS,
                ...(mainSettings.ai || {})
            };
            this.updateClients();
        } catch (error) {
            console.warn('加载AI设置失败:', error);
            this.settings = { ...DEFAULT_AI_SETTINGS };
        }
    }

    /**
     * 保存设置
     */
    async saveSettings(settings: Partial<AISettings>): Promise<void> {
        this.settings = { ...this.settings, ...settings };

        try {
            // 获取当前主设置
            const mainSettings = await getSettings();
            // 更新AI设置部分
            mainSettings.ai = this.settings;
            // 保存到主设置系统
            await saveMainSettings(mainSettings);
            this.updateClients();
        } catch (error) {
            console.error('保存AI设置失败:', error);
            throw new Error('保存设置失败');
        }
    }

    /**
     * 更新客户端设置
     */
    private updateClients(): void {
        this.client.updateSettings(this.settings);
        this.modelManager.updateSettings(this.settings);
        this.status.lastUpdate = Date.now();
    }

    /**
     * 获取当前设置
     */
    getSettings(): AISettings {
        return { ...this.settings };
    }

    /**
     * 获取服务状态
     */
    getStatus(): AIServiceStatus {
        return { ...this.status };
    }

    /**
     * 测试连接
     */
    async testConnection(): Promise<ConnectionTestResult> {
        try {
            const result = await this.client.testConnection();
            this.status.connected = result.success;
            this.status.lastError = result.error;
            this.status.lastUpdate = Date.now();
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            this.status.connected = false;
            this.status.lastError = errorMessage;
            this.status.lastUpdate = Date.now();
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * 获取可用模型列表
     */
    async getAvailableModels(forceRefresh = false): Promise<AIModel[]> {
        try {
            return await this.modelManager.getModels(forceRefresh);
        } catch (error) {
            this.status.lastError = error instanceof Error ? error.message : '获取模型列表失败';
            throw error;
        }
    }

    /**
     * 获取推荐模型
     */
    async getRecommendedModels(): Promise<AIModel[]> {
        return this.modelManager.getRecommendedModels();
    }

    /**
     * 验证模型
     */
    async validateModel(modelId: string): Promise<boolean> {
        return this.modelManager.validateModel(modelId);
    }

    /**
     * 发送聊天消息（非流式）
     */
    async sendMessage(messages: ChatMessage[]): Promise<ChatCompletionResponse> {
        if (!this.settings.enabled) {
            throw new Error('AI功能未启用');
        }

        if (!this.settings.selectedModel) {
            throw new Error('未选择模型');
        }

        const request: ChatCompletionRequest = {
            model: this.settings.selectedModel,
            messages: this.prepareMessages(messages),
            temperature: this.settings.temperature,
            max_tokens: this.settings.maxTokens,
            stream: false
        };

        try {
            const response = await this.client.createChatCompletion(request);
            this.status.connected = true;
            this.status.currentModel = this.settings.selectedModel;
            this.status.lastError = undefined;
            this.status.lastUpdate = Date.now();
            
            return response;
        } catch (error) {
            this.status.connected = false;
            this.status.lastError = error instanceof Error ? error.message : '发送消息失败';
            this.status.lastUpdate = Date.now();
            throw error;
        }
    }

    /**
     * 发送流式聊天消息
     */
    async sendStreamMessage(
        messages: ChatMessage[],
        onChunk: (chunk: ChatCompletionResponse) => void,
        onComplete: () => void,
        onError: (error: Error) => void
    ): Promise<void> {
        if (!this.settings.enabled) {
            throw new Error('AI功能未启用');
        }

        if (!this.settings.selectedModel) {
            throw new Error('未选择模型');
        }

        const request: ChatCompletionRequest = {
            model: this.settings.selectedModel,
            messages: this.prepareMessages(messages),
            temperature: this.settings.temperature,
            max_tokens: this.settings.maxTokens,
            stream: true
        };

        try {
            const stream = await this.client.createStreamChatCompletion(request);
            const parser = new StreamParser();
            const reader = stream.getReader();

            this.status.connected = true;
            this.status.currentModel = this.settings.selectedModel;
            this.status.lastError = undefined;
            this.status.lastUpdate = Date.now();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        onComplete();
                        break;
                    }

                    const chunks = parser.parseChunk(value);
                    for (const chunk of chunks) {
                        onChunk(chunk);
                    }
                }
            } finally {
                reader.releaseLock();
                parser.reset();
            }
        } catch (error) {
            this.status.connected = false;
            this.status.lastError = error instanceof Error ? error.message : '流式消息发送失败';
            this.status.lastUpdate = Date.now();
            onError(error instanceof Error ? error : new Error('流式消息发送失败'));
        }
    }

    /**
     * 准备消息列表
     */
    private prepareMessages(messages: ChatMessage[]): ChatMessage[] {
        const prepared = [...messages];
        
        // 如果有系统提示词且第一条消息不是系统消息，则添加系统消息
        if (this.settings.systemPrompt && 
            (prepared.length === 0 || prepared[0].role !== 'system')) {
            prepared.unshift({
                role: 'system',
                content: this.settings.systemPrompt
            });
        }

        return prepared;
    }

    /**
     * 验证设置
     */
    validateSettings(): { valid: boolean; errors: string[] } {
        return this.client.validateSettings();
    }

    /**
     * 清除模型缓存
     */
    async clearModelCache(): Promise<void> {
        await this.modelManager.clearCache();
    }

    /**
     * 获取模型统计信息
     */
    async getModelStats(): Promise<any> {
        return this.modelManager.getModelStats();
    }

    /**
     * 搜索模型
     */
    async searchModels(query: string): Promise<AIModel[]> {
        return this.modelManager.searchModels(query);
    }

    /**
     * 重置服务
     */
    reset(): void {
        this.status = {
            connected: false,
            lastUpdate: Date.now()
        };
    }

    /**
     * 检查服务健康状态
     */
    async checkHealth(): Promise<{
        healthy: boolean;
        latency?: number;
        modelCount?: number;
        error?: string;
    }> {
        try {
            const startTime = Date.now();
            const models = await this.getAvailableModels();
            const latency = Date.now() - startTime;

            this.status.connected = true;
            this.status.lastError = undefined;
            this.status.lastUpdate = Date.now();

            return {
                healthy: true,
                latency,
                modelCount: models.length
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '健康检查失败';
            this.status.connected = false;
            this.status.lastError = errorMessage;
            this.status.lastUpdate = Date.now();

            return {
                healthy: false,
                error: errorMessage
            };
        }
    }

    /**
     * 获取推荐的任务模型
     */
    async getRecommendedModelForTask(task: 'chat' | 'code' | 'creative' | 'analysis'): Promise<AIModel | null> {
        return this.modelManager.getBestModelForTask(task);
    }

    /**
     * 按类型获取模型
     */
    async getModelsByType(): Promise<Record<string, AIModel[]>> {
        return this.modelManager.getModelsByType();
    }

    /**
     * 获取模型能力信息
     */
    getModelCapabilities(modelId: string): any {
        return this.modelManager.getModelCapabilities(modelId);
    }

    /**
     * 批量发送消息（用于测试多个模型）
     */
    async batchSendMessage(
        messages: ChatMessage[],
        modelIds: string[]
    ): Promise<Array<{ modelId: string; response?: ChatCompletionResponse; error?: string }>> {
        const results = [];
        const originalModel = this.settings.selectedModel;

        for (const modelId of modelIds) {
            try {
                // 临时切换模型
                this.settings.selectedModel = modelId;
                this.updateClients();

                const response = await this.sendMessage(messages);
                results.push({ modelId, response });
            } catch (error) {
                results.push({
                    modelId,
                    error: error instanceof Error ? error.message : '未知错误'
                });
            }
        }

        // 恢复原始模型
        this.settings.selectedModel = originalModel;
        this.updateClients();

        return results;
    }

    /**
     * 估算token使用量
     */
    estimateTokenUsage(text: string): number {
        // 简单的token估算：英文约4字符=1token，中文约1.5字符=1token
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const otherChars = text.length - chineseChars;

        return Math.ceil(chineseChars / 1.5 + otherChars / 4);
    }

    /**
     * 重置设置到默认值
     */
    async resetSettings(): Promise<void> {
        this.settings = { ...DEFAULT_AI_SETTINGS };
        
        try {
            // 获取当前主设置
            const mainSettings = await getSettings();
            // 重置AI设置部分
            mainSettings.ai = this.settings;
            // 保存到主设置系统
            await saveMainSettings(mainSettings);
            this.updateClients();
        } catch (error) {
            console.error('重置AI设置失败:', error);
            throw new Error('重置设置失败');
        }
    }

}

// 全局AI服务实例
export const aiService = new AIService();
