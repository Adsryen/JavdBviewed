/**
 * AI服务相关类型定义
 */

// AI配置接口
export interface AIConfig {
  enabled: boolean;                    // 是否启用AI功能
  provider: 'openai' | 'newapi';      // AI提供商
  apiKey: string;                      // API密钥
  baseUrl: string;                     // API基础URL
  model: string;                       // 使用的模型
  maxTokens: number;                   // 最大token数
  temperature: number;                 // 温度参数
  timeout: number;                     // 请求超时时间
  streamEnabled: boolean;              // 是否启用流式响应
  features: AIFeatures;                // AI功能特性
  rateLimit: AIRateLimit;              // 速率限制配置
}

// AI功能特性配置
export interface AIFeatures {
  titleTranslation: boolean;           // 标题翻译
  contentSummary: boolean;             // 内容摘要
  tagGeneration: boolean;              // 标签生成
  recommendation: boolean;             // 智能推荐
}

// 速率限制配置
export interface AIRateLimit {
  requestsPerMinute: number;           // 每分钟请求限制
  requestsPerHour: number;             // 每小时请求限制
}

// 聊天消息接口
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// AI请求接口
export interface AIRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

// AI响应接口
export interface AIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AIChoice[];
  usage: AIUsage;
}

// AI选择项接口
export interface AIChoice {
  index: number;
  message: ChatMessage;
  finishReason: string | null;
}

// AI使用统计接口
export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// 流式响应块接口
export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: StreamChoice[];
}

// 流式选择项接口
export interface StreamChoice {
  index: number;
  delta: {
    role?: string;
    content?: string;
  };
  finishReason?: string | null;
}

// AI错误类
export class AIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// 速率限制错误类
export class RateLimitError extends AIError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

// AI提供商接口
export interface AIProvider {
  name: string;
  baseUrl: string;
  supportedModels: string[];
  chat(request: AIRequest): Promise<AIResponse>;
  chatStream(request: AIRequest): AsyncGenerator<StreamChunk>;
  validateConfig(config: AIConfig): Promise<boolean>;
}

// AI功能结果接口
export interface AIFunctionResult {
  success: boolean;
  data?: any;
  error?: string;
  usage?: AIUsage;
}

// 翻译结果接口
export interface TranslationResult extends AIFunctionResult {
  data?: {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
  };
}

// 摘要结果接口
export interface SummaryResult extends AIFunctionResult {
  data?: {
    originalText: string;
    summary: string;
    keyPoints: string[];
  };
}

// 标签生成结果接口
export interface TagGenerationResult extends AIFunctionResult {
  data?: {
    originalText: string;
    tags: string[];
    categories: string[];
  };
}

// 推荐结果接口
export interface RecommendationResult extends AIFunctionResult {
  data?: {
    recommendations: {
      id: string;
      title: string;
      reason: string;
      score: number;
    }[];
  };
}
