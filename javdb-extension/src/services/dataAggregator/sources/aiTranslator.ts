// src/services/dataAggregator/sources/aiTranslator.ts
// AI翻译服务 - 使用AI进行翻译

import { ApiResponse, TranslationResult, DataSourceError } from '../types';
import { AI_PROMPTS } from '../../ai/config';

export interface AITranslatorConfig {
  enabled: boolean;
  useGlobalModel: boolean;
  customModel?: string;
  timeout: number;
  maxRetries: number;
  sourceLanguage: string;
  targetLanguage: string;
}

export class AITranslatorService {
  private config: AITranslatorConfig;

  constructor(config: AITranslatorConfig) {
    this.config = config;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AITranslatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 翻译文本
   */
  async translate(text: string): Promise<ApiResponse<TranslationResult>> {
    try {
      if (!this.config.enabled) {
        throw new DataSourceError('AI Translator service is disabled', 'AITranslator');
      }

      if (!text || text.trim().length === 0) {
        throw new DataSourceError('Text to translate is empty', 'AITranslator');
      }

      // 检查AI服务是否可用
      // 这里暂时跳过AI服务检查，在实际使用时会检查
      // const aiSettings = aiService.getSettings();
      // if (!aiSettings.enabled) {
      //   throw new DataSourceError('AI service is not enabled', 'AITranslator');
      // }

      // 检查是否需要翻译（如果已经是目标语言）
      if (!this.needsTranslation(text)) {
        return {
          success: true,
          data: {
            originalText: text,
            translatedText: text,
            sourceLanguage: this.config.targetLanguage,
            targetLanguage: this.config.targetLanguage,
            confidence: 1.0,
            service: 'ai',
            timestamp: Date.now(),
          },
          source: 'AITranslator',
          timestamp: Date.now(),
        };
      }

      const result = await this.translateWithAI(text);

      return {
        success: true,
        data: result,
        source: 'AITranslator',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI translation failed',
        source: 'AITranslator',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 使用AI进行翻译
   */
  private async translateWithAI(text: string): Promise<TranslationResult> {
    try {
      // 动态导入AI服务以避免循环依赖
      const { aiService } = await import('../../ai/aiService');

      // 构建翻译提示词
      const systemPrompt = AI_PROMPTS.titleTranslation.system;
      const userPrompt = AI_PROMPTS.titleTranslation.user(text);

      // 准备AI请求
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      // 确定使用的模型
      const model = this.config.useGlobalModel
        ? aiService.getSettings().selectedModel
        : this.config.customModel;

      if (!model) {
        throw new Error('No AI model configured for translation');
      }

      // 发送AI请求（使用统一的 sendMessage 接口）
      // aiService 会使用其 settings.selectedModel；此处已在上面决定 model，并依赖“全局模型”生效
      const chatResponse = await aiService.sendMessage(messages as any);

      const reply = chatResponse?.choices?.[0]?.message?.content || '';
      const translatedText = reply.trim();
      if (!translatedText) {
        throw new Error('Empty translation content');
      }

      return {
        originalText: text,
        translatedText,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguage: this.config.targetLanguage,
        confidence: 0.9, // AI翻译的置信度
        // 在 service 字段中包含具体模型，便于前端控制台输出引擎/模型来源
        service: `ai:${model}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new DataSourceError(
        `AI translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AITranslator'
      );
    }
  }

  /**
   * 检查是否需要翻译
   */
  private needsTranslation(text: string): boolean {
    // 简单的语言检测：如果包含日文字符，则需要翻译
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    return japaneseRegex.test(text);
  }

  /**
   * 检查AI翻译是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { aiService } = await import('../../ai/aiService');
      const aiSettings = aiService.getSettings();
      if (!aiSettings.enabled || !aiSettings.apiKey) {
        return false;
      }

      const model = this.config.useGlobalModel
        ? aiSettings.selectedModel
        : this.config.customModel;

      return !!model;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AITranslatorConfig {
    return { ...this.config };
  }
}

// 默认AI翻译配置
export const DEFAULT_AI_TRANSLATOR_CONFIG: AITranslatorConfig = {
  enabled: false,
  useGlobalModel: true,
  timeout: 30000,
  maxRetries: 2,
  sourceLanguage: 'ja',
  targetLanguage: 'zh-CN',
};
