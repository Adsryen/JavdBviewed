// src/services/dataAggregator/index.ts
// 数据聚合器主入口

import { globalCache } from '../../utils/cache';
import { BlogJavSource, DEFAULT_BLOGJAV_CONFIG } from './sources/blogJav';
import { TranslatorService, DEFAULT_TRANSLATOR_CONFIG } from './sources/translator';
import { AITranslatorService, DEFAULT_AI_TRANSLATOR_CONFIG } from './sources/aiTranslator';
import type { AITranslatorConfig } from './sources/aiTranslator';
import { JavLibrarySource, DEFAULT_JAVLIBRARY_CONFIG } from './sources/javLibrary';
import {
  VideoMetadata,
  ImageData,
  TranslationResult,
  ApiResponse,
  BatchResult,
  DataSourceConfig,
} from './types';

export interface DataAggregatorConfig {
  sources: DataSourceConfig;
  concurrency: number;
  timeout: number;
}

export class DataAggregator {
  private blogJav!: BlogJavSource;
  private translator!: TranslatorService;
  private aiTranslator!: AITranslatorService;
  private javLibrary!: JavLibrarySource;
  private config: DataAggregatorConfig;

  constructor(config: Partial<DataAggregatorConfig> = {}) {
    this.config = {
      concurrency: 3,
      timeout: 15000,
      sources: {
        blogJav: DEFAULT_BLOGJAV_CONFIG,
        javStore: { enabled: false, baseUrl: '', timeout: 10000 },
        javSpyl: { enabled: false, baseUrl: '', timeout: 10000 },
        javLibrary: DEFAULT_JAVLIBRARY_CONFIG,
        dmm: { enabled: false, baseUrl: '', timeout: 10000 },
        fc2: { enabled: false, baseUrl: '', timeout: 10000 },
        translator: DEFAULT_TRANSLATOR_CONFIG,
      },
      ...config,
    };

    this.initializeSources();
  }

  /**
   * 获取增强的视频信息
   */
  async getEnhancedVideoInfo(videoId: string): Promise<VideoMetadata> {
    const cacheKey = `enhanced_video_${videoId}`;
    
    // 尝试从缓存获取
    if (this.config.enableCache) {
      const cached = await globalCache.getVideoDetail(cacheKey);
      if (cached) {
        return cached as VideoMetadata;
      }
    }

    const metadata: VideoMetadata = {
      id: videoId,
      lastUpdated: Date.now(),
    };

    // 并行获取各种数据
    const promises: Promise<any>[] = [];

    // 获取封面图片
    if (this.config.sources.blogJav.enabled) {
      promises.push(
        this.blogJav.getCoverImage(videoId).then(result => {
          if (result.success && result.data) {
            metadata.images = result.data;
          }
        }).catch(() => {}) // 忽略错误，继续其他数据获取
      );
    }

    // 获取封面图片等其他信息
    if (this.config.sources.javLibrary.enabled) {
      promises.push(
        this.javLibrary.getVideoInfo(videoId).then(result => {
          if (result.success && result.data) {
            if (result.data.title) {
              metadata.title = result.data.title;
              metadata.originalTitle = result.data.title;
            }
            if (result.data.releaseDate) {
              metadata.releaseDate = result.data.releaseDate;
            }
            if (result.data.studio) {
              metadata.studio = result.data.studio;
            }
            if (result.data.genre) {
              metadata.genre = result.data.genre;
            }
          }
        }).catch(() => {})
      );
    }

    // 等待所有数据获取完成
    await Promise.all(promises);

    // 翻译标题（如果有原标题且启用翻译）
    if (metadata.title && this.config.sources.translator.enabled) {
      try {
        const translationResult = await this.translateText(metadata.title);
        if (translationResult.success && translationResult.data) {
          metadata.translatedTitle = translationResult.data.translatedText;
        }
      } catch {
        // 翻译失败，忽略错误
      }
    }

    return metadata;
  }

  /**
   * 批量获取封面图片
   */
  async batchGetCoverImages(videoIds: string[]): Promise<BatchResult<ImageData[]>> {
    const startTime = Date.now();
    const results: Array<ApiResponse<ImageData[]>> = [];

    if (this.config.sources.blogJav.enabled) {
      const blogJavResults = await this.blogJav.batchGetCoverImages(videoIds);
      results.push(...blogJavResults);
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      cached: results.filter(r => r.cached).length,
      duration: Date.now() - startTime,
    };

    return { results, summary };
  }

  /**
   * 翻译文本
   */
  async translateText(text: string): Promise<ApiResponse<TranslationResult>> {
    if (!this.config.sources.translator.enabled) {
      return {
        success: false,
        error: 'Translator is disabled',
        source: 'DataAggregator',
        timestamp: Date.now(),
      };
    }

    // 取消翻译缓存：总是直接调用翻译服务

    // 根据配置选择翻译服务
    let result: ApiResponse<TranslationResult>;

    // 检查是否应该使用AI翻译
    const shouldUseAI = await this.shouldUseAITranslation();

    if (shouldUseAI) {
      result = await this.aiTranslator.translate(text);
    } else {
      result = await this.translator.translate(text);
    }

    return result;
  }

  /**
   * 使用AI翻译文本
   */
  async translateTextWithAI(text: string): Promise<ApiResponse<TranslationResult>> {
    // 取消翻译缓存：总是直接调用 AI 翻译服务
    console.log('[DataAggregator] translateTextWithAI called with text:', text);
    console.log('[DataAggregator] AI translator config:', this.aiTranslator.getConfig());

    const result = await this.aiTranslator.translate(text);
    console.log('[DataAggregator] AI translation result:', result);

    return result;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DataAggregatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeSources();
  }

  /**
   * 更新AI翻译配置
   */
  updateAITranslatorConfig(config: Partial<AITranslatorConfig>): void {
    if (this.aiTranslator) {
      this.aiTranslator.updateConfig(config);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): DataAggregatorConfig {
    return { ...this.config };
  }

  /**
   * 清理缓存
   */
  async clearCache(): Promise<void> {
    if (this.config.enableCache) {
      await globalCache.clearAll();
    }
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<Record<string, { count: number; size: number }>> {
    if (this.config.enableCache) {
      return await globalCache.getStats();
    }
    return {};
  }

  // 私有方法

  private initializeSources(): void {
    this.blogJav = new BlogJavSource(this.config.sources.blogJav);
    this.translator = new TranslatorService(this.config.sources.translator);
    this.aiTranslator = new AITranslatorService(DEFAULT_AI_TRANSLATOR_CONFIG);
    this.javLibrary = new JavLibrarySource(this.config.sources.javLibrary);
  }

  /**
   * 检查是否应该使用AI翻译
   */
  private async shouldUseAITranslation(): Promise<boolean> {
    try {
      // 检查AI翻译服务是否可用
      const aiAvailable = await this.aiTranslator.isAvailable();
      if (!aiAvailable) {
        return false;
      }

      // 动态获取当前设置以确定翻译提供商
      const { getSettings } = await import('../../utils/storage');
      const settings = await getSettings();

      return settings.dataEnhancement?.enableTranslation &&
             settings.translation?.provider === 'ai';
    } catch {
      return false;
    }
  }
}

// 默认数据聚合器实例
export const defaultDataAggregator = new DataAggregator();

// 导出类型和工具函数
export * from './types';
export { BlogJavSource, TranslatorService, JavLibrarySource };
export { HttpClient, defaultHttpClient } from './httpClient';
