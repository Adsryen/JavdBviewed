// AI功能相关类型定义

/**
 * AI设置配置
 */
export interface AISettings {
    /** 是否启用AI功能 */
    enabled: boolean;
    /** API服务地址 */
    apiUrl: string;
    /** API密钥 */
    apiKey: string;
    /** 选中的模型ID */
    selectedModel: string;
    /** 温度参数 (0.1-2.0) */
    temperature: number;
    /** 最大token数 */
    maxTokens: number;
    /** 是否启用流式输出 */
    streamEnabled: boolean;
    /** 系统提示词 */
    systemPrompt: string;
    /** 连接超时时间(秒) */
    timeout: number;
    /** 当模型返回空内容时自动重试 */
    autoRetryEmpty: boolean;
    /** 自动重试的最大次数（仅在 autoRetryEmpty=true 时生效） */
    autoRetryMax: number;
    /** 对超时/网络错误/429/5xx 进行错误重试 */
    errorRetryEnabled?: boolean;
    /** 错误重试最大次数（指数退避） */
    errorRetryMax?: number;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
    /** 消息角色 */
    role: 'system' | 'user' | 'assistant';
    /** 消息内容 */
    content: string;
    /** 消息时间戳 */
    timestamp?: number;
}

/**
 * AI模型信息
 */
export interface AIModel {
    /** 模型ID */
    id: string;
    /** 模型名称 */
    name: string;
    /** 模型描述 */
    description?: string;
    /** 模型所有者 */
    owned_by?: string;
    /** 创建时间 */
    created?: number;
    /** 模型对象类型 */
    object: string;
    /** 是否可用 */
    available?: boolean;
}

/**
 * 模型列表响应
 */
export interface ModelsResponse {
    /** 对象类型 */
    object: 'list';
    /** 模型列表 */
    data: AIModel[];
}

/**
 * 聊天完成请求参数
 */
export interface ChatCompletionRequest {
    /** 模型ID */
    model: string;
    /** 消息列表 */
    messages: ChatMessage[];
    /** 温度参数 */
    temperature?: number;
    /** 最大token数 */
    max_tokens?: number;
    /** 是否流式输出 */
    stream?: boolean;
    /** 系统提示词 */
    system?: string;
}

/**
 * 聊天完成响应
 */
export interface ChatCompletionResponse {
    /** 响应ID */
    id: string;
    /** 对象类型 */
    object: 'chat.completion' | 'chat.completion.chunk';
    /** 创建时间 */
    created: number;
    /** 模型ID */
    model: string;
    /** 选择列表 */
    choices: ChatCompletionChoice[];
    /** 使用情况 */
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * 聊天完成选择
 */
export interface ChatCompletionChoice {
    /** 选择索引 */
    index: number;
    /** 消息内容 */
    message?: ChatMessage;
    /** 增量内容(流式) */
    delta?: {
        role?: string;
        content?: string;
    };
    /** 结束原因 */
    finish_reason?: 'stop' | 'length' | 'content_filter' | null;
}

/**
 * 流式响应数据块
 */
export interface StreamChunk {
    /** 数据内容 */
    data: string;
    /** 是否为结束标记 */
    done: boolean;
}

/**
 * API错误响应
 */
export interface APIError {
    /** 错误信息 */
    error: {
        message: string;
        type: string;
        code?: string;
    };
}

/**
 * 连接测试结果
 */
export interface ConnectionTestResult {
    /** 是否成功 */
    success: boolean;
    /** 响应时间(毫秒) */
    responseTime?: number;
    /** 错误信息 */
    error?: string;
    /** 可用模型数量 */
    modelCount?: number;
}

/**
 * AI服务状态
 */
export interface AIServiceStatus {
    /** 是否已连接 */
    connected: boolean;
    /** 当前模型 */
    currentModel?: string;
    /** 最后错误 */
    lastError?: string;
    /** 最后更新时间 */
    lastUpdate: number;
}

/**
 * 默认AI设置
 */
export const DEFAULT_AI_SETTINGS: AISettings = {
    enabled: false,
    apiUrl: '',
    apiKey: '',
    selectedModel: '',
    temperature: 0.7,
    maxTokens: 2048,
    streamEnabled: true,
    systemPrompt: '你是一个有用的AI助手，请用中文回答问题。',
    timeout: 120,
    autoRetryEmpty: false,
    autoRetryMax: 2,
    errorRetryEnabled: false,
    errorRetryMax: 2
};
/**
 * AI设置存储键
 */
export const AI_STORAGE_KEYS = {
    SETTINGS: 'ai_settings',
    MODELS_CACHE: 'ai_models_cache',
    CHAT_HISTORY: 'ai_chat_history'
} as const;
