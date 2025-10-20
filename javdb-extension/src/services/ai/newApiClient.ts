// New API客户端实现

import type {
    AISettings,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ModelsResponse,
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
            // Mixed Content 检查：HTTPS 页面请求 HTTP 接口会被浏览器拦截
            if (typeof window !== 'undefined') {
                const pageIsHttps = window.location.protocol === 'https:';
                const reqIsHttp = url.startsWith('http://');
                if (pageIsHttps && reqIsHttp) {
                    const msg = `Mixed Content: 当前页面为 HTTPS，但 AI 接口为 HTTP（${url}）。请将 API 地址改为 HTTPS。`;
                    console.error('[AI][createChatCompletion] ' + msg);
                    throw new Error(msg);
                }
            }
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let body: any = undefined;
                try { body = await response.json(); } catch {}
                const status = response.status;
                const statusText = response.statusText || '';
                const serverMsg = (body as any)?.error?.message || (body as any)?.message || '';
                let msg = serverMsg || `HTTP ${status}: ${statusText}`;
                // 分类提示
                if (status === 401 || status === 403) {
                    msg = `鉴权失败(${status})：请检查 API Key 是否正确/有效` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status === 404) {
                    msg = `接口不存在(404)：请检查 API 地址是否正确（注意不要重复或缺少“/v1”）` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status === 408) {
                    msg = `服务端超时(408)` + (serverMsg ? `：${serverMsg}` : '');
                } else if (status === 413) {
                    msg = `请求体过大(413)` + (serverMsg ? `：${serverMsg}` : '');
                } else if (status === 429) {
                    msg = `超出速率限制(429)：请降低请求频率或更换模型/Key` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status >= 500) {
                    msg = `服务器错误(${status})` + (serverMsg ? `：${serverMsg}` : '');
                }
                throw new Error(msg);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`请求超时（客户端等待 ${this.settings.timeout}s）`);
                }
                // fetch 网络层错误常表现为 TypeError: Failed to fetch
                if (error.name === 'TypeError' || /Failed to fetch/i.test(error.message)) {
                    throw new Error(`网络错误：可能是网络不可达、证书问题、被浏览器拦截或跨域限制。原始信息：${error.message}`);
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
        // 优先按 JSON 解析；若服务端错误返回 SSE（以 data: 开头的文本），则降级解析并聚合为一个响应
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
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let body: any = undefined;
                try { body = await response.json(); } catch {}
                const status = response.status;
                const statusText = response.statusText || '';
                const serverMsg = (body as any)?.error?.message || (body as any)?.message || '';
                let msg = serverMsg || `HTTP ${status}: ${statusText}`;
                if (status === 401 || status === 403) {
                    msg = `鉴权失败(${status})：请检查 API Key 是否正确/有效` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status === 404) {
                    msg = `接口不存在(404)：请检查 API 地址是否正确（注意不要重复或缺少“/v1”）` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status === 408) {
                    msg = `服务端超时(408)` + (serverMsg ? `：${serverMsg}` : '');
                } else if (status === 413) {
                    msg = `请求体过大(413)` + (serverMsg ? `：${serverMsg}` : '');
                } else if (status === 429) {
                    msg = `超出速率限制(429)：请降低请求频率或更换模型/Key` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status >= 500) {
                    msg = `服务器错误(${status})` + (serverMsg ? `：${serverMsg}` : '');
                }
                throw new Error(msg);
            }

            const contentType = response.headers.get('content-type') || '';
            // 常规 JSON
            if (contentType.includes('application/json')) {
                return await response.json();
            }

            // 某些网关会错误地以 text/event-stream 返回非流式结果
            const raw = await response.text();
            // 尝试直接作为 JSON
            try {
                return JSON.parse(raw);
            } catch {
                // 按 SSE 行解析并聚合
                const lines = raw.split('\n');
                const chunks: ChatCompletionResponse[] = [];
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    if (trimmed.startsWith('data: ')) {
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data) as ChatCompletionResponse;
                            chunks.push(parsed);
                        } catch {
                            // 跳过无法解析的行
                        }
                    } else {
                        // 非标准行，尝试 JSON
                        try {
                            const parsed = JSON.parse(trimmed) as ChatCompletionResponse;
                            chunks.push(parsed);
                        } catch {
                            // 忽略
                        }
                    }
                }

                if (chunks.length === 0) {
                    throw new Error('无法解析AI服务返回内容');
                }

                // 聚合 content
                let finalText = '';
                let model = this.settings.selectedModel || chunks[0]?.model || '';
                let id = chunks[0]?.id || 'sse_fallback';
                let created = Math.floor(Date.now() / 1000);

                for (const c of chunks) {
                    const piece = (c as any)?.choices?.[0]?.delta?.content
                              ?? (c as any)?.choices?.[0]?.message?.content
                              ?? '';
                    if (piece) finalText += piece;
                    if (!model && (c as any)?.model) model = (c as any).model;
                    if ((c as any)?.id) id = (c as any).id;
                    if ((c as any)?.created) created = (c as any).created;
                }

                const result: ChatCompletionResponse = {
                    id,
                    object: 'chat.completion',
                    created,
                    model,
                    choices: [
                        {
                            index: 0,
                            finish_reason: 'stop',
                            message: { role: 'assistant', content: finalText }
                        } as any
                    ],
                    usage: undefined
                } as ChatCompletionResponse;

                return result;
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`请求超时（客户端等待 ${this.settings.timeout}s）`);
                }
                if (error.name === 'TypeError' || /Failed to fetch/i.test(error.message)) {
                    throw new Error(`网络错误：可能是网络不可达、证书问题、被浏览器拦截或跨域限制。原始信息：${error.message}`);
                }
                throw error;
            }
            throw new Error('未知错误');
        }
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
                let body: any = undefined;
                try { body = await response.json(); } catch {}
                const status = response.status;
                const statusText = response.statusText || '';
                const serverMsg = (body as any)?.error?.message || (body as any)?.message || '';
                let msg = serverMsg || `HTTP ${status}: ${statusText}`;
                if (status === 401 || status === 403) {
                    msg = `鉴权失败(${status})：请检查 API Key 是否正确/有效` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status === 404) {
                    msg = `接口不存在(404)：请检查 API 地址是否正确（注意不要重复或缺少“/v1”）` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status === 408) {
                    msg = `服务端超时(408)` + (serverMsg ? `：${serverMsg}` : '');
                } else if (status === 413) {
                    msg = `请求体过大(413)` + (serverMsg ? `：${serverMsg}` : '');
                } else if (status === 429) {
                    msg = `超出速率限制(429)：请降低请求频率或更换模型/Key` + (serverMsg ? `；服务端：${serverMsg}` : '');
                } else if (status >= 500) {
                    msg = `服务器错误(${status})` + (serverMsg ? `：${serverMsg}` : '');
                }
                throw new Error(msg);
            }

            if (!response.body) {
                throw new Error('响应体为空');
            }

            return response.body;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`请求超时（客户端等待 ${this.settings.timeout}s）`);
                }
                if (error.name === 'TypeError' || /Failed to fetch/i.test(error.message)) {
                    throw new Error(`网络错误：可能是网络不可达、证书问题、被浏览器拦截或跨域限制。原始信息：${error.message}`);
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
