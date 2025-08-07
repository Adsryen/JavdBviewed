/**
 * AI服务配置管理
 */

import type { AIConfig } from './types';

// AI默认配置
export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 30000,
  streamEnabled: true,
  features: {
    titleTranslation: false,
    contentSummary: false,
    tagGeneration: false,
    recommendation: false,
  },
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
  }
};

// 预设的AI提供商配置
export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    supportedModels: [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4',
      'gpt-4-32k',
      'gpt-4-turbo-preview',
      'gpt-4o',
      'gpt-4o-mini'
    ],
    defaultModel: 'gpt-3.5-turbo'
  },
  newapi: {
    name: 'New-API',
    baseUrl: '',
    supportedModels: [
      'gpt-3.5-turbo',
      'gpt-4',
      'claude-3-haiku',
      'claude-3-sonnet',
      'claude-3-opus',
      'gemini-pro',
      'qwen-turbo',
      'qwen-plus',
      'qwen-max'
    ],
    defaultModel: 'gpt-3.5-turbo'
  }
} as const;

// AI功能提示词模板
export const AI_PROMPTS = {
  titleTranslation: {
    system: '你是一个专业的日文翻译助手，专门翻译影片标题。请将用户提供的日文标题翻译成自然流畅的中文，保持原意的同时让中文读者容易理解。',
    user: (title: string) => `请将以下日文标题翻译成中文：\n\n${title}\n\n只返回翻译结果，不要包含其他内容。`
  },
  contentSummary: {
    system: '你是一个专业的内容摘要助手。请为用户提供的内容生成简洁明了的摘要，突出关键信息。',
    user: (content: string) => `请为以下内容生成摘要：\n\n${content}\n\n请用中文回答，摘要应该简洁明了，突出关键信息。`
  },
  tagGeneration: {
    system: '你是一个专业的内容标签生成助手。根据提供的内容，生成相关的标签和分类。',
    user: (content: string) => `请为以下内容生成相关标签：\n\n${content}\n\n请返回JSON格式：{"tags": ["标签1", "标签2"], "categories": ["分类1", "分类2"]}`
  },
  recommendation: {
    system: '你是一个智能推荐助手。根据用户的偏好和历史记录，推荐相关内容。',
    user: (preferences: string) => `基于以下用户偏好，推荐相关内容：\n\n${preferences}\n\n请返回JSON格式的推荐列表。`
  }
} as const;

// API端点配置
export const API_ENDPOINTS = {
  chat: '/v1/chat/completions',
  models: '/v1/models',
  usage: '/v1/usage'
} as const;

// 错误消息映射
export const ERROR_MESSAGES = {
  INVALID_API_KEY: 'API密钥无效，请检查您的密钥是否正确',
  RATE_LIMIT_EXCEEDED: 'API请求频率超限，请稍后再试',
  INSUFFICIENT_QUOTA: 'API配额不足，请检查您的账户余额',
  MODEL_NOT_FOUND: '指定的模型不存在，请检查模型名称',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  INVALID_REQUEST: '请求参数无效，请检查配置',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  UNKNOWN_ERROR: '未知错误，请联系技术支持'
} as const;

// 验证AI配置
export function validateAIConfig(config: AIConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey.trim()) {
    errors.push('API密钥不能为空');
  }

  if (!config.baseUrl.trim()) {
    errors.push('API地址不能为空');
  } else {
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('API地址格式无效');
    }
  }

  if (!config.model.trim()) {
    errors.push('模型名称不能为空');
  }

  if (config.maxTokens < 1 || config.maxTokens > 32768) {
    errors.push('最大Token数必须在1-32768之间');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('温度参数必须在0-2之间');
  }

  if (config.timeout < 1000 || config.timeout > 300000) {
    errors.push('超时时间必须在1-300秒之间');
  }

  if (config.rateLimit.requestsPerMinute < 1 || config.rateLimit.requestsPerMinute > 1000) {
    errors.push('每分钟请求数必须在1-1000之间');
  }

  if (config.rateLimit.requestsPerHour < 1 || config.rateLimit.requestsPerHour > 10000) {
    errors.push('每小时请求数必须在1-10000之间');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 获取提供商配置
export function getProviderConfig(provider: keyof typeof AI_PROVIDERS) {
  return AI_PROVIDERS[provider];
}

// 生成请求头
export function generateHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'JavDB-Extension/1.0'
  };
}
