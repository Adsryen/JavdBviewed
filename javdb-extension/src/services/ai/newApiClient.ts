// New API客户端实现

import type {
    AISettings,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ModelsResponse,
    APIError,
    ConnectionTestResult
} from '../../types/ai';

/**
 * New API客户端
 * 实现与New API兼容的OpenAI协议接口
 */
export class NewApiClient {
    private settings: AISettings;

    constructor(settings: AISettings) {
        this.settings = settings;
    }

    /**
     * 更新设置
     */
    updateSettings(settings: AISettings): void {
        this.settings = settings;
    }

    /**
     * 获取认证头
     */
    private getAuthHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.settings.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * 构建完整的API URL
     */
    private buildApiUrl(endpoint: string): string {
        const baseUrl = this.settings.apiUrl.replace(/\/$/, '');
        return `${baseUrl}${endpoint}`;
    }

    /**
     * 发送HTTP请求
     */
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = this.buildApiUrl(endpoint);
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout * 1000);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData: APIError = await response.json().catch(() => ({
                    error: {
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        type: 'http_error'
                    }
                }));
                throw new Error(errorData.error.message);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('请求超时');
                }
                throw error;
            }
            throw new Error('未知错误');
        }
    }

    /**
     * 获取可用模型列表
     */
    async getModels(): Promise<ModelsResponse> {
        return this.makeRequest<ModelsResponse>('/v1/models');
    }

    /**
     * 创建聊天完成（非流式）
     */
    async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        return this.makeRequest<ChatCompletionResponse>('/v1/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                ...request,
                stream: false
            })
        });
    }

    /**
     * 创建流式聊天完成
     */
    async createStreamChatCompletion(request: ChatCompletionRequest): Promise<ReadableStream<Uint8Array>> {
        const url = this.buildApiUrl('/v1/chat/completions');
        const headers = this.getAuthHeaders();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout * 1000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...request,
                    stream: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData: APIError = await response.json().catch(() => ({
                    error: {
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        type: 'http_error'
                    }
                }));
                throw new Error(errorData.error.message);
            }

            if (!response.body) {
                throw new Error('响应体为空');
            }

            return response.body;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('请求超时');
                }
                throw error;
            }
            throw new Error('未知错误');
        }
    }

    /**
     * 测试连接
     */
    async testConnection(): Promise<ConnectionTestResult> {
        const startTime = Date.now();
        
        try {
            const modelsResponse = await this.getModels();
            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                responseTime,
                modelCount: modelsResponse.data.length
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                responseTime,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }

    /**
     * 验证设置
     */
    validateSettings(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.settings.apiUrl) {
            errors.push('API地址不能为空');
        } else {
            try {
                const url = new URL(this.settings.apiUrl);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    errors.push('API地址必须使用HTTP或HTTPS协议');
                }
            } catch {
                errors.push('API地址格式不正确');
            }
        }

        if (!this.settings.apiKey) {
            errors.push('API密钥不能为空');
        } else if (this.settings.apiKey.length < 10) {
            errors.push('API密钥长度过短');
        }

        if (this.settings.temperature < 0.1 || this.settings.temperature > 2.0) {
            errors.push('温度参数必须在0.1-2.0之间');
        }

        if (this.settings.maxTokens < 1 || this.settings.maxTokens > 1000000) {
            errors.push('最大token数必须在1-1,000,000之间');
        }

        if (this.settings.timeout < 5 || this.settings.timeout > 300) {
            errors.push('超时时间必须在5-300秒之间');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 重试请求
     */
    private async retryRequest<T>(
        requestFn: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 1000
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('未知错误');

                if (attempt === maxRetries) {
                    break;
                }

                // 指数退避延迟
                const waitTime = delay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        throw lastError!;
    }

    /**
     * 获取模型列表（带重试）
     */
    async getModelsWithRetry(maxRetries: number = 3): Promise<ModelsResponse> {
        return this.retryRequest(() => this.getModels(), maxRetries);
    }

    /**
     * 检查API健康状态
     */
    async checkHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
        const startTime = Date.now();

        try {
            await this.getModels();
            const latency = Date.now() - startTime;
            return { healthy: true, latency };
        } catch (error) {
            const latency = Date.now() - startTime;
            return {
                healthy: false,
                latency,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
}

/**
 * 解析流式响应
 */
export class StreamParser {
    private decoder = new TextDecoder();
    private buffer = '';
    private isComplete = false;

    /**
     * 解析流式数据块
     */
    parseChunk(chunk: Uint8Array): ChatCompletionResponse[] {
        if (this.isComplete) {
            return [];
        }

        const text = this.decoder.decode(chunk, { stream: true });
        this.buffer += text;

        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        const results: ChatCompletionResponse[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }

            // 处理SSE格式
            if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);

                if (data === '[DONE]') {
                    this.isComplete = true;
                    continue;
                }

                try {
                    const parsed = JSON.parse(data) as ChatCompletionResponse;
                    results.push(parsed);
                } catch (error) {
                    console.warn('解析流式数据失败:', error, data);
                }
            } else if (trimmed.startsWith('event: ') || trimmed.startsWith('id: ')) {
                // 忽略SSE事件和ID行
                continue;
            } else {
                // 尝试直接解析JSON（某些API可能不使用标准SSE格式）
                try {
                    const parsed = JSON.parse(trimmed) as ChatCompletionResponse;
                    results.push(parsed);
                } catch (error) {
                    console.warn('解析非SSE格式数据失败:', error, trimmed);
                }
            }
        }

        return results;
    }

    /**
     * 检查是否完成
     */
    isStreamComplete(): boolean {
        return this.isComplete;
    }

    /**
     * 重置解析器
     */
    reset(): void {
        this.buffer = '';
        this.isComplete = false;
    }

    /**
     * 获取缓冲区内容（用于调试）
     */
    getBuffer(): string {
        return this.buffer;
    }
}
